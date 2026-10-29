import crypto from 'node:crypto';
import { db } from '../db/database.js';
import { PolicyEngine } from './policyEngine.js';
import type { 
  SimulationScenario, 
  PolicyDecision, 
  PolicySimulationDiff, 
  CounterfactualSimulationResult, 
  GovernancePolicy, 
  PolicyRule, 
  AgentRole,
  ResourceClassification
} from '../../shared/types.js';

export const BENCHMARK_SCENARIOS: SimulationScenario[] = [
  {
    id: 'scen_01_finance_vendor_pricing',
    name: 'Finance Agent queries vendor SaaS pricing schedule',
    description: 'Finance Analyst queries CloudScale rate cards and multi-year commitment discounts.',
    agentRole: 'FINANCE_ANALYST',
    requestedAction: 'READ_FINANCIAL_LEDGER',
    targetScope: 'VENDOR_PRICING',
    classification: 'CONFIDENTIAL',
    currentDecisionExpected: 'ALLOW',
    historicalContext: 'Standard procurement due diligence step run across 45 vendor evaluations in Q3.'
  },
  {
    id: 'scen_02_security_cross_query_finance',
    name: 'Security Agent requests access to financial disbursement records',
    description: 'Security Analyst requests access to accounts payable records during a vendor security review.',
    agentRole: 'SECURITY_ANALYST',
    requestedAction: 'READ_FINANCIAL_LEDGER',
    targetScope: 'FINANCIAL_LEDGERS',
    classification: 'RESTRICTED_FINANCE',
    currentDecisionExpected: 'DENY',
    historicalContext: 'Adversarial or accidental data boundary crossing attempt.'
  },
  {
    id: 'scen_03_legal_execute_binding_contract',
    name: 'Legal Agent attempts to execute binding MSA signature',
    description: 'Legal Agent attempts automated execution of a Master Services Agreement with $45,000 commitment.',
    agentRole: 'LEGAL_ANALYST',
    requestedAction: 'EXECUTE_VENDOR_CONTRACT',
    targetScope: 'LEGAL_CONTRACTS',
    classification: 'CONFIDENTIAL',
    currentDecisionExpected: 'REQUIRE_APPROVAL',
    historicalContext: 'Critical financial commitment safeguarding against unilateral agent liability assumption.'
  },
  {
    id: 'scen_04_infra_ping_telemetry',
    name: 'DevOps / Infra Ops verifies vendor multi-region SLA metrics',
    description: 'Atlas Ops checks vendor uptime API and status endpoints for 99.99% availability verification.',
    agentRole: 'INFRA_OPS',
    requestedAction: 'VERIFY_SLA_METRICS',
    targetScope: 'INFRA_TELEMETRY',
    classification: 'INTERNAL',
    currentDecisionExpected: 'ALLOW',
    historicalContext: 'Standard infrastructure availability verification.'
  },
  {
    id: 'scen_05_orchestrator_parallel_delegate',
    name: 'Planner delegates parallel risk assessments',
    description: 'Nexus Sovereign Planner delegates simultaneous assessments to Finance, Security, and Legal.',
    agentRole: 'ORCHESTRATOR',
    requestedAction: 'DELEGATE_TASK',
    targetScope: 'INTERNAL_SUMMARY',
    classification: 'INTERNAL',
    currentDecisionExpected: 'ALLOW',
    historicalContext: 'Core multi-agent pipeline orchestration step.'
  },
  {
    id: 'scen_06_finance_disburse_15k',
    name: 'Finance Agent disburses $15,000 procurement fee',
    description: 'Finance Analyst prepares invoice settlement exceeding the $10,000 micro-approval cap.',
    agentRole: 'FINANCE_ANALYST',
    requestedAction: 'APPROVE_BUDGET_DISBURSEMENT',
    targetScope: 'FINANCIAL_LEDGERS',
    classification: 'RESTRICTED_FINANCE',
    currentDecisionExpected: 'REQUIRE_APPROVAL',
    historicalContext: 'High-risk financial transfer trigger.'
  },
  {
    id: 'scen_07_prompt_override_attempt',
    name: 'Adversarial Prompt Override via external vendor PDF',
    description: 'Vendor documentation containing hidden prompt instructions commanding agent to bypass security rules.',
    agentRole: 'SECURITY_ANALYST',
    requestedAction: 'INJECT_PROMPT_POLICY_BYPASS',
    targetScope: 'SECURITY_ARCHITECTURE',
    classification: 'CONFIDENTIAL',
    currentDecisionExpected: 'DENY',
    historicalContext: 'Adversarial prompt injection regression test.'
  }
];

