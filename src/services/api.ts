import type { 
  OrchestratedTask, 
  AgentDefinition, 
  GovernancePolicy, 
  FlightRecorderEvent, 
  KnowledgeItem, 
  ApprovalRequest, 
  RecoveryEvent,
  CounterfactualSimulationResult
} from '../types.js';

export interface SystemMetrics {
  activeAgentsCount: number;
  totalAgentsCount: number;
  activeTasksCount: number;
  completedTasksCount: number;
  pendingApprovalsCount: number;
  recoveriesCount: number;
  policyDecisions: {
    allowed: number;
    denied: number;
    heldForApproval: number;
    total: number;
  };
  flightRecorderIntegrity: {
    isValid: boolean;
    totalEventsVerified: number;
    error?: string;
  };
  systemMode: string;
}

export const api = {
  async getMetrics(): Promise<SystemMetrics> {
    const res = await fetch('/api/metrics');
    if (!res.ok) throw new Error('Failed to fetch metrics');
    return res.json();
  },

  async getTasks(): Promise<OrchestratedTask[]> {
    const res = await fetch('/api/tasks');
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return res.json();
  },

  async getTask(id: string): Promise<OrchestratedTask> {
    const res = await fetch(`/api/tasks/${id}`);
    if (!res.ok) throw new Error('Failed to fetch task');
    return res.json();
  },

  async runVendorOnboarding(vendorName: string, executionMode: 'LIVE_GEMINI' | 'DETERMINISTIC_SIMULATION'): Promise<OrchestratedTask> {
    const res = await fetch('/api/tasks/vendor-onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vendorName, executionMode }),
    });
    if (!res.ok) throw new Error('Failed to run vendor onboarding workflow');
    return res.json();
  },

  async runAdversarialTest(testType: string): Promise<any> {
    const res = await fetch('/api/adversarial-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ testType }),
    });
    if (!res.ok) throw new Error('Failed to execute adversarial test');
    return res.json();
  },

  async getAgents(): Promise<AgentDefinition[]> {
    const res = await fetch('/api/agents');
    if (!res.ok) throw new Error('Failed to fetch agents');
    return res.json();
  },

  async updateAgentStatus(agentId: string, status: string): Promise<AgentDefinition> {
    const res = await fetch(`/api/agents/${agentId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update agent status');
    return res.json();
  },

  async getActivePolicy(): Promise<GovernancePolicy> {
    const res = await fetch('/api/policies/active');
    if (!res.ok) throw new Error('Failed to fetch active policy');
    return res.json();
  },

  async simulatePolicy(proposedPolicy: GovernancePolicy): Promise<CounterfactualSimulationResult> {
    const res = await fetch('/api/policies/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proposedPolicy }),
    });
    if (!res.ok) throw new Error('Failed to run counterfactual simulation');
    return res.json();
  },

  async getFlightRecorderEvents(filters?: { correlationId?: string; taskId?: string; eventType?: string; limit?: number }): Promise<FlightRecorderEvent[]> {
    const params = new URLSearchParams();
    if (filters?.correlationId) params.append('correlationId', filters.correlationId);
    if (filters?.taskId) params.append('taskId', filters.taskId);
    if (filters?.eventType) params.append('eventType', filters.eventType);
    if (filters?.limit) params.append('limit', String(filters.limit));

    const res = await fetch(`/api/flight-recorder?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch flight recorder events');
    return res.json();
  },

  async verifyFlightRecorderIntegrity(): Promise<{ isValid: boolean; totalEventsVerified: number; error?: string }> {
    const res = await fetch('/api/flight-recorder/verify');
    if (!res.ok) throw new Error('Failed to verify flight recorder integrity');
    return res.json();
  },

  async getKnowledge(): Promise<KnowledgeItem[]> {
    const res = await fetch('/api/knowledge');
    if (!res.ok) throw new Error('Failed to fetch knowledge repository');
    return res.json();
  },

  async getApprovals(): Promise<ApprovalRequest[]> {
    const res = await fetch('/api/approvals');
    if (!res.ok) throw new Error('Failed to fetch approvals');
    return res.json();
  },

  async getPendingApprovals(): Promise<ApprovalRequest[]> {
    const res = await fetch('/api/approvals/pending');
    if (!res.ok) throw new Error('Failed to fetch pending approvals');
    return res.json();
  },

  async decideApproval(approvalId: string, decision: 'APPROVED' | 'REJECTED', approverId: string, comments?: string): Promise<any> {
    const res = await fetch(`/api/approvals/${approvalId}/decide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, approverId, comments }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to record approval decision');
    }
    return res.json();
  },

  async getRecoveryTimeline(): Promise<RecoveryEvent[]> {
    const res = await fetch('/api/recovery/timeline');
    if (!res.ok) throw new Error('Failed to fetch recovery timeline');
    return res.json();
  },

  async getCircuitBreakers(): Promise<any[]> {
    const res = await fetch('/api/recovery/circuit-breakers');
    if (!res.ok) throw new Error('Failed to fetch circuit breakers');
    return res.json();
  },

  async getHealth(): Promise<any> {
    const res = await fetch('/api/health');
    if (!res.ok) throw new Error('Failed to fetch health');
    return res.json();
  },
};
