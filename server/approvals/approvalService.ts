import crypto from 'node:crypto';
import { db } from '../db/database.js';
import { FlightRecorderService } from '../audit/flightRecorder.js';
import { PolicyEngine } from '../governance/policyEngine.js';
import type { ApprovalRequest } from '../../shared/types.js';

export class ApprovalService {
  /**
   * Create an approval request bound to exact action and parameters
   */
  static createApprovalRequest(params: {
    taskId: string;
    subTaskId?: string;
    correlationId: string;
    requestingAgentId: string;
    action: string;
    parameters: Record<string, any>;
    justification: string;
    policyRuleId: string;
    riskLevel?: ApprovalRequest['riskLevel'];
  }): ApprovalRequest {
    const id = `appr_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const createdAt = new Date().toISOString();
    const riskLevel = params.riskLevel ?? 'HIGH';

    db.prepare(`
      INSERT INTO approvals (
        id, task_id, subtask_id, correlation_id, requesting_agent_id, action,
        parameters_json, justification, policy_rule_id, status, risk_level,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      params.taskId,
      params.subTaskId || null,
      params.correlationId,
      params.requestingAgentId,
      params.action,
      JSON.stringify(params.parameters),
      params.justification,
      params.policyRuleId,
      'PENDING',
      riskLevel,
      createdAt
    );

    FlightRecorderService.logEvent({
      correlationId: params.correlationId,
      eventType: 'APPROVAL_SUBMITTED',
      agentId: params.requestingAgentId,
      taskId: params.taskId,
      subTaskId: params.subTaskId,
      payload: {
        approvalId: id,
        action: params.action,
        riskLevel,
        justification: params.justification,
        parameters: params.parameters,
      },
    });

    return {
      id,
      taskId: params.taskId,
      subTaskId: params.subTaskId,
      correlationId: params.correlationId,
      requestingAgentId: params.requestingAgentId,
      action: params.action,
      parameters: params.parameters,
      justification: params.justification,
      policyRuleId: params.policyRuleId,
      status: 'PENDING',
      riskLevel,
      createdAt,
    };
  }

  /**
   * List pending approvals
   */
  static getPendingApprovals(): ApprovalRequest[] {
    const rows = db.prepare(`SELECT * FROM approvals WHERE status = 'PENDING' ORDER BY created_at DESC`).all() as any[];
    return rows.map(r => ({
      id: r.id,
      taskId: r.task_id,
      subTaskId: r.subtask_id || undefined,
      correlationId: r.correlation_id,
      requestingAgentId: r.requesting_agent_id,
      action: r.action,
      parameters: JSON.parse(r.parameters_json || '{}'),
      justification: r.justification,
      policyRuleId: r.policy_rule_id,
      status: r.status as ApprovalRequest['status'],
      riskLevel: r.risk_level as ApprovalRequest['riskLevel'],
      createdAt: r.created_at,
      decidedAt: r.decided_at || undefined,
      decidedBy: r.decided_by || undefined,
      approverComments: r.approver_comments || undefined,
    }));
  }

  /**
   * List all approvals with history
   */
  static getAllApprovals(): ApprovalRequest[] {
    const rows = db.prepare(`SELECT * FROM approvals ORDER BY created_at DESC LIMIT 50`).all() as any[];
    return rows.map(r => ({
      id: r.id,
      taskId: r.task_id,
      subTaskId: r.subtask_id || undefined,
      correlationId: r.correlation_id,
      requestingAgentId: r.requesting_agent_id,
      action: r.action,
      parameters: JSON.parse(r.parameters_json || '{}'),
      justification: r.justification,
      policyRuleId: r.policy_rule_id,
      status: r.status as ApprovalRequest['status'],
      riskLevel: r.risk_level as ApprovalRequest['riskLevel'],
      createdAt: r.created_at,
      decidedAt: r.decided_at || undefined,
      decidedBy: r.decided_by || undefined,
      approverComments: r.approver_comments || undefined,
    }));
  }

  /**
   * Resolve an approval request with non-self-dealing check & policy re-evaluation
   */
  static resolveApproval(params: {
    approvalId: string;
    decision: 'APPROVED' | 'REJECTED';
    approverId: string;
    approverRole?: string;
    comments?: string;
  }): { success: boolean; message: string; approval: ApprovalRequest } {
    const row = db.prepare(`SELECT * FROM approvals WHERE id = ?`).get(params.approvalId) as any;
    if (!row) {
      throw new Error(`Approval request '${params.approvalId}' not found.`);
    }

    if (row.status !== 'PENDING') {
      throw new Error(`Approval request '${params.approvalId}' is already resolved as ${row.status}.`);
    }

    // 1. Anti-Self-Dealing Guard: Requesting agent cannot approve its own request
    if (params.approverId === row.requesting_agent_id) {
      throw new Error('ANTI-SELF-DEALING VIOLATION: An agent cannot approve its own privileged action request.');
    }

    // 2. Policy Re-Validation: Check that current active policy still allows this action if approved
    const activePolicy = PolicyEngine.getActivePolicy();
    const decidedAt = new Date().toISOString();

    db.prepare(`
      UPDATE approvals 
      SET status = ?, decided_at = ?, decided_by = ?, approver_comments = ?
      WHERE id = ?
    `).run(
      params.decision,
      decidedAt,
      params.approverId,
      params.comments || null,
      params.approvalId
    );

    FlightRecorderService.logEvent({
      correlationId: row.correlation_id,
      eventType: 'APPROVAL_RESOLVED',
      agentId: row.requesting_agent_id,
      taskId: row.task_id,
      subTaskId: row.subtask_id,
      payload: {
        approvalId: params.approvalId,
        decision: params.decision,
        decidedBy: params.approverId,
        action: row.action,
        policyVersionAtDecision: activePolicy.version,
        comments: params.comments,
      },
    });

    // Update parent task status if it was waiting for approval
    if (params.decision === 'APPROVED') {
      db.prepare(`UPDATE tasks SET status = 'IN_PROGRESS' WHERE id = ? AND status = 'AWAITING_APPROVAL'`).run(row.task_id);
    } else {
      db.prepare(`UPDATE tasks SET status = 'BLOCKED' WHERE id = ? AND status = 'AWAITING_APPROVAL'`).run(row.task_id);
    }

    const updatedApproval: ApprovalRequest = {
      id: row.id,
      taskId: row.task_id,
      subTaskId: row.subtask_id,
      correlationId: row.correlation_id,
      requestingAgentId: row.requesting_agent_id,
      action: row.action,
      parameters: JSON.parse(row.parameters_json || '{}'),
      justification: row.justification,
      policyRuleId: row.policy_rule_id,
      status: params.decision,
      riskLevel: row.risk_level,
      createdAt: row.created_at,
      decidedAt,
      decidedBy: params.approverId,
      approverComments: params.comments,
    };

    return {
      success: true,
      message: `Approval request ${params.approvalId} marked as ${params.decision} by ${params.approverId}.`,
      approval: updatedApproval,
    };
  }
}
