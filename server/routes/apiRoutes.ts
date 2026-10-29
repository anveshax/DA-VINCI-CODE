import { Router } from 'express';
import { db } from '../db/database.js';
import { AgentRegistry } from '../agents/agentRegistry.js';
import { PolicyEngine } from '../governance/policyEngine.js';
import { PolicySimulator } from '../governance/policySimulator.js';
import { FlightRecorderService } from '../audit/flightRecorder.js';
import { KnowledgeService } from '../knowledge/knowledgeService.js';
import { ApprovalService } from '../approvals/approvalService.js';
import { SelfHealingRuntime } from '../recovery/selfHealingRuntime.js';
import { TaskOrchestrator } from '../orchestration/orchestrator.js';
import { UserTaskRequestSchema, ApprovalDecisionSchema, PolicyUpdateSchema } from '../../shared/schemas.js';

export const apiRouter = Router();

// ==========================================
// 1. HEALTH & READINESS ENDPOINTS (Part VII)
// ==========================================
apiRouter.get('/health/live', (req, res) => {
  res.status(200).json({ status: 'LIVE', timestamp: new Date().toISOString() });
});

apiRouter.get('/health/ready', (req, res) => {
  try {
    // Check SQLite database connectivity
    const check = db.prepare('SELECT 1 as healthy').get() as { healthy: number };
    if (check?.healthy === 1) {
      return res.status(200).json({
        status: 'READY',
        database: 'CONNECTED',
        geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
        timestamp: new Date().toISOString(),
      });
    }
    return res.status(503).json({ status: 'NOT_READY', database: 'UNHEALTHY' });
  } catch (err: any) {
    return res.status(503).json({ status: 'NOT_READY', error: err.message });
  }
});

apiRouter.get('/api/health', (req, res) => {
  try {
    const check = db.prepare('SELECT 1 as healthy').get() as { healthy: number };
    res.status(200).json({
      application: 'AEGIS NEXUS',
      team: 'DA VINCI CODE',
      version: '2.4.0',
      database: check?.healthy === 1 ? 'OK' : 'ERROR',
      aiProvider: process.env.GEMINI_API_KEY ? 'GEMINI_SERVER_SDK' : 'DETERMINISTIC_SIMULATION_MODE',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ status: 'ERROR', message: err.message });
  }
});

