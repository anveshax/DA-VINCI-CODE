import test from 'node:test';
import assert from 'node:assert/strict';
import { TaskOrchestrator } from '../server/orchestration/orchestrator.js';
import { AgentRegistry } from '../server/agents/agentRegistry.js';
import { PolicySimulator, BENCHMARK_SCENARIOS } from '../server/governance/policySimulator.js';
import { PolicyEngine } from '../server/governance/policyEngine.js';

test('18. The vendor-onboarding workflow completes in demonstration mode', async () => {
  const task = await TaskOrchestrator.runVendorOnboardingWorkflow({
    vendorName: 'CloudScale Technologies Inc.',
    executionMode: 'DETERMINISTIC_SIMULATION',
    requesterName: 'Enterprise Audit Director',
  });

  assert.ok(task.id.startsWith('task_'));
  assert.equal(task.subTasks.length, 4);
  assert.ok(task.finalReport);
  assert.ok(task.finalReport.verifiedFindings.length > 0);
  assert.ok(task.finalReport.conflictingFindings.length > 0);
  assert.ok(task.finalReport.requiredApprovals.length > 0);
  assert.equal(task.status, 'AWAITING_APPROVAL'); // Awaiting human sign-off for spend & contract
});

test('14 & 15. Persisted task history survives and status remains accurate', () => {
  const tasks = TaskOrchestrator.listTasks();
  assert.ok(tasks.length > 0);
  const latest = tasks[0];
  const fetched = TaskOrchestrator.getTask(latest.id);
  assert.equal(fetched?.id, latest.id);
  assert.equal(fetched?.status, latest.status);
});

test('Adversarial Test Suite: Tests A, B, C, D, E, F, G', async () => {
  // Test A: Unauthorized Data Access
  const resA = await TaskOrchestrator.runAdversarialTest('TEST_A');
  assert.equal(resA.governancePassed, true);
  assert.equal(resA.evidence.policyDecision, 'DENY');

  // Test B: Prompt Injection
  const resB = await TaskOrchestrator.runAdversarialTest('TEST_B');
  assert.equal(resB.governancePassed, true);
  assert.equal(resB.evidence.policyDecision, 'DENY');

  // Test C: Duplicate Work & Safe Reuse
  const resC = await TaskOrchestrator.runAdversarialTest('TEST_C');
  assert.equal(resC.governancePassed, true);

  // Test D: Conflicting Evidence
  const resD = await TaskOrchestrator.runAdversarialTest('TEST_D');
  assert.equal(resD.governancePassed, true);

  // Test E: Recoverable Output Failure
  const resE = await TaskOrchestrator.runAdversarialTest('TEST_E');
  assert.equal(resE.governancePassed, true);

  // Test F: Approval Bypass
  const resF = await TaskOrchestrator.runAdversarialTest('TEST_F');
  assert.equal(resF.governancePassed, true);

  // Test G: Retry Budget Exhaustion
  const resG = await TaskOrchestrator.runAdversarialTest('TEST_G');
  assert.equal(resG.governancePassed, true);
});

test('Counterfactual Policy Simulator evaluates scenarios and computes disruption', () => {
  const current = PolicyEngine.getActivePolicy();
  
  // Create a proposed policy where Finance can NO LONGER read financial ledgers (simulated restriction)
  const modifiedRules = current.rules.filter(r => r.id !== 'rule_allow_finance_internal');
  const proposedPolicy = {
    ...current,
    id: 'policy_proposed_simulation_v1',
    version: '2.5.0-draft',
    rules: [
      ...modifiedRules,
      {
        id: 'rule_deny_finance_pricing',
        policyId: 'policy_proposed_simulation_v1',
        name: 'Strictly Deny Finance Agent from Vendor Pricing',
        description: 'Finance Agent barred from reading pricing.',
        targetRole: 'FINANCE_ANALYST' as const,
        targetAction: 'READ_FINANCIAL_LEDGER',
        decision: 'DENY' as const,
        priority: 150,
      },
    ],
  };

  const simulation = PolicySimulator.runSimulation(proposedPolicy);
  assert.ok(simulation.totalScenariosEvaluated > 0);
  assert.ok(simulation.newlyDeniedCount >= 1);
  assert.ok(simulation.disruptionScore > 0);
  assert.ok(simulation.diffs.some(d => d.agentRole === 'FINANCE_ANALYST' && d.impactType === 'NEWLY_DENIED'));
});
