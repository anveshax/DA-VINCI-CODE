import crypto from 'node:crypto';
import { db } from '../db/database.js';
import { FlightRecorderService } from '../audit/flightRecorder.js';
import type { 
  PolicyDecision, 
  PolicyEvaluationResult, 
  GovernancePolicy, 
  PolicyRule, 
  AgentDefinition, 
  AgentRole,
  ResourceClassification
} from '../../shared/types.js';

export class PolicyEngine {
  /**
   * Get the current active governance policy
   */
  static getActivePolicy(): GovernancePolicy {
    const policyRow = db.prepare(`
      SELECT * FROM policies WHERE status = 'ACTIVE' ORDER BY updated_at DESC LIMIT 1
    `).get() as any;

    if (!policyRow) {
      throw new Error('No active governance policy found in the system registry');
    }

    const rulesRows = db.prepare(`
      SELECT * FROM policy_rules WHERE policy_id = ? ORDER BY priority DESC
    `).all(policyRow.id) as any[];

    const rules: PolicyRule[] = rulesRows.map(r => ({
      id: r.id,
      policyId: r.policy_id,
      name: r.name,
      description: r.description,
      targetRole: r.target_role as AgentRole | undefined,
      targetAction: r.target_action,
      targetResourceScope: r.target_resource_scope || undefined,
      resourceClassification: r.resource_classification as ResourceClassification | undefined,
      decision: r.decision as PolicyDecision,
      approvalRoleRequired: r.approval_role_required || undefined,
      priority: r.priority,
    }));

    return {
      id: policyRow.id,
      name: policyRow.name,
      version: policyRow.version,
      status: policyRow.status,
      description: policyRow.description,
      rules,
      createdAt: policyRow.created_at,
      updatedAt: policyRow.updated_at,
      publishedBy: policyRow.published_by,
    };
  }

