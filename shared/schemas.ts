import { z } from 'zod';

export const EvidenceItemSchema = z.object({
  source_id: z.string().min(1, 'Source ID is required'),
  claim: z.string().min(1, 'Claim statement is required'),
  confidence: z.number().min(0).max(1),
  verified: z.boolean().default(false),
});

export const AgentStructuredResultSchema = z.object({
  task_id: z.string().min(1),
  agent_id: z.string().min(1),
  status: z.enum(['completed', 'failed', 'requires_approval']),
  finding: z.string().min(1, 'Finding summary is required'),
  evidence: z.array(EvidenceItemSchema),
  limitations: z.array(z.string()),
  recommended_next_action: z.string(),
  policy_references: z.array(z.string()),
  discrepancies: z.array(z.string()).optional(),
});

export const UserTaskRequestSchema = z.object({
  prompt: z.string().min(3, 'Task description must be at least 3 characters'),
  requesterRole: z.string().default('SECURITY_ADMIN'),
  requesterName: z.string().default('Operations Commander'),
  executionMode: z.enum(['LIVE_GEMINI', 'DETERMINISTIC_SIMULATION']).default('DETERMINISTIC_SIMULATION'),
});

export const PolicyEvaluationRequestSchema = z.object({
  agentId: z.string(),
  requestedAction: z.string(),
  resourceScope: z.string().optional(),
  classification: z.enum(['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED_FINANCE', 'RESTRICTED_SECURITY']).optional(),
  correlationId: z.string().optional(),
});

export const ApprovalDecisionSchema = z.object({
  approvalId: z.string(),
  decision: z.enum(['APPROVED', 'REJECTED']),
  approverId: z.string(),
  comments: z.string().optional(),
});

export const PolicyRuleInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  description: z.string(),
  targetRole: z.enum(['ORCHESTRATOR', 'FINANCE_ANALYST', 'SECURITY_ANALYST', 'LEGAL_ANALYST', 'INFRA_OPS']).optional(),
  targetAction: z.string(),
  targetResourceScope: z.string().optional(),
  resourceClassification: z.enum(['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED_FINANCE', 'RESTRICTED_SECURITY']).optional(),
  decision: z.enum(['ALLOW', 'DENY', 'REQUIRE_APPROVAL']),
  approvalRoleRequired: z.string().optional(),
  priority: z.number().default(10),
});

export const PolicyUpdateSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  status: z.enum(['ACTIVE', 'DRAFT', 'ARCHIVED']),
  description: z.string(),
  rules: z.array(PolicyRuleInputSchema),
});