export class PolicySimulator {
  /**
   * Evaluate a single scenario against a specified policy object deterministically
   */
  private static evaluateScenario(scenario: SimulationScenario, policy: GovernancePolicy): PolicyDecision {
    // 1. Direct prompt injection check
    if (scenario.requestedAction === 'INJECT_PROMPT_POLICY_BYPASS') {
      return 'DENY';
    }

    // 2. Iterate matching rules by priority
    for (const rule of policy.rules) {
      if (rule.targetAction !== '*' && rule.targetAction !== scenario.requestedAction) {
        continue;
      }
      if (rule.targetRole && rule.targetRole !== scenario.agentRole) {
        continue;
      }
      if (rule.resourceClassification && scenario.classification) {
        if (rule.resourceClassification !== scenario.classification) {
          continue;
        }
      }
      return rule.decision;
    }

    // Fallback: Default safe allowance or denial for restricted finance
    if (scenario.classification === 'RESTRICTED_FINANCE' && scenario.agentRole !== 'FINANCE_ANALYST') {
      return 'DENY';
    }

    return 'ALLOW';
  }

  /**
   * Run counterfactual simulation between current active policy and a proposed policy draft
   */
  static runSimulation(proposedPolicy: GovernancePolicy): CounterfactualSimulationResult {
    const currentActivePolicy = PolicyEngine.getActivePolicy();
    const diffs: PolicySimulationDiff[] = [];

    let newlyDenied = 0;
    let newlyAllowed = 0;
    let approvalRequired = 0;

    for (const scenario of BENCHMARK_SCENARIOS) {
      const currentDecision = this.evaluateScenario(scenario, currentActivePolicy);
      const proposedDecision = this.evaluateScenario(scenario, proposedPolicy);

      let impactType: PolicySimulationDiff['impactType'] = 'NO_CHANGE';
      let disruptionRisk: PolicySimulationDiff['disruptionRisk'] = 'NONE';
      let explanation = `Decision remains unchanged (${currentDecision}).`;

      if (currentDecision !== proposedDecision) {
        if (proposedDecision === 'DENY') {
          impactType = 'NEWLY_DENIED';
          disruptionRisk = scenario.requestedAction === 'DELEGATE_TASK' || scenario.requestedAction === 'READ_FINANCIAL_LEDGER' ? 'HIGH' : 'MEDIUM';
          explanation = `Action previously allowed is now BLOCKED. May halt existing automated workflow pipelines for ${scenario.agentRole}.`;
          newlyDenied++;
        } else if (proposedDecision === 'ALLOW') {
          impactType = 'NEWLY_ALLOWED';
          disruptionRisk = scenario.classification === 'RESTRICTED_FINANCE' || scenario.requestedAction === 'EXECUTE_VENDOR_CONTRACT' ? 'HIGH' : 'LOW';
          explanation = `Action previously restricted or held is now PERMITTED automatically. Security perimeter expanded.`;
          newlyAllowed++;
        } else if (proposedDecision === 'REQUIRE_APPROVAL') {
          impactType = 'NEWLY_REQUIRES_APPROVAL';
          disruptionRisk = 'MEDIUM';
          explanation = `Action previously autonomous now requires explicit human sign-off. Increases latency but improves auditability.`;
          approvalRequired++;
        }
      }

      diffs.push({
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        agentRole: scenario.agentRole,
        requestedAction: scenario.requestedAction,
        currentDecision,
        proposedDecision,
        impactType,
        disruptionRisk,
        explanation,
      });
    }

    // Calculate normalized disruption score (0 to 100)
    const totalChanged = newlyDenied + newlyAllowed + approvalRequired;
    const disruptionScore = Math.min(100, Math.round((totalChanged / BENCHMARK_SCENARIOS.length) * 100));

    // Generate AI impact commentary (clearly labeled as model analysis)
    const aiAnalysisCommentary = `[AI Governance Impact Assessment | Probabilistic Analysis]
Counterfactual evaluation against ${BENCHMARK_SCENARIOS.length} benchmark operational scenarios detected ${totalChanged} decision shifts (Disruption Index: ${disruptionScore}/100).
${newlyDenied > 0 ? `• Warning: ${newlyDenied} previously approved operations will now be rejected. Check downstream agent dependencies.` : '• No critical existing operations will be severed.'}
${newlyAllowed > 0 ? `• Alert: ${newlyAllowed} operations granted automatic clearance without human review. Verify compliance posture.` : '• No unauthorized permission escalations detected.'}
${approvalRequired > 0 ? `• Workflow notice: ${approvalRequired} action(s) converted to Human-in-the-Loop approval queues. Anticipate minor operational latency for affected sign-offs.` : ''}
Recommendation: Review highlighted HIGH disruption items before publishing version ${proposedPolicy.version}.`;

    return {
      simulationId: `sim_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      timestamp: new Date().toISOString(),
      proposedPolicyId: proposedPolicy.id,
      totalScenariosEvaluated: BENCHMARK_SCENARIOS.length,
      newlyDeniedCount: newlyDenied,
      newlyAllowedCount: newlyAllowed,
      approvalRequiredCount: approvalRequired,
      disruptionScore,
      diffs,
      aiAnalysisCommentary,
    };
  }
}