  /**
   * Governance Enforcement Point: Intercepts an action and evaluates policy
   */
  static evaluate(params: {
    agentId: string;
    requestedAction: string;
    resourceId?: string;
    resourceScope?: string;
    classification?: ResourceClassification;
    correlationId: string;
    taskId?: string;
    subTaskId?: string;
    parameters?: Record<string, any>;
  }): PolicyEvaluationResult {
    const activePolicy = this.getActivePolicy();
    const evaluationId = `eval_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const timestamp = new Date().toISOString();

    // 1. Fetch agent profile from registry
    const agentRow = db.prepare(`SELECT * FROM agents WHERE id = ?`).get(params.agentId) as any;
    if (!agentRow) {
      const denyResult: PolicyEvaluationResult = {
        evaluationId,
        correlationId: params.correlationId,
        timestamp,
        agentId: params.agentId,
        agentRole: 'INFRA_OPS' as AgentRole,
        requestedAction: params.requestedAction,
        resourceId: params.resourceId,
        resourceScope: params.resourceScope,
        classification: params.classification,
        decision: 'DENY',
        matchedPolicyVersion: activePolicy.version,
        reason: `DENIED: Agent ID '${params.agentId}' is not registered in the verified enterprise agent registry.`,
        bypassed: false,
      };

      FlightRecorderService.logEvent({
        correlationId: params.correlationId,
        eventType: 'POLICY_ENFORCED_DENY',
        agentId: params.agentId,
        taskId: params.taskId,
        subTaskId: params.subTaskId,
        payload: {
          decision: 'DENY',
          reason: denyResult.reason,
          requestedAction: params.requestedAction,
        },
      });

      return denyResult;
    }

    const agentRole = agentRow.role as AgentRole;
    const allowedScopes: string[] = JSON.parse(agentRow.data_access_scopes || '[]');
    const allowedTools: string[] = JSON.parse(agentRow.allowed_tools || '[]');

    // 2. Immediate check for prompt injection / policy bypass attempts
    if (
      params.requestedAction === 'INJECT_PROMPT_POLICY_BYPASS' ||
      params.parameters?.bypassSecurity === true ||
      params.parameters?.ignoreGovernance === true ||
      (typeof params.parameters?.prompt === 'string' && 
       params.parameters.prompt.toLowerCase().includes('ignore previous instructions'))
    ) {
      const denyResult: PolicyEvaluationResult = {
        evaluationId,
        correlationId: params.correlationId,
        timestamp,
        agentId: params.agentId,
        agentRole,
        requestedAction: params.requestedAction,
        decision: 'DENY',
        matchedRuleId: 'rule_deny_prompt_injection_tools',
        matchedPolicyVersion: activePolicy.version,
        reason: 'DENIED: Adversarial prompt injection or policy bypass directive detected. Application boundary strictly maintained.',
        bypassed: false,
      };

      FlightRecorderService.logEvent({
        correlationId: params.correlationId,
        eventType: 'POLICY_ENFORCED_DENY',
        agentId: params.agentId,
        taskId: params.taskId,
        subTaskId: params.subTaskId,
        payload: {
          decision: 'DENY',
          reason: denyResult.reason,
          targetAction: params.requestedAction,
          rule: 'rule_deny_prompt_injection_tools',
        },
      });

      return denyResult;
    }

    // 3. Evaluate specific matching policy rules in priority order
    for (const rule of activePolicy.rules) {
      // Check if rule matches requestedAction
      if (rule.targetAction !== '*' && rule.targetAction !== params.requestedAction) {
        continue;
      }

      // Check if rule specifies a targetRole
      if (rule.targetRole && rule.targetRole !== agentRole) {
        continue;
      }

      // Check classification match
      if (rule.resourceClassification && params.classification) {
        if (rule.resourceClassification !== params.classification) {
          continue;
        }
      }

      // Match found!
      const result: PolicyEvaluationResult = {
        evaluationId,
        correlationId: params.correlationId,
        timestamp,
        agentId: params.agentId,
        agentRole,
        requestedAction: params.requestedAction,
        resourceId: params.resourceId,
        resourceScope: params.resourceScope,
        classification: params.classification,
        decision: rule.decision,
        matchedRuleId: rule.id,
        matchedPolicyVersion: activePolicy.version,
        reason: rule.description,
        requiredApprovalScope: rule.approvalRoleRequired,
        bypassed: false,
      };

      const eventType = 
        rule.decision === 'ALLOW' ? 'POLICY_ENFORCED_ALLOW' :
        rule.decision === 'DENY' ? 'POLICY_ENFORCED_DENY' : 'POLICY_HELD_APPROVAL';

      FlightRecorderService.logEvent({
        correlationId: params.correlationId,
        eventType,
        agentId: params.agentId,
        taskId: params.taskId,
        subTaskId: params.subTaskId,
        payload: {
          decision: rule.decision,
          ruleId: rule.id,
          ruleName: rule.name,
          reason: rule.description,
          action: params.requestedAction,
          requiredApprovalScope: rule.approvalRoleRequired,
        },
      });

      return result;
    }

    // 4. Default Principle of Least Privilege: If scope requested is restricted and not in agent's allowed scopes, DENY
    if (params.resourceScope && !allowedScopes.includes(params.resourceScope)) {
      const denyResult: PolicyEvaluationResult = {
        evaluationId,
        correlationId: params.correlationId,
        timestamp,
        agentId: params.agentId,
        agentRole,
        requestedAction: params.requestedAction,
        resourceId: params.resourceId,
        resourceScope: params.resourceScope,
        classification: params.classification,
        decision: 'DENY',
        matchedPolicyVersion: activePolicy.version,
        reason: `DENIED: Agent ${agentRow.name} (${agentRole}) lacks authorized data access scope '${params.resourceScope}'. Allowed scopes: [${allowedScopes.join(', ')}]`,
        bypassed: false,
      };

      FlightRecorderService.logEvent({
        correlationId: params.correlationId,
        eventType: 'POLICY_ENFORCED_DENY',
        agentId: params.agentId,
        taskId: params.taskId,
        subTaskId: params.subTaskId,
        payload: {
          decision: 'DENY',
          reason: denyResult.reason,
          requestedScope: params.resourceScope,
        },
      });

      return denyResult;
    }

    // Default Fallback: Allow safe non-restricted read/delegation operations
    const defaultAllow: PolicyEvaluationResult = {
      evaluationId,
      correlationId: params.correlationId,
      timestamp,
      agentId: params.agentId,
      agentRole,
      requestedAction: params.requestedAction,
      resourceId: params.resourceId,
      resourceScope: params.resourceScope,
      classification: params.classification,
      decision: 'ALLOW',
      matchedPolicyVersion: activePolicy.version,
      reason: 'ALLOW: Standard operational clearance verified under active enterprise policy baseline.',
      bypassed: false,
    };

    FlightRecorderService.logEvent({
      correlationId: params.correlationId,
      eventType: 'POLICY_ENFORCED_ALLOW',
      agentId: params.agentId,
      taskId: params.taskId,
      subTaskId: params.subTaskId,
      payload: {
        decision: 'ALLOW',
        reason: defaultAllow.reason,
        action: params.requestedAction,
      },
    });

    return defaultAllow;
  }
}
