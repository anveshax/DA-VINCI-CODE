import crypto from 'node:crypto';
import { db } from '../db/database.js';
import { FlightRecorderService } from '../audit/flightRecorder.js';
import type { KnowledgeItem, AgentRole, ResourceClassification } from '../../shared/types.js';

export interface KnowledgeReuseCheckResult {
  canReuse: boolean;
  item?: KnowledgeItem;
  reason: string;
  blockReasonCode?: 'NOT_FOUND' | 'EXPIRED_OR_STALE' | 'SCOPE_UNAUTHORIZED' | 'VERSION_MISMATCH' | 'UNVERIFIED';
}

export class KnowledgeService {
  /**
   * List all knowledge items in the repository
   */
  static listAll(): KnowledgeItem[] {
    const rows = db.prepare(`SELECT * FROM knowledge_items ORDER BY created_at DESC`).all() as any[];
    return rows.map(r => ({
      id: r.id,
      title: r.title,
      content: r.content,
      sourceProvenance: r.source_provenance,
      ownership: r.ownership,
      classification: r.classification as ResourceClassification,
      authorizedAccessScopes: JSON.parse(r.authorized_access_scopes_json || '[]'),
      version: r.version,
      createdAt: r.created_at,
      expiresAt: r.expires_at,
      verificationStatus: r.verification_status as KnowledgeItem['verificationStatus'],
      producedByTaskId: r.produced_by_task_id || undefined,
      metadata: JSON.parse(r.metadata_json || '{}'),
    }));
  }

  /**
   * Find knowledge items accessible to a specific agent role & scopes
   */
  static queryForAgent(params: {
    agentId: string;
    agentRole: AgentRole;
    allowedScopes: string[];
    query?: string;
  }): KnowledgeItem[] {
    const all = this.listAll();
    return all.filter(item => {
      // Must match at least one authorized access scope or be PUBLIC
      const hasScopeAccess = 
        item.classification === 'PUBLIC' || 
        item.authorizedAccessScopes.some(s => params.allowedScopes.includes(s));

      if (!hasScopeAccess) return false;

      if (params.query) {
        const q = params.query.toLowerCase();
        const matches = 
          item.title.toLowerCase().includes(q) ||
          item.content.toLowerCase().includes(q) ||
          item.sourceProvenance.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }

  /**
   * Check whether an existing assessment/item can be safely reused for a new task
   */
  static evaluateSafeReuse(params: {
    vendorName: string;
    assessmentType: string;
    requestingAgentId: string;
    agentScopes: string[];
    correlationId: string;
    taskId: string;
  }): KnowledgeReuseCheckResult {
    const all = this.listAll();
    const candidate = all.find(item => {
      const vendor = item.metadata?.vendor;
      if (!vendor) return false;
      return vendor.toLowerCase() === params.vendorName.toLowerCase();
    });

    if (!candidate) {
      return {
        canReuse: false,
        reason: `No historical knowledge found for vendor '${params.vendorName}'. Fresh analysis required.`,
        blockReasonCode: 'NOT_FOUND',
      };
    }

    // 1. Check Verification Status
    if (candidate.verificationStatus === 'STALE' || candidate.verificationStatus === 'UNVERIFIED') {
      FlightRecorderService.logEvent({
        correlationId: params.correlationId,
        eventType: 'KNOWLEDGE_REUSE_BLOCKED',
        agentId: params.requestingAgentId,
        taskId: params.taskId,
        payload: {
          vendor: params.vendorName,
          knowledgeId: candidate.id,
          reason: `Verification status is ${candidate.verificationStatus}`,
          blockReasonCode: 'EXPIRED_OR_STALE',
        },
      });

      return {
        canReuse: false,
        item: candidate,
        reason: `Safe reuse BLOCKED: Assessment for '${params.vendorName}' is marked ${candidate.verificationStatus}. Must perform live re-audit.`,
        blockReasonCode: 'EXPIRED_OR_STALE',
      };
    }

    // 2. Check Expiry & Freshness
    const now = new Date();
    const expiry = new Date(candidate.expiresAt);
    if (now > expiry) {
      FlightRecorderService.logEvent({
        correlationId: params.correlationId,
        eventType: 'KNOWLEDGE_REUSE_BLOCKED',
        agentId: params.requestingAgentId,
        taskId: params.taskId,
        payload: {
          vendor: params.vendorName,
          knowledgeId: candidate.id,
          expiredAt: candidate.expiresAt,
          blockReasonCode: 'EXPIRED_OR_STALE',
        },
      });

      return {
        canReuse: false,
        item: candidate,
        reason: `Safe reuse BLOCKED: Assessment for '${params.vendorName}' expired on ${candidate.expiresAt.slice(0, 10)}. Stale intelligence cannot be reused.`,
        blockReasonCode: 'EXPIRED_OR_STALE',
      };
    }

    // 3. Check Scope Authorization
    const hasScope = candidate.authorizedAccessScopes.some(s => params.agentScopes.includes(s));
    if (!hasScope) {
      FlightRecorderService.logEvent({
        correlationId: params.correlationId,
        eventType: 'KNOWLEDGE_REUSE_BLOCKED',
        agentId: params.requestingAgentId,
        taskId: params.taskId,
        payload: {
          vendor: params.vendorName,
          knowledgeId: candidate.id,
          requiredScopes: candidate.authorizedAccessScopes,
          agentScopes: params.agentScopes,
          blockReasonCode: 'SCOPE_UNAUTHORIZED',
        },
      });

      return {
        canReuse: false,
        item: candidate,
        reason: `Safe reuse BLOCKED: Requesting agent lacks necessary scopes [${candidate.authorizedAccessScopes.join(', ')}].`,
        blockReasonCode: 'SCOPE_UNAUTHORIZED',
      };
    }

    // Eligible for Governed Reuse!
    FlightRecorderService.logEvent({
      correlationId: params.correlationId,
      eventType: 'KNOWLEDGE_RETRIEVED',
      agentId: params.requestingAgentId,
      taskId: params.taskId,
      payload: {
        vendor: params.vendorName,
        knowledgeId: candidate.id,
        provenance: candidate.sourceProvenance,
        version: candidate.version,
        action: 'SAFE_REUSE_APPROVED',
      },
    });

    return {
      canReuse: true,
      item: candidate,
      reason: `Safe reuse APPROVED: Verified fresh assessment (v${candidate.version}) available from provenance '${candidate.sourceProvenance}'.`,
    };
  }

  /**
   * Save a newly verified knowledge item produced by a workflow
   */
  static saveItem(item: Omit<KnowledgeItem, 'id' | 'createdAt'>): KnowledgeItem {
    const id = `kn_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const createdAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO knowledge_items (
        id, title, content, source_provenance, ownership, classification,
        authorized_access_scopes_json, version, created_at, expires_at,
        verification_status, produced_by_task_id, metadata_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      item.title,
      item.content,
      item.sourceProvenance,
      item.ownership,
      item.classification,
      JSON.stringify(item.authorizedAccessScopes),
      item.version,
      createdAt,
      item.expiresAt,
      item.verificationStatus,
      item.producedByTaskId || null,
      JSON.stringify(item.metadata)
    );

    return {
      ...item,
      id,
      createdAt,
    };
  }
}