// ==========================================
// 2. EXECUTIVE METRICS OVERVIEW
// ==========================================
apiRouter.get('/api/metrics', (req, res) => {
  try {
    const agents = AgentRegistry.getAllAgents();
    const tasks = TaskOrchestrator.listTasks();
    const pendingApprovals = ApprovalService.getPendingApprovals();
    const recoveryEvents = SelfHealingRuntime.getRecoveryTimeline(20);
    const integrity = FlightRecorderService.verifyIntegrity();

    // Query policy counts from flight recorder
    const allowCount = db.prepare(`SELECT COUNT(*) as c FROM flight_recorder_events WHERE event_type = 'POLICY_ENFORCED_ALLOW'`).get() as { c: number };
    const denyCount = db.prepare(`SELECT COUNT(*) as c FROM flight_recorder_events WHERE event_type = 'POLICY_ENFORCED_DENY'`).get() as { c: number };
    const approvalCount = db.prepare(`SELECT COUNT(*) as c FROM flight_recorder_events WHERE event_type = 'POLICY_HELD_APPROVAL'`).get() as { c: number };

    res.json({
      activeAgentsCount: agents.filter(a => a.status === 'ACTIVE').length,
      totalAgentsCount: agents.length,
      activeTasksCount: tasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'AWAITING_APPROVAL').length,
      completedTasksCount: tasks.filter(t => t.status === 'COMPLETED').length,
      pendingApprovalsCount: pendingApprovals.length,
      recoveriesCount: recoveryEvents.filter(r => r.status === 'RECOVERED').length,
      policyDecisions: {
        allowed: allowCount.c,
        denied: denyCount.c,
        heldForApproval: approvalCount.c,
        total: allowCount.c + denyCount.c + approvalCount.c,
      },
      flightRecorderIntegrity: integrity,
      systemMode: process.env.GEMINI_API_KEY ? 'HYBRID_LIVE_GEMINI' : 'DETERMINISTIC_AUTONOMOUS',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. TASKS & WORKFLOW ORCHESTRATION
// ==========================================
apiRouter.get('/api/tasks', (req, res) => {
  try {
    const tasks = TaskOrchestrator.listTasks();
    res.json(tasks);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/api/tasks/:id', (req, res) => {
  try {
    const task = TaskOrchestrator.getTask(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/api/tasks/vendor-onboarding', async (req, res) => {
  try {
    const { vendorName, executionMode, requesterName } = req.body;
    const task = await TaskOrchestrator.runVendorOnboardingWorkflow({
      vendorName,
      executionMode: executionMode || (process.env.GEMINI_API_KEY ? 'LIVE_GEMINI' : 'DETERMINISTIC_SIMULATION'),
      requesterName,
    });
    res.status(201).json(task);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/api/tasks', async (req, res) => {
  try {
    const parsed = UserTaskRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message });
    }

    // Run workflow with the user prompt
    const task = await TaskOrchestrator.runVendorOnboardingWorkflow({
      vendorName: parsed.data.prompt.includes('vendor') ? 'CloudScale Technologies' : 'Unified Enterprise Agent Workflow',
      executionMode: parsed.data.executionMode,
      requesterName: parsed.data.requesterName,
    });

    res.status(201).json(task);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. ADVERSARIAL TEST SUITE
// ==========================================
apiRouter.post('/api/adversarial-test', async (req, res) => {
  try {
    const { testType } = req.body;
    if (!['TEST_A', 'TEST_B', 'TEST_C', 'TEST_D', 'TEST_E', 'TEST_F', 'TEST_G'].includes(testType)) {
      return res.status(400).json({ error: `Invalid testType '${testType}'. Must be TEST_A through TEST_G.` });
    }

    const result = await TaskOrchestrator.runAdversarialTest(testType);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 5. AGENT REGISTRY & CONTROLS
// ==========================================
apiRouter.get('/api/agents', (req, res) => {
  try {
    const agents = AgentRegistry.getAllAgents();
    res.json(agents);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/api/agents/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    if (!['IDLE', 'ACTIVE', 'PAUSED', 'DEGRADED', 'FAULT'].includes(status)) {
      return res.status(400).json({ error: 'Invalid agent status' });
    }
    const updated = AgentRegistry.updateAgentStatus(req.params.id, status);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 6. GOVERNANCE & POLICY SIMULATOR
// ==========================================
apiRouter.get('/api/policies/active', (req, res) => {
  try {
    const policy = PolicyEngine.getActivePolicy();
    res.json(policy);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/api/policies/simulate', (req, res) => {
  try {
    const proposed = req.body.proposedPolicy;
    if (!proposed || !Array.isArray(proposed.rules)) {
      return res.status(400).json({ error: 'Proposed policy with rules array is required.' });
    }
    const simulationResult = PolicySimulator.runSimulation(proposed);
    res.json(simulationResult);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/api/policies/evaluate', (req, res) => {
  try {
    const { agentId, requestedAction, resourceScope, classification, parameters } = req.body;
    const result = PolicyEngine.evaluate({
      agentId,
      requestedAction,
      resourceScope,
      classification,
      parameters,
      correlationId: `corr_eval_manual_${Date.now()}`,
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 7. GOVERNANCE FLIGHT RECORDER
// ==========================================
apiRouter.get('/api/flight-recorder', (req, res) => {
  try {
    const { correlationId, taskId, agentId, eventType, limit } = req.query;
    const events = FlightRecorderService.getEvents({
      correlationId: correlationId as string | undefined,
      taskId: taskId as string | undefined,
      agentId: agentId as string | undefined,
      eventType: eventType as string | undefined,
      limit: limit ? parseInt(limit as string, 10) : 50,
    });
    res.json(events);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/api/flight-recorder/verify', (req, res) => {
  try {
    const verification = FlightRecorderService.verifyIntegrity();
    res.json(verification);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 8. GOVERNED KNOWLEDGE SERVICE
// ==========================================
apiRouter.get('/api/knowledge', (req, res) => {
  try {
    const items = KnowledgeService.listAll();
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/api/knowledge/check-reuse', (req, res) => {
  try {
    const { vendorName, assessmentType, requestingAgentId, agentScopes } = req.body;
    const check = KnowledgeService.evaluateSafeReuse({
      vendorName,
      assessmentType: assessmentType || 'VENDOR_AUDIT',
      requestingAgentId: requestingAgentId || 'agent_orchestrator',
      agentScopes: agentScopes || ['INTERNAL_SUMMARY'],
      correlationId: `corr_check_${Date.now()}`,
      taskId: `task_preview_${Date.now()}`,
    });
    res.json(check);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 9. HUMAN APPROVAL SERVICE
// ==========================================
apiRouter.get('/api/approvals', (req, res) => {
  try {
    const approvals = ApprovalService.getAllApprovals();
    res.json(approvals);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/api/approvals/pending', (req, res) => {
  try {
    const pending = ApprovalService.getPendingApprovals();
    res.json(pending);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/api/approvals/:id/decide', (req, res) => {
  try {
    const parsed = ApprovalDecisionSchema.safeParse({
      approvalId: req.params.id,
      decision: req.body.decision,
      approverId: req.body.approverId,
      comments: req.body.comments,
    });

    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message });
    }

    const result = ApprovalService.resolveApproval(parsed.data);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 10. RECOVERY LAB
// ==========================================
apiRouter.get('/api/recovery/timeline', (req, res) => {
  try {
    const timeline = SelfHealingRuntime.getRecoveryTimeline(50);
    res.json(timeline);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/api/recovery/circuit-breakers', (req, res) => {
  try {
    const cbs = SelfHealingRuntime.getCircuitBreakers();
    res.json(cbs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
