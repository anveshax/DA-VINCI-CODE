import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type { 
  AgentDefinition, 
  GovernancePolicy, 
  PolicyRule, 
  OrchestratedTask, 
  ApprovalRequest, 
  KnowledgeItem, 
  FlightRecorderEvent, 
  RecoveryEvent 
} from '../../shared/types.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'aegis_nexus.db');
export const db = new DatabaseSync(DB_PATH);

// Initialize Tables
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      description TEXT NOT NULL,
      avatar_icon TEXT NOT NULL,
      capabilities TEXT NOT NULL,
      allowed_tools TEXT NOT NULL,
      data_access_scopes TEXT NOT NULL,
      execution_limits TEXT NOT NULL,
      status TEXT NOT NULL,
      model_config TEXT NOT NULL,
      health_score INTEGER NOT NULL,
      consecutive_failures INTEGER NOT NULL,
      last_active_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS policies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      version TEXT NOT NULL,
      status TEXT NOT NULL,
      description TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      published_by TEXT
    );

    CREATE TABLE IF NOT EXISTS policy_rules (
      id TEXT PRIMARY KEY,
      policy_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      target_role TEXT,
      target_action TEXT NOT NULL,
      target_resource_scope TEXT,
      resource_classification TEXT,
      decision TEXT NOT NULL,
      approval_role_required TEXT,
      priority INTEGER NOT NULL,
      FOREIGN KEY (policy_id) REFERENCES policies(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      correlation_id TEXT NOT NULL,
      title TEXT NOT NULL,
      user_prompt TEXT NOT NULL,
      requester_json TEXT NOT NULL,
      status TEXT NOT NULL,
      subtasks_json TEXT NOT NULL,
      final_report_json TEXT,
      execution_mode TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      completed_at TEXT,
      total_tokens_used INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS approvals (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      subtask_id TEXT,
      correlation_id TEXT NOT NULL,
      requesting_agent_id TEXT NOT NULL,
      action TEXT NOT NULL,
      parameters_json TEXT NOT NULL,
      justification TEXT NOT NULL,
      policy_rule_id TEXT NOT NULL,
      status TEXT NOT NULL,
      risk_level TEXT NOT NULL,
      created_at TEXT NOT NULL,
      decided_at TEXT,
      decided_by TEXT,
      approver_comments TEXT
    );

    CREATE TABLE IF NOT EXISTS knowledge_items (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      source_provenance TEXT NOT NULL,
      ownership TEXT NOT NULL,
      classification TEXT NOT NULL,
      authorized_access_scopes_json TEXT NOT NULL,
      version TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      verification_status TEXT NOT NULL,
      produced_by_task_id TEXT,
      metadata_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS flight_recorder_events (
      sequence_number INTEGER PRIMARY KEY AUTOINCREMENT,
      id TEXT NOT NULL UNIQUE,
      correlation_id TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      event_type TEXT NOT NULL,
      agent_id TEXT,
      task_id TEXT,
      subtask_id TEXT,
      payload_json TEXT NOT NULL,
      previous_hash TEXT NOT NULL,
      hash TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS recovery_events (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      subtask_id TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      error_classification TEXT NOT NULL,
      raw_error TEXT NOT NULL,
      recovery_action TEXT NOT NULL,
      attempt_number INTEGER NOT NULL,
      max_attempts INTEGER NOT NULL,
      backoff_delay_ms INTEGER NOT NULL,
      repaired_payload_json TEXT,
      status TEXT NOT NULL,
      timestamp TEXT NOT NULL
    );
  `);

  seedInitialDataIfEmpty();
}

function seedInitialDataIfEmpty() {
  const agentCount = db.prepare('SELECT COUNT(*) as count FROM agents').get() as { count: number };
  if (agentCount.count > 0) return;

  const initialAgents: AgentDefinition[] = [
    {
      id: 'agent_orchestrator',
      name: 'Nexus Sovereign Planner',
      role: 'ORCHESTRATOR',
      description: 'Master workflow orchestrator and decomposition engine. Coordinates specialized agents and guarantees zero delegation loops.',
      avatarIcon: 'BrainCircuit',
      capabilities: ['DECOMPOSITION', 'AGENT_SELECTION', 'RECONCILIATION', 'BUDGET_TRACKING'],
      allowedTools: ['delegate_task', 'query_knowledge_index', 'reconcile_findings', 'synthesize_report'],
      dataAccessScopes: ['INTERNAL_SUMMARY', 'METADATA_ONLY'],
      executionLimits: {
        maxDelegations: 8,
        maxParallelTasks: 4,
        timeoutSeconds: 30,
        rateLimitPerMinute: 60,
      },
      status: 'ACTIVE',
      modelConfig: {
        provider: 'gemini',
        model: 'gemini-2.5-flash',
        temperature: 0.1,
      },
      healthScore: 100,
      consecutiveFailures: 0,
      lastActiveAt: new Date().toISOString(),
    },
    {
      id: 'agent_finance',
      name: 'Aegis Fiscal Sentinel',
      role: 'FINANCE_ANALYST',
      description: 'Financial auditor inspecting cost models, SaaS pricing, budget compliance, and ROI boundaries.',
      avatarIcon: 'Coins',
      capabilities: ['BUDGET_VERIFICATION', 'PRICING_AUDIT', 'EXPENSE_RECONCILIATION'],
      allowedTools: ['read_financial_ledger', 'verify_budget_headroom', 'query_pricing_tables'],
      dataAccessScopes: ['FINANCIAL_LEDGERS', 'VENDOR_PRICING', 'PROCUREMENT_RECORDS'],
      executionLimits: {
        maxDelegations: 0,
        maxParallelTasks: 2,
        timeoutSeconds: 20,
        rateLimitPerMinute: 30,
      },
      status: 'ACTIVE',
      modelConfig: {
        provider: 'gemini',
        model: 'gemini-2.5-flash',
        temperature: 0.2,
      },
      healthScore: 98,
      consecutiveFailures: 0,
      lastActiveAt: new Date().toISOString(),
    },
    {
      id: 'agent_security',
      name: 'Vigil Infosec Hunter',
      role: 'SECURITY_ANALYST',
      description: 'Zero-trust security evaluator checking SOC 2, ISO 27001, vulnerability posture, encryption, and egress risks.',
      avatarIcon: 'ShieldAlert',
      capabilities: ['SOC2_AUDIT', 'PEN_TEST_ANALYSIS', 'ENCRYPTION_VERIFICATION', 'THREAT_MODELING'],
      allowedTools: ['scan_vendor_certs', 'check_cve_database', 'inspect_data_residency'],
      dataAccessScopes: ['SECURITY_ARCHITECTURE', 'COMPLIANCE_CERTIFICATES', 'AUDIT_LOGS'],
      executionLimits: {
        maxDelegations: 0,
        maxParallelTasks: 2,
        timeoutSeconds: 25,
        rateLimitPerMinute: 40,
      },
      status: 'ACTIVE',
      modelConfig: {
        provider: 'gemini',
        model: 'gemini-2.5-flash',
        temperature: 0.1,
      },
      healthScore: 100,
      consecutiveFailures: 0,
      lastActiveAt: new Date().toISOString(),
    },
    {
      id: 'agent_legal',
      name: 'Justiciar Legal Counsel',
      role: 'LEGAL_ANALYST',
      description: 'Regulatory compliance specialist inspecting Master Services Agreements (MSA), indemnification, GDPR, and data transfer clauses.',
      avatarIcon: 'Scale',
      capabilities: ['MSA_REVIEW', 'INDEMNIFICATION_CHECK', 'GDPR_COMPLIANCE', 'LIABILITY_CAP_CHECK'],
      allowedTools: ['parse_contract_terms', 'check_regulatory_database', 'assess_ip_assignment'],
      dataAccessScopes: ['LEGAL_CONTRACTS', 'COMPLIANCE_REGISTRIES'],
      executionLimits: {
        maxDelegations: 0,
        maxParallelTasks: 2,
        timeoutSeconds: 30,
        rateLimitPerMinute: 30,
      },
      status: 'ACTIVE',
      modelConfig: {
        provider: 'gemini',
        model: 'gemini-2.5-flash',
        temperature: 0.2,
      },
      healthScore: 96,
      consecutiveFailures: 0,
      lastActiveAt: new Date().toISOString(),
    },
    {
      id: 'agent_infra',
      name: 'Atlas Operations Specialist',
      role: 'INFRA_OPS',
      description: 'Cloud reliability analyst verifying SLA commitments, uptime records, failover topology, and multi-region redundancy.',
      avatarIcon: 'Server',
      capabilities: ['SLA_VERIFICATION', 'LATENCY_MODELING', 'DISASTER_RECOVERY_AUDIT'],
      allowedTools: ['ping_status_page', 'verify_uptime_telemetry', 'check_region_support'],
      dataAccessScopes: ['INFRA_TELEMETRY', 'SLA_DOCUMENTS'],
      executionLimits: {
        maxDelegations: 0,
        maxParallelTasks: 3,
        timeoutSeconds: 15,
        rateLimitPerMinute: 50,
      },
      status: 'ACTIVE',
      modelConfig: {
        provider: 'gemini',
        model: 'gemini-2.5-flash',
        temperature: 0.1,
      },
      healthScore: 100,
      consecutiveFailures: 0,
      lastActiveAt: new Date().toISOString(),
    },
  ];

  const insertAgent = db.prepare(`
    INSERT INTO agents (
      id, name, role, description, avatar_icon, capabilities, allowed_tools,
      data_access_scopes, execution_limits, status, model_config, health_score,
      consecutive_failures, last_active_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const a of initialAgents) {
    insertAgent.run(
      a.id, a.name, a.role, a.description, a.avatarIcon,
      JSON.stringify(a.capabilities), JSON.stringify(a.allowedTools),
      JSON.stringify(a.dataAccessScopes), JSON.stringify(a.executionLimits),
      a.status, JSON.stringify(a.modelConfig), a.healthScore,
      a.consecutiveFailures, a.lastActiveAt
    );
  }

  // Seed Policies
  const activePolicyId = 'policy_enterprise_standard_v2';
  db.prepare(`
    INSERT INTO policies (id, name, version, status, description, created_at, updated_at, published_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    activePolicyId,
    'Enterprise Multi-Agent Operational Policy',
    '2.4.0',
    'ACTIVE',
    'Governs cross-departmental agent delegation, strictly segments financial ledgers, and mandates human approvals for contracts > $10,000.',
    new Date(Date.now() - 86400000 * 7).toISOString(),
    new Date().toISOString(),
    'Chief Information Security Officer (CISO)'
  );

  const initialRules: PolicyRule[] = [
    {
      id: 'rule_sec_deny_finance_data',
      policyId: activePolicyId,
      name: 'Enforce Financial Confidentiality Boundary',
      description: 'Security and DevOps agents are strictly barred from querying payroll, banking ledgers, and restricted pricing data.',
      targetRole: 'SECURITY_ANALYST',
      targetAction: 'READ_FINANCIAL_LEDGER',
      resourceClassification: 'RESTRICTED_FINANCE',
      decision: 'DENY',
      priority: 100,
    },
    {
      id: 'rule_sec_deny_payroll',
      policyId: activePolicyId,
      name: 'Infra Ops Financial Isolation',
      description: 'Infrastructure Ops cannot read financial or legal documents.',
      targetRole: 'INFRA_OPS',
      targetAction: 'READ_FINANCIAL_LEDGER',
      resourceClassification: 'RESTRICTED_FINANCE',
      decision: 'DENY',
      priority: 100,
    },
    {
      id: 'rule_require_approval_vendor_contract',
      policyId: activePolicyId,
      name: 'Mandate Human Authorization for Legal Commitments',
      description: 'Agents cannot finalize vendor onboarding contracts or agree to binding terms without authorized legal signatory sign-off.',
      targetAction: 'EXECUTE_VENDOR_CONTRACT',
      decision: 'REQUIRE_APPROVAL',
      approvalRoleRequired: 'VP_LEGAL_COUNSEL',
      priority: 90,
    },
    {
      id: 'rule_require_approval_budget_release',
      policyId: activePolicyId,
      name: 'Financial Disbursement Safeguard',
      description: 'Any expense or commitment exceeding $10,000 mandates authorized Human-in-the-Loop approval.',
      targetAction: 'APPROVE_BUDGET_DISBURSEMENT',
      decision: 'REQUIRE_APPROVAL',
      approvalRoleRequired: 'DIRECTOR_FINANCE',
      priority: 90,
    },
    {
      id: 'rule_deny_prompt_injection_tools',
      policyId: activePolicyId,
      name: 'Block Prompt Injection Overrides',
      description: 'Strictly deny any tool or parameter intended to override system governance prompts or bypass RBAC controls.',
      targetAction: 'INJECT_PROMPT_POLICY_BYPASS',
      decision: 'DENY',
      priority: 100,
    },
    {
      id: 'rule_deny_unregistered_delegation',
      policyId: activePolicyId,
      name: 'Prevent Unregistered Agent Delegation',
      description: 'Only the verified Sovereign Planner can delegate subtasks.',
      targetRole: 'ORCHESTRATOR',
      targetAction: 'DELEGATE_TASK',
      decision: 'ALLOW',
      priority: 50,
    },
    {
      id: 'rule_allow_finance_internal',
      policyId: activePolicyId,
      name: 'Permit Finance Analyst Accounting Review',
      description: 'Finance Analyst is authorized to read procurement records and cost sheets.',
      targetRole: 'FINANCE_ANALYST',
      targetAction: 'READ_FINANCIAL_LEDGER',
      decision: 'ALLOW',
      priority: 20,
    },
    {
      id: 'rule_allow_sec_audit',
      policyId: activePolicyId,
      name: 'Permit Security Analyst Security Cert Review',
      description: 'Security Analyst is authorized to inspect vendor security architecture and SOC2 reports.',
      targetRole: 'SECURITY_ANALYST',
      targetAction: 'SCAN_SECURITY_POSTURE',
      decision: 'ALLOW',
      priority: 20,
    },
    {
      id: 'rule_allow_legal_msa',
      policyId: activePolicyId,
      name: 'Permit Legal Analyst Contractual Review',
      description: 'Legal Analyst is authorized to inspect vendor terms of service, SLA, and DPA.',
      targetRole: 'LEGAL_ANALYST',
      targetAction: 'REVIEW_VENDOR_CONTRACT',
      decision: 'ALLOW',
      priority: 20,
    },
  ];

  const insertRule = db.prepare(`
    INSERT INTO policy_rules (
      id, policy_id, name, description, target_role, target_action,
      target_resource_scope, resource_classification, decision,
      approval_role_required, priority
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const r of initialRules) {
    insertRule.run(
      r.id, r.policyId, r.name, r.description, r.targetRole || null,
      r.targetAction, r.targetResourceScope || null, r.resourceClassification || null,
      r.decision, r.approvalRoleRequired || null, r.priority
    );
  }

  // Seed Knowledge Items
  const initialKnowledge: KnowledgeItem[] = [
    {
      id: 'kn_cloudscale_soc2_2026',
      title: 'CloudScale Corp - SOC 2 Type II Assessment',
      content: 'CloudScale Corp holds active SOC 2 Type II compliance issued June 2026. Zero high-risk findings. AWS us-east-1 hosting.',
      sourceProvenance: 'A-LIGN Audit Report #9281-SOC2',
      ownership: 'Infosec Compliance Division',
      classification: 'INTERNAL',
      authorizedAccessScopes: ['SECURITY_ARCHITECTURE', 'COMPLIANCE_CERTIFICATES'],
      version: '2.1',
      createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
      expiresAt: new Date(Date.now() + 86400000 * 350).toISOString(), // Fresh!
      verificationStatus: 'VERIFIED',
      producedByTaskId: 'task_historical_vendor_882',
      metadata: { vendor: 'CloudScale Corp', certification: 'SOC2_TYPE_2', validUntil: '2027-06-30' },
    },
    {
      id: 'kn_legacysoft_gdpr_2024',
      title: 'LegacySoft v1.0 - Data Privacy Review (EXPIRED)',
      content: 'Preliminary GDPR data mapping for LegacySoft. High latency detected on EU-to-US data pipeline. Requires renewed SCCs.',
      sourceProvenance: 'Baker & McKenzie Legal Audit 2024',
      ownership: 'Legal Privacy Bureau',
      classification: 'CONFIDENTIAL',
      authorizedAccessScopes: ['LEGAL_CONTRACTS'],
      version: '1.0',
      createdAt: new Date(Date.now() - 86400000 * 400).toISOString(),
      expiresAt: new Date(Date.now() - 86400000 * 35).toISOString(), // Expired / Stale!
      verificationStatus: 'STALE',
      producedByTaskId: 'task_historical_vendor_204',
      metadata: { vendor: 'LegacySoft', status: 'EXPIRED_REQUIRES_REAUDIT' },
    },
  ];

  const insertKnowledge = db.prepare(`
    INSERT INTO knowledge_items (
      id, title, content, source_provenance, ownership, classification,
      authorized_access_scopes_json, version, created_at, expires_at,
      verification_status, produced_by_task_id, metadata_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const k of initialKnowledge) {
    insertKnowledge.run(
      k.id, k.title, k.content, k.sourceProvenance, k.ownership,
      k.classification, JSON.stringify(k.authorizedAccessScopes), k.version,
      k.createdAt, k.expiresAt, k.verificationStatus, k.producedByTaskId || null,
      JSON.stringify(k.metadata)
    );
  }

  // Seed Genesis Flight Recorder Event
  const genesisPayload = { message: 'AEGIS NEXUS Governance Flight Recorder initialized with SHA-256 hash chaining.' };
  const genesisTimestamp = new Date().toISOString();
  const genesisPrevHash = '0000000000000000000000000000000000000000000000000000000000000000';
  const genesisCorrelationId = 'system_boot_001';
  const genesisEventType = 'GATEWAY_REQUEST_RECEIVED';
  const genesisAgentId = 'SYSTEM';
  const genesisPayloadStr = JSON.stringify(genesisPayload);
  const genesisHash = crypto.createHash('sha256')
    .update(`1|${genesisTimestamp}|${genesisCorrelationId}|${genesisEventType}|${genesisAgentId}|${genesisPayloadStr}|${genesisPrevHash}`)
    .digest('hex');

  db.prepare(`
    INSERT INTO flight_recorder_events (
      id, correlation_id, timestamp, event_type, agent_id, task_id, subtask_id,
      payload_json, previous_hash, hash
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'evt_genesis_001',
    genesisCorrelationId,
    genesisTimestamp,
    genesisEventType,
    genesisAgentId,
    'task_boot',
    null,
    genesisPayloadStr,
    genesisPrevHash,
    genesisHash
  );
}

// Call on load
initDatabase();
