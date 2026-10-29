import React, { useState } from 'react';
import { 
  Scale, 
  ShieldAlert, 
  ShieldCheck, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Play, 
  Plus, 
  Edit, 
  History,
  Lock,
  ArrowRight,
  TrendingUp,
  Cpu
} from 'lucide-react';
import type { GovernancePolicy, CounterfactualSimulationResult, PolicyRule, PolicySimulationDiff } from '../types.js';

interface GovernanceCenterProps {
  activePolicy: GovernancePolicy | null;
  onRunSimulation: (proposedPolicy: GovernancePolicy) => Promise<CounterfactualSimulationResult>;
}

export const GovernanceCenter: React.FC<GovernanceCenterProps> = ({
  activePolicy,
  onRunSimulation,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'rules' | 'simulator'>('simulator');
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<CounterfactualSimulationResult | null>(null);

  // Scenario presets for simulation
  const [selectedScenarioPreset, setSelectedScenarioPreset] = useState<'RESTRICT_FINANCE' | 'RESTRICT_DELEGATION' | 'REQUIRE_ALL_APPROVALS'>('RESTRICT_FINANCE');

  const handleSimulatePreset = async (preset: 'RESTRICT_FINANCE' | 'RESTRICT_DELEGATION' | 'REQUIRE_ALL_APPROVALS') => {
    if (!activePolicy) return;
    setSimulating(true);

    try {
      let modifiedRules: PolicyRule[] = [...activePolicy.rules];

      if (preset === 'RESTRICT_FINANCE') {
        // Finance agent no longer permitted to read financial ledgers or pricing
        modifiedRules = modifiedRules.filter(r => r.id !== 'rule_allow_finance_internal');
        modifiedRules.unshift({
          id: 'rule_deny_finance_pricing_sim',
          policyId: activePolicy.id,
          name: 'Revoke Finance Analyst Financial Ledger Access',
          description: 'Finance Agent is prohibited from accessing financial ledgers and vendor pricing.',
          targetRole: 'FINANCE_ANALYST',
          targetAction: 'READ_FINANCIAL_LEDGER',
          decision: 'DENY',
          priority: 200,
        });
      } else if (preset === 'RESTRICT_DELEGATION') {
        // Strictly require human approval for any cross-agent delegation
        modifiedRules.unshift({
          id: 'rule_gate_all_delegation_sim',
          policyId: activePolicy.id,
          name: 'Mandate Approval for Every Agent Delegation',
          description: 'Orchestrator cannot delegate subtasks without Human-in-the-Loop authorization.',
          targetAction: 'DELEGATE_TASK',
          decision: 'REQUIRE_APPROVAL',
          approvalRoleRequired: 'DIRECTOR_PROCUREMENT',
          priority: 200,
        });
      } else if (preset === 'REQUIRE_ALL_APPROVALS') {
        // All security scans require human approval
        modifiedRules.unshift({
          id: 'rule_gate_security_scans_sim',
          policyId: activePolicy.id,
          name: 'Require Human Sign-Off on Security Scanning',
          description: 'Security Analyst cannot scan vendor architecture autonomously.',
          targetRole: 'SECURITY_ANALYST',
          targetAction: 'SCAN_SECURITY_POSTURE',
          decision: 'REQUIRE_APPROVAL',
          approvalRoleRequired: 'CISO',
          priority: 200,
        });
      }

      const proposed: GovernancePolicy = {
        ...activePolicy,
        id: `policy_sim_${preset.toLowerCase()}`,
        version: `${activePolicy.version}-proposed`,
        rules: modifiedRules,
      };

      const result = await onRunSimulation(proposed);
      setSimulationResult(result);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
            <Scale className="w-5 h-5 text-indigo-400" />
            Governance Engine & Policy Simulator
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Deterministic rule evaluation, access boundary enforcement, and counterfactual scenario modeling.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setActiveSubTab('simulator')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeSubTab === 'simulator'
                ? 'bg-violet-600 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Counterfactual Simulator
          </button>
          <button
            onClick={() => setActiveSubTab('rules')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeSubTab === 'rules'
                ? 'bg-violet-600 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Active Rules ({activePolicy?.rules.length || 0})
          </button>
        </div>
      </div>

      {/* Simulator View */}
      {activeSubTab === 'simulator' && (
        <div className="space-y-6">
          {/* Preset Selector */}
          <div className="glass-panel p-5 rounded-2xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
                  Innovation 2: Counterfactual Impact Modeling
                </span>
                <h3 className="text-sm font-bold text-white mt-1">
                  Test Proposed Policy Changes Against Historical Operational Scenarios
                </h3>
              </div>

              <button
                onClick={() => handleSimulatePreset(selectedScenarioPreset)}
                disabled={simulating}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-violet-950/40 border border-violet-400/30 transition-all cursor-pointer disabled:opacity-50 shrink-0"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>{simulating ? 'Evaluating Scenarios...' : 'Run Simulation'}</span>
              </button>
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <button
                onClick={() => {
                  setSelectedScenarioPreset('RESTRICT_FINANCE');
                  handleSimulatePreset('RESTRICT_FINANCE');
                }}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedScenarioPreset === 'RESTRICT_FINANCE'
                    ? 'bg-slate-800 border-violet-500 shadow-md'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-xs text-white">1. Restrict Finance Agent</div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  "What would happen if the Finance Agent were no longer permitted to read vendor pricing and financial ledgers?"
                </p>
              </button>

              <button
                onClick={() => {
                  setSelectedScenarioPreset('RESTRICT_DELEGATION');
                  handleSimulatePreset('RESTRICT_DELEGATION');
                }}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedScenarioPreset === 'RESTRICT_DELEGATION'
                    ? 'bg-slate-800 border-violet-500 shadow-md'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-xs text-white">2. Gate All Task Delegation</div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  "What if every automated subtask delegation required explicit human sign-off before proceeding?"
                </p>
              </button>

              <button
                onClick={() => {
                  setSelectedScenarioPreset('REQUIRE_ALL_APPROVALS');
                  handleSimulatePreset('REQUIRE_ALL_APPROVALS');
                }}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedScenarioPreset === 'REQUIRE_ALL_APPROVALS'
                    ? 'bg-slate-800 border-violet-500 shadow-md'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-xs text-white">3. Gate Infosec Architecture Scans</div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  "What if Security Analysts required CISO sign-off before inspecting vendor architecture documents?"
                </p>
              </button>
            </div>
          </div>

          {/* Simulation Output Card */}
          {simulationResult && (
            <div className="glass-panel p-6 rounded-2xl space-y-6">
              {/* Score Header */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Scenarios Evaluated</div>
                  <div className="text-xl font-bold text-white mt-1">
                    {simulationResult.totalScenariosEvaluated}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-800/30">
                  <div className="text-rose-400 text-[10px]">Newly Denied</div>
                  <div className="text-xl font-bold text-rose-400 mt-1">
                    {simulationResult.newlyDeniedCount}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/30">
                  <div className="text-amber-400 text-[10px]">Approval Required</div>
                  <div className="text-xl font-bold text-amber-400 mt-1">
                    {simulationResult.approvalRequiredCount}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-violet-950/20 border border-violet-800/30">
                  <div className="text-violet-400 text-[10px]">Disruption Index</div>
                  <div className="text-xl font-bold text-violet-300 mt-1">
                    {simulationResult.disruptionScore} / 100
                  </div>
                </div>
              </div>

              {/* AI Impact Commentary (Clearly Labeled as Probabilistic) */}
              <div className="p-4 rounded-xl bg-violet-950/30 border border-violet-800/40 text-xs font-mono text-violet-200 leading-relaxed whitespace-pre-line">
                <div className="flex items-center gap-1.5 text-violet-400 font-bold mb-1">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  Probabilistic AI Governance Impact Commentary
                </div>
                {simulationResult.aiAnalysisCommentary}
              </div>

              {/* Scenario Diffs Table */}
              <div className="space-y-2">
                <div className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Deterministic Decision Shift Matrix
                </div>

                <div className="space-y-2">
                  {simulationResult.diffs.map((diff: PolicySimulationDiff) => (
                    <div
                      key={diff.scenarioId}
                      className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>{diff.scenarioName}</span>
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            {diff.agentRole}
                          </span>
                        </div>
                        <p className="text-slate-400 text-[11px] leading-relaxed">
                          {diff.explanation}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                        <span className={`px-2 py-0.5 rounded border ${
                          diff.currentDecision === 'ALLOW' ? 'text-emerald-400 border-emerald-800/40' :
                          diff.currentDecision === 'DENY' ? 'text-rose-400 border-rose-800/40' :
                          'text-amber-400 border-amber-800/40'
                        }`}>
                          {diff.currentDecision}
                        </span>

                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />

                        <span className={`px-2 py-0.5 rounded border font-bold ${
                          diff.proposedDecision === 'ALLOW' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                          diff.proposedDecision === 'DENY' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                          'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}>
                          {diff.proposedDecision}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rules Registry View */}
      {activeSubTab === 'rules' && activePolicy && (
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">{activePolicy.name}</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Version {activePolicy.version} • Published by {activePolicy.publishedBy}
              </p>
            </div>
            <span className="px-2.5 py-1 rounded bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 font-mono text-xs font-semibold">
              ENFORCING IN SERVER CODE
            </span>
          </div>

          <div className="space-y-3">
            {activePolicy.rules.map((rule: PolicyRule) => (
              <div
                key={rule.id}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="font-bold text-white flex items-center gap-2">
                    <span>{rule.name}</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      ID: {rule.id}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {rule.description}
                  </p>
                  <div className="flex flex-wrap gap-2 text-[10px] font-mono text-slate-400 pt-1">
                    {rule.targetRole && <span>Role: <strong className="text-indigo-300">{rule.targetRole}</strong></span>}
                    <span>Action: <strong className="text-cyan-300">{rule.targetAction}</strong></span>
                    {rule.resourceClassification && (
                      <span>Class: <strong className="text-rose-300">{rule.resourceClassification}</strong></span>
                    )}
                    {rule.approvalRoleRequired && (
                      <span>Approval: <strong className="text-amber-300">{rule.approvalRoleRequired}</strong></span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 font-mono">
                  <span className={`px-2.5 py-1 rounded border text-xs font-bold ${
                    rule.decision === 'ALLOW' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                    rule.decision === 'DENY' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                    'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}>
                    {rule.decision}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
