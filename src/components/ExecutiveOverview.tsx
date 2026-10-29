import React from 'react';
import { 
  Activity, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Zap, 
  ArrowRight,
  TrendingUp,
  Cpu,
  Layers
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import type { SystemMetrics } from '../services/api.js';
import type { FlightRecorderEvent, OrchestratedTask, SubTask } from '../types.js';

interface ExecutiveOverviewProps {
  metrics: SystemMetrics | null;
  recentEvents: FlightRecorderEvent[];
  latestTask: OrchestratedTask | null;
  onNavigate: (tab: any) => void;
  onRunVendorDemo: () => void;
  isExecuting: boolean;
}

export const ExecutiveOverview: React.FC<ExecutiveOverviewProps> = ({
  metrics,
  recentEvents,
  latestTask,
  onNavigate,
  onRunVendorDemo,
  isExecuting,
}) => {
  const chartData = [
    { name: 'Allowed', count: metrics?.policyDecisions.allowed ?? 0, fill: '#10b981' },
    { name: 'Denied', count: metrics?.policyDecisions.denied ?? 0, fill: '#f43f5e' },
    { name: 'Held (Approval)', count: metrics?.policyDecisions.heldForApproval ?? 0, fill: '#f59e0b' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner Alert / Value Prop */}
      <div className="glass-panel-glow p-5 rounded-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold tracking-widest text-cyan-400 uppercase bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
              CONTROL PLANE ACTIVE
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Policy Baseline: Enterprise AI Operating Standard v2.4
            </span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Autonomous Intelligence. Governed by Design.
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            AEGIS NEXUS intercepts every cross-departmental AI agent task, delegation, and data query. 
            All decisions carry verified structured evidence, policy violations are blocked deterministically, 
            and execution audit logs are cryptographically chained with SHA-256.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigate('demo-lab')}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
          >
            Adversarial Test Lab
          </button>
          <button
            onClick={onRunVendorDemo}
            disabled={isExecuting}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-cyan-900/30 border border-cyan-400/40 transition-all cursor-pointer disabled:opacity-50"
          >
            {isExecuting ? 'Orchestrating...' : 'Run Signature Demo'}
          </button>
        </div>
      </div>

      {/* Metric KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Active Workflows */}
        <div className="glass-card p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono">Workflows Active</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">
              {metrics?.activeTasksCount ?? 0}
            </span>
            <span className="text-[11px] text-slate-400">
              ({metrics?.completedTasksCount ?? 0} completed)
            </span>
          </div>
          <div className="text-[11px] text-cyan-400 font-mono flex items-center gap-1">
            <Activity className="w-3 h-3" /> Real-time DAG Orchestration
          </div>
        </div>

        {/* Agent Availability */}
        <div className="glass-card p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono">Agent Pool</span>
            <Cpu className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">
              {metrics?.activeAgentsCount ?? 0}/{metrics?.totalAgentsCount ?? 0}
            </span>
            <span className="text-[11px] text-emerald-400 font-mono">100% HEALTH</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            5 Specialized Analytical Roles
          </div>
        </div>

        {/* Policy Decisions */}
        <div className="glass-card p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono">Policy Decisions</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">
              {metrics?.policyDecisions.total ?? 0}
            </span>
            <span className="text-[11px] text-rose-400 font-mono">
              {metrics?.policyDecisions.denied ?? 0} Denied
            </span>
          </div>
          <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" /> Zero Policy Bypasses
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="glass-card p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono">Human Approvals</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">
              {metrics?.pendingApprovalsCount ?? 0}
            </span>
            <span className="text-[11px] text-amber-300 font-mono">PENDING SIGN-OFF</span>
          </div>
          <button
            onClick={() => onNavigate('approvals')}
            className="text-[11px] text-amber-400 hover:text-amber-300 font-mono flex items-center gap-1 cursor-pointer transition-colors"
          >
            Review Approval Queue <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Mid Section: Policy Decision Distribution & Latest Workflow */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Governance Enforcement Distribution Chart */}
        <div className="glass-card p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white font-mono tracking-wider uppercase flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              Governance Decisions
            </h3>
            <span className="text-[11px] font-mono text-slate-400">Deterministic</span>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center font-mono">
            <div className="p-2 rounded bg-emerald-950/20 border border-emerald-800/30">
              <div className="text-xs font-bold text-emerald-400">{metrics?.policyDecisions.allowed ?? 0}</div>
              <div className="text-[10px] text-slate-400">Allowed</div>
            </div>
            <div className="p-2 rounded bg-rose-950/20 border border-rose-800/30">
              <div className="text-xs font-bold text-rose-400">{metrics?.policyDecisions.denied ?? 0}</div>
              <div className="text-[10px] text-slate-400">Denied</div>
            </div>
            <div className="p-2 rounded bg-amber-950/20 border border-amber-800/30">
              <div className="text-xs font-bold text-amber-400">{metrics?.policyDecisions.heldForApproval ?? 0}</div>
              <div className="text-[10px] text-slate-400">Held</div>
            </div>
          </div>
        </div>

        {/* Latest Orchestrated Workflow Card */}
        <div className="glass-card p-5 rounded-2xl space-y-4 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-white font-mono tracking-wider uppercase flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                Latest Execution: {latestTask?.title || 'Vendor Due Diligence Pipeline'}
              </h3>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                latestTask?.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                latestTask?.status === 'AWAITING_APPROVAL' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
              }`}>
                {latestTask?.status || 'IDLE'}
              </span>
            </div>

            {latestTask ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {latestTask.finalReport?.summary || latestTask.userPrompt}
                </p>

                {/* Subtask execution pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                  {latestTask.subTasks.map((st: SubTask) => (
                    <div key={st.id} className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                      <div className="text-slate-400 text-[10px] truncate">{st.assignedRole}</div>
                      <div className="font-semibold text-white truncate">{st.title.split(' ')[0]} {st.title.split(' ')[1]}</div>
                      <div className="flex items-center gap-1 mt-1 text-[10px]">
                        {st.status === 'COMPLETED' ? (
                          <span className="text-emerald-400 flex items-center gap-0.5"><CheckCircle2 className="w-3 h-3" /> Done</span>
                        ) : (
                          <span className="text-cyan-400 flex items-center gap-0.5"><Clock className="w-3 h-3" /> Active</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {latestTask.finalReport?.conflictingFindings && latestTask.finalReport.conflictingFindings.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-800/40 text-[11px] text-rose-300 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                    <div>
                      <span className="font-bold">Contradiction Reconciled: </span>
                      {latestTask.finalReport.conflictingFindings[0]}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400 font-mono">
                No active workflow running. Click "Run Vendor Onboarding" to launch the complete enterprise pipeline.
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-mono text-[11px]">
              Task ID: {latestTask?.id || 'none'}
            </span>
            <button
              onClick={() => onNavigate('observatory')}
              className="text-cyan-400 hover:text-cyan-300 font-mono font-medium flex items-center gap-1 cursor-pointer"
            >
              Inspect in Workflow Observatory <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Live Audit Stream */}
      <div className="glass-card p-5 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-white font-mono tracking-wider uppercase">
              Governance Flight Recorder — Live Stream
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40">
              SHA-256 HASH CHAIN
            </span>
          </div>
          <button
            onClick={() => onNavigate('flight-recorder')}
            className="text-xs text-slate-400 hover:text-cyan-400 font-mono flex items-center gap-1 cursor-pointer"
          >
            Full Forensic Flight Recorder <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2">
          {recentEvents.slice(0, 5).map((evt) => (
            <div
              key={evt.id}
              className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs font-mono"
            >
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                  evt.eventType.includes('ALLOW') ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                  evt.eventType.includes('DENY') ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                  evt.eventType.includes('APPROVAL') ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                  'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                }`}>
                  {evt.eventType}
                </span>
                <span className="text-slate-300 font-semibold">{evt.agentId || 'SYSTEM'}</span>
                <span className="text-slate-400 truncate max-w-md">
                  {evt.payload.reason || evt.payload.workflow || evt.payload.message || JSON.stringify(evt.payload).slice(0, 80)}
                </span>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-slate-400 shrink-0">
                <span className="text-slate-400">{evt.timestamp.slice(11, 19)} UTC</span>
                <span className="text-cyan-400/80 font-mono">#{evt.sequenceNumber}</span>
                <span className="text-slate-400 font-mono truncate max-w-[80px]" title={evt.hash}>
                  {evt.hash.slice(0, 8)}...
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
