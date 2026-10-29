export type AgentRole = 
  | 'ORCHESTRATOR'
  | 'FINANCE_ANALYST'
  | 'SECURITY_ANALYST'
  | 'LEGAL_ANALYST'
  | 'INFRA_OPS';

export type AgentStatus = 'IDLE' | 'ACTIVE' | 'PAUSED' | 'DEGRADED' | 'FAULT';

export interface AgentCapability {
  id: string;
  name: string;
  description: string;
}

export interface AgentDefinition {
  id: string;
  name: string;
  role: AgentRole;
  description: string;
  avatarIcon: string;
  capabilities: string[];
  allowedTools: string[];
  dataAccessScopes: string[];
  executionLimits: {
    maxDelegations: number;
    maxParallelTasks: number;
    timeoutSeconds: number;
    rateLimitPerMinute: number;
  };
  status: AgentStatus;
  modelConfig: {
    provider: 'gemini' | 'simulation';
    model: string;
    temperature: number;
  };
  healthScore: number;
  consecutiveFailures: number;
  lastActiveAt: string;
}

export type PolicyDecision = 'ALLOW' | 'DENY' | 'REQUIRE_APPROVAL';

export type ResourceClassification = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED_FINANCE' | 'RESTRICTED_SECURITY';

export interface PolicyRule {
  id: string;
  policyId: string;
  name: string;
  description: string;
  targetRole?: AgentRole;
  targetAction: string; // e.g. 'READ_FINANCIAL_LEDGER', 'DELEGATE_TASK', 'APPROVE_PAYMENT'
  targetResourceScope?: string;
  resourceClassification?: ResourceClassification;
  decision: PolicyDecision;
  conditionDescription?: string;
  approvalRoleRequired?: string;
  priority: number;
}

export interface GovernancePolicy {
  id: string;
  name: string;
  version: string;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  description: string;
  rules: PolicyRule[];
  createdAt: string;
  updatedAt: string;
  publishedBy?: string;
}

export interface PolicyEvaluationResult {
  evaluationId: string;
  correlationId: string;
  timestamp: string;
  agentId: string;
  agentRole: AgentRole;
  requestedAction: string;
  resourceId?: string;
  resourceScope?: string;
  classification?: ResourceClassification;
  decision: PolicyDecision;
  matchedRuleId?: string;
  matchedPolicyVersion: string;
  reason: string;
  requiredApprovalScope?: string;
  bypassed: boolean; // Always false in Aegis Nexus
}

export interface EvidenceItem {
  source_id: string;
  claim: string;
  confidence: number; // 0.0 to 1.0 (estimated probability)
  verified: boolean;
}

export interface AgentStructuredResult {
  task_id: string;
  agent_id: string;
  status: 'completed' | 'failed' | 'requires_approval';
  finding: string;
  evidence: EvidenceItem[];
  limitations: string[];
  recommended_next_action: string;
  policy_references: string[];
  discrepancies?: string[];
  costUsd?: number;
  durationMs?: number;
}

export type TaskStatus = 
  | 'PENDING'
  | 'PLANNING'
  | 'IN_PROGRESS'
  | 'AWAITING_APPROVAL'
  | 'RECOVERING'
  | 'COMPLETED'
  | 'BLOCKED'
  | 'FAILED';

export interface SubTask {
  id: string;
  parentTaskId: string;
  title: string;
  assignedAgentId: string;
  assignedRole: AgentRole;
  status: TaskStatus;
  dependencies: string[];
  inputPayload: Record<string, any>;
  result?: AgentStructuredResult;
  policyCheckId?: string;
  retryCount: number;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface OrchestratedTask {
  id: string;
  correlationId: string;
  title: string;
  requester: {
    userId: string;
    userName: string;
    role: string;
  };
  userPrompt: string;
  status: TaskStatus;
  subTasks: SubTask[];
  finalReport?: {
    summary: string;
    verifiedFindings: string[];
    aiGeneratedAssessments: string[];
    missingInformation: string[];
    conflictingFindings: string[];
    policyViolations: string[];
    requiredApprovals: string[];
    recommendedNextActions: string[];
    overallRiskScore: number; // 1-100
  };
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  totalTokensUsed?: number;
  executionMode: 'LIVE_GEMINI' | 'DETERMINISTIC_SIMULATION';
}

export interface ApprovalRequest {
  id: string;
  taskId: string;
  subTaskId?: string;
  correlationId: string;
  requestingAgentId: string;
  action: string;
  parameters: Record<string, any>;
  justification: string;
  policyRuleId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  createdAt: string;
  decidedAt?: string;
  decidedBy?: string;
  approverComments?: string;
}

export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  sourceProvenance: string;
  ownership: string;
  classification: ResourceClassification;
  authorizedAccessScopes: string[];
  version: string;
  createdAt: string;
  expiresAt: string;
  verificationStatus: 'VERIFIED' | 'UNVERIFIED' | 'STALE';
  producedByTaskId?: string;
  metadata: Record<string, any>;
}

