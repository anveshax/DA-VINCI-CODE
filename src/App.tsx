import React, { useState, useEffect } from 'react';
import { Navigation, type ActiveTab } from './components/Navigation.js';
import { Header } from './components/Header.js';
import { ExecutiveOverview } from './components/ExecutiveOverview.js';
import { AgentCommandCenter } from './components/AgentCommandCenter.js';
import { WorkflowObservatory } from './components/WorkflowObservatory.js';
import { GovernanceCenter } from './components/GovernanceCenter.js';
import { KnowledgeGraphView } from './components/KnowledgeGraphView.js';
import { FlightRecorderView } from './components/FlightRecorderView.js';
import { RecoveryLabView } from './components/RecoveryLabView.js';
import { ApprovalInboxView } from './components/ApprovalInboxView.js';
import { DemoLabView } from './components/DemoLabView.js';
import { SettingsView } from './components/SettingsView.js';
import { api, type SystemMetrics } from './services/api.js';
import type { 
  OrchestratedTask, 
  AgentDefinition, 
  GovernancePolicy, 
  FlightRecorderEvent, 
  KnowledgeItem, 
  ApprovalRequest, 
  RecoveryEvent,
  AgentStatus 
} from './types.js';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [agents, setAgents] = useState<AgentDefinition[]>([]);
  const [tasks, setTasks] = useState<OrchestratedTask[]>([]);
  const [activePolicy, setActivePolicy] = useState<GovernancePolicy | null>(null);
  const [recentEvents, setRecentEvents] = useState<FlightRecorderEvent[]>([]);
  const [knowledge, setKnowledge] = useState<KnowledgeItem[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [recoveryTimeline, setRecoveryTimeline] = useState<RecoveryEvent[]>([]);
  const [circuitBreakers, setCircuitBreakers] = useState<any[]>([]);
  const [health, setHealth] = useState<any>(null);

  const [isExecuting, setIsExecuting] = useState(false);
  const [isUpdatingAgent, setIsUpdatingAgent] = useState(false);
  const [isVerifyingIntegrity, setIsVerifyingIntegrity] = useState(false);
  const [isDecidingApproval, setIsDecidingApproval] = useState(false);
  const [isTriggeringRecovery, setIsTriggeringRecovery] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadAllData = async () => {
    try {
      const [
        m, ag, ts, pol, evts, kn, apps, recs, cbs, hlth
      ] = await Promise.all([
        api.getMetrics().catch(() => null),
        api.getAgents().catch(() => []),
        api.getTasks().catch(() => []),
        api.getActivePolicy().catch(() => null),
        api.getFlightRecorderEvents({ limit: 40 }).catch(() => []),
        api.getKnowledge().catch(() => []),
        api.getApprovals().catch(() => []),
        api.getRecoveryTimeline().catch(() => []),
        api.getCircuitBreakers().catch(() => []),
        api.getHealth().catch(() => null),
      ]);

      if (m) setMetrics(m);
      setAgents(ag);
      setTasks(ts);
      if (pol) setActivePolicy(pol);
      setRecentEvents(evts);
      setKnowledge(kn);
      setApprovals(apps);
      setRecoveryTimeline(recs);
      setCircuitBreakers(cbs);
      setHealth(hlth);
    } catch (err) {
      console.error('Failed to load control plane data:', err);
    }
  };

  useEffect(() => {
    loadAllData();
    const interval = setInterval(loadAllData, 12000);
    return () => clearInterval(interval);
  }, []);

  const handleRunVendorWorkflow = async (vendorName: string = 'CloudScale Technologies Inc.') => {
    setIsExecuting(true);
    try {
      const task = await api.runVendorOnboarding(
        vendorName, 
        metrics?.systemMode?.includes('LIVE') ? 'LIVE_GEMINI' : 'DETERMINISTIC_SIMULATION'
      );
      await loadAllData();
      showNotification(`Vendor Onboarding Workflow complete for ${vendorName}!`, 'success');
      return task;
    } catch (err: any) {
      showNotification(`Workflow failed: ${err.message}`, 'error');
      throw err;
    } finally {
      setIsExecuting(false);
    }
  };

  const handleToggleAgentStatus = async (agentId: string, currentStatus: AgentStatus) => {
    setIsUpdatingAgent(true);
    try {
      const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
      await api.updateAgentStatus(agentId, newStatus);
      await loadAllData();
      showNotification(`Agent status updated to ${newStatus}`, 'info');
    } catch (err: any) {
      showNotification(`Failed to update status: ${err.message}`, 'error');
    } finally {
      setIsUpdatingAgent(false);
    }
  };

  const handleVerifyIntegrity = async () => {
    setIsVerifyingIntegrity(true);
    try {
      const res = await api.verifyFlightRecorderIntegrity();
      await loadAllData();
      if (res.isValid) {
        showNotification(`Cryptographic verification passed: All ${res.totalEventsVerified} chained blocks verified!`, 'success');
      } else {
        showNotification(`Integrity Alert: ${res.error}`, 'error');
      }
    } catch (err: any) {
      showNotification(`Integrity verification failed: ${err.message}`, 'error');
    } finally {
      setIsVerifyingIntegrity(false);
    }
  };

  const handleDecideApproval = async (approvalId: string, decision: 'APPROVED' | 'REJECTED', approverId: string, comments?: string) => {
    setIsDecidingApproval(true);
    try {
      await api.decideApproval(approvalId, decision, approverId, comments);
      await loadAllData();
      showNotification(`Approval request marked as ${decision}`, 'success');
    } catch (err: any) {
      showNotification(`Approval failed: ${err.message}`, 'error');
      throw err;
    } finally {
      setIsDecidingApproval(false);
    }
  };

  const handleTriggerRecoveryDemo = async () => {
    setIsTriggeringRecovery(true);
    try {
      await api.runAdversarialTest('TEST_E');
      await loadAllData();
      showNotification('Self-Healing Schema Output Repair executed and logged!', 'success');
    } catch (err: any) {
      showNotification(`Recovery demo failed: ${err.message}`, 'error');
    } finally {
      setIsTriggeringRecovery(false);
    }
  };

  const tabTitles: Record<ActiveTab, string> = {
    overview: 'Executive Overview',
    agents: 'Agent Command Center',
    observatory: 'Workflow Observatory',
    governance: 'Governance Center & Policy Simulator',
    knowledge: 'Governed Knowledge Graph',
    'flight-recorder': 'Governance Flight Recorder',
    recovery: 'Bounded Self-Healing Recovery Lab',
    approvals: 'Human Authorization Inbox',
    'demo-lab': 'Interactive Demo Lab & Adversarial Tests',
    settings: 'Architecture & System Health',
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#07090e] text-[#cbd5e1] font-sans antialiased">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl border shadow-2xl font-mono text-xs flex items-center gap-2 animate-bounce ${
          notification.type === 'success' ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200' :
          notification.type === 'error' ? 'bg-rose-950/90 border-rose-500 text-rose-200' :
          'bg-cyan-950/90 border-cyan-500 text-cyan-200'
        }`}>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Sidebar Navigation */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={(t) => {
          setActiveTab(t);
          setIsMobileMenuOpen(false);
        }}
        pendingApprovalsCount={metrics?.pendingApprovalsCount ?? 0}
        integrityValid={metrics?.flightRecorderIntegrity.isValid ?? true}
        activeAgentsCount={metrics?.activeAgentsCount ?? 5}
        totalAgentsCount={metrics?.totalAgentsCount ?? 5}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header
          activeTabTitle={tabTitles[activeTab]}
          onQuickRunDemo={() => handleRunVendorWorkflow()}
          isExecuting={isExecuting}
          systemMode={metrics?.systemMode || 'DETERMINISTIC_AUTONOMOUS'}
          onRefresh={loadAllData}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-6 lg:p-8 scanline-bg">
          <div className="max-w-7xl mx-auto pb-12">
            {activeTab === 'overview' && (
              <ExecutiveOverview
                metrics={metrics}
                recentEvents={recentEvents}
                latestTask={tasks[0] || null}
                onNavigate={(t) => setActiveTab(t)}
                onRunVendorDemo={() => handleRunVendorWorkflow()}
                isExecuting={isExecuting}
              />
            )}

            {activeTab === 'agents' && (
              <AgentCommandCenter
                agents={agents}
                onToggleStatus={handleToggleAgentStatus}
                isUpdating={isUpdatingAgent}
              />
            )}

            {activeTab === 'observatory' && (
              <WorkflowObservatory
                tasks={tasks}
              />
            )}

            {activeTab === 'governance' && (
              <GovernanceCenter
                activePolicy={activePolicy}
                onRunSimulation={async (p) => {
                  const res = await api.simulatePolicy(p);
                  await loadAllData();
                  return res;
                }}
              />
            )}

            {activeTab === 'knowledge' && (
              <KnowledgeGraphView
                knowledge={knowledge}
                agents={agents}
                policy={activePolicy}
              />
            )}

            {activeTab === 'flight-recorder' && (
              <FlightRecorderView
                events={recentEvents}
                integrityValid={metrics?.flightRecorderIntegrity.isValid ?? true}
                onVerifyIntegrity={handleVerifyIntegrity}
                isVerifying={isVerifyingIntegrity}
              />
            )}

            {activeTab === 'recovery' && (
              <RecoveryLabView
                timeline={recoveryTimeline}
                circuitBreakers={circuitBreakers}
                onTriggerRecoveryDemo={handleTriggerRecoveryDemo}
                isTriggering={isTriggeringRecovery}
              />
            )}

            {activeTab === 'approvals' && (
              <ApprovalInboxView
                approvals={approvals}
                onDecide={handleDecideApproval}
                isDeciding={isDecidingApproval}
              />
            )}

            {activeTab === 'demo-lab' && (
              <DemoLabView
                onRunVendorOnboarding={handleRunVendorWorkflow}
                onRunAdversarialTest={async (t) => {
                  const res = await api.runAdversarialTest(t);
                  await loadAllData();
                  return res;
                }}
                isExecuting={isExecuting}
                onNavigateToTask={(taskId) => {
                  setActiveTab('observatory');
                }}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                metrics={metrics}
                health={health}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
export default App;