export interface FlightRecorderEvent {
  sequenceNumber: number;
  id: string;
  correlationId: string;
  timestamp: string;
  eventType: 
    | 'GATEWAY_REQUEST_RECEIVED'
    | 'TASK_DECOMPOSED'
    | 'AGENT_DELEGATED'
    | 'GOVERNANCE_EVALUATION'
    | 'POLICY_ENFORCED_ALLOW'
    | 'POLICY_ENFORCED_DENY'
    | 'POLICY_HELD_APPROVAL'
    | 'KNOWLEDGE_RETRIEVED'
    | 'KNOWLEDGE_REUSE_BLOCKED'
    | 'EVIDENCE_COLLECTED'
    | 'CONTRADICTION_DETECTED'
    | 'CONTRADICTION_RECONCILED'
    | 'SELF_HEALING_TRIGGERED'
    | 'RETRY_ATTEMPT'
    | 'OUTPUT_REPAIRED'
    | 'CIRCUIT_BREAKER_TRIPPED'
    | 'APPROVAL_SUBMITTED'
    | 'APPROVAL_RESOLVED'
    | 'WORKFLOW_COMPLETED';
  agentId?: string;
  taskId?: string;
  subTaskId?: string;
  payload: Record<string, any>;
  previousHash: string;
  hash: string; // SHA-256 hash of (sequence + timestamp + correlationId + eventType + payload + previousHash)
}

export interface RecoveryEvent {
  id: string;
  taskId: string;
  subTaskId: string;
  agentId: string;
  errorClassification: 
    | 'MALFORMED_OUTPUT'
    | 'PROVIDER_TIMEOUT'
    | 'TRANSIENT_NETWORK'
    | 'DEPENDENCY_MISSING'
    | 'POLICY_VIOLATION_FATAL'
    | 'TOOL_ARGUMENT_ERROR';
  rawError: string;
  recoveryAction: 
    | 'BOUNDED_EXPONENTIAL_RETRY'
    | 'SCHEMA_GUIDED_OUTPUT_REPAIR'
    | 'CIRCUIT_BREAKER_ISOLATION'
    | 'ESCALATE_TO_ADMIN'
    | 'TERMINAL_ABORT';
  attemptNumber: number;
  maxAttempts: number;
  backoffDelayMs: number;
  repairedPayload?: any;
  status: 'ATTEMPTING' | 'RECOVERED' | 'EXHAUSTED' | 'BLOCKED_BY_POLICY';
  timestamp: string;
}

export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  agentRole: AgentRole;
  requestedAction: string;
  targetScope: string;
  classification: ResourceClassification;
  currentDecisionExpected: PolicyDecision;
  historicalContext: string;
}

export interface PolicySimulationDiff {
  scenarioId: string;
  scenarioName: string;
  agentRole: AgentRole;
  requestedAction: string;
  currentDecision: PolicyDecision;
  proposedDecision: PolicyDecision;
  impactType: 'NO_CHANGE' | 'NEWLY_DENIED' | 'NEWLY_ALLOWED' | 'NEWLY_REQUIRES_APPROVAL';
  disruptionRisk: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
  explanation: string;
}

export interface CounterfactualSimulationResult {
  simulationId: string;
  timestamp: string;
  proposedPolicyId: string;
  totalScenariosEvaluated: number;
  newlyDeniedCount: number;
  newlyAllowedCount: number;
  approvalRequiredCount: number;
  disruptionScore: number; // 0 - 100
  diffs: PolicySimulationDiff[];
  aiAnalysisCommentary: string; // Clearly labeled as probabilistic analysis
}
