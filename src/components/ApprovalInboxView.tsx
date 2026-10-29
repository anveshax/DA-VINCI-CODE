import React, { useState } from 'react';
import { 
  Inbox, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ShieldCheck, 
  FileText, 
  UserCheck, 
  Lock,
  ArrowRight,
  Clock
} from 'lucide-react';
import type { ApprovalRequest } from '../types.js';

interface ApprovalInboxViewProps {
  approvals: ApprovalRequest[];
  onDecide: (approvalId: string, decision: 'APPROVED' | 'REJECTED', approverId: string, comments?: string) => Promise<void>;
  isDeciding: boolean;
}

export const ApprovalInboxView: React.FC<ApprovalInboxViewProps> = ({
  approvals,
  onDecide,
  isDeciding,
}) => {
  const [activeFilter, setActiveFilter] = useState<'PENDING' | 'RESOLVED'>('PENDING');
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRequest | null>(null);
  const [approverId, setApproverId] = useState('executive_director_procurement');
  const [comments, setComments] = useState('');

  const pendingApprovals = approvals.filter(a => a.status === 'PENDING');
  const resolvedApprovals = approvals.filter(a => a.status !== 'PENDING');
  const displayedApprovals = activeFilter === 'PENDING' ? pendingApprovals : resolvedApprovals;

  const handleDecision = async (decision: 'APPROVED' | 'REJECTED') => {
    if (!selectedApproval) return;
    try {
      await onDecide(selectedApproval.id, decision, approverId, comments);
      setSelectedApproval(null);
      setComments('');
    } catch (err: any) {
      alert(`Decision Failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
            <Inbox className="w-5 h-5 text-amber-400" />
            Human-in-the-Loop Authorization Inbox
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Cryptographically bound authorization queues. Prevents agent self-dealing and mandates executive approval for high-risk side effects.
          </p>
        </div>

        {/* Tab Filter */}
        <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setActiveFilter('PENDING')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'PENDING'
                ? 'bg-amber-600 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Pending Sign-Off</span>
            {pendingApprovals.length > 0 && (
              <span className="px-1.5 py-0.2 rounded bg-amber-950 text-amber-200 text-[10px]">
                {pendingApprovals.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveFilter('RESOLVED')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeFilter === 'RESOLVED'
                ? 'bg-slate-700 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            History & Decisions ({resolvedApprovals.length})
          </button>
        </div>
      </div>

      {/* Grid of Approval Items */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List of Approvals */}
        <div className="lg:col-span-6 space-y-3">
          {displayedApprovals.length > 0 ? (
            displayedApprovals.map((appr) => {
              const isSelected = selectedApproval?.id === appr.id;
              return (
                <div
                  key={appr.id}
                  onClick={() => setSelectedApproval(appr)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800/80 border-amber-500/60 shadow-lg shadow-amber-950/20'
                      : 'glass-card hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{appr.action}</span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${
                          appr.riskLevel === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                          appr.riskLevel === 'HIGH' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                          'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                        }`}>
                          {appr.riskLevel} RISK
                        </span>
                      </div>

                      <div className="text-[11px] font-mono text-slate-400 mt-1">
                        Requesting Agent: <strong className="text-indigo-400">{appr.requestingAgentId}</strong>
                      </div>
                    </div>

                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                      appr.status === 'PENDING' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                      appr.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                      'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    }`}>
                      {appr.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mt-2 font-sans line-clamp-2">
                    {appr.justification}
                  </p>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-3 pt-2 border-t border-slate-800/80">
                    <span>Task: {appr.taskId}</span>
                    <span>{new Date(appr.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="glass-panel p-12 text-center text-slate-400 font-mono text-xs">
              No approval requests matching the active filter.
            </div>
          )}
        </div>

        {/* Right Detail / Decision Modal */}
        <div className="lg:col-span-6 glass-panel p-6 rounded-2xl space-y-5">
          {selectedApproval ? (
            <>
              <div className="border-b border-slate-800 pb-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-bold">
                    Authorization Dossier
                  </span>
                  <span className="text-xs font-mono text-slate-400">ID: {selectedApproval.id}</span>
                </div>
                <h3 className="text-base font-bold text-white mt-1">
                  {selectedApproval.action}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Bound Policy Rule: <strong className="text-white">{selectedApproval.policyRuleId}</strong>
                </p>
              </div>

              {/* Justification Box */}
              <div className="space-y-1">
                <div className="text-[11px] font-mono text-slate-400 font-semibold uppercase">
                  Agent Justification & Legal Basis
                </div>
                <p className="text-xs text-slate-200 bg-slate-900 p-3 rounded-xl border border-slate-800 leading-relaxed font-sans">
                  {selectedApproval.justification}
                </p>
              </div>

              {/* Parameter Scope Bound Table */}
              <div className="space-y-1">
                <div className="text-[11px] font-mono text-slate-400 font-semibold uppercase flex items-center justify-between">
                  <span>Cryptographically Bound Parameters</span>
                  <span className="text-[10px] text-cyan-400 lowercase font-mono">Immutable</span>
                </div>
                <pre className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto">
                  {JSON.stringify(selectedApproval.parameters, null, 2)}
                </pre>
              </div>

              {/* Decision Section or Decision Record */}
              {selectedApproval.status === 'PENDING' ? (
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-mono text-slate-300 font-bold block">
                      Approver Identity (Must not match requesting agent):
                    </label>
                    <input
                      type="text"
                      value={approverId}
                      onChange={(e) => setApproverId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 text-xs font-mono text-white rounded-lg p-2 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-mono text-slate-300 font-bold block">
                      Approver Audit Comments:
                    </label>
                    <textarea
                      rows={2}
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="e.g. Budget envelope confirmed by FP&A; indemnification cap acceptable."
                      className="w-full bg-slate-950 border border-slate-700 text-xs font-sans text-white rounded-lg p-2 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => handleDecision('REJECTED')}
                      disabled={isDeciding}
                      className="flex-1 py-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 text-xs font-bold font-mono transition-all cursor-pointer disabled:opacity-50"
                    >
                      Reject Request
                    </button>
                    <button
                      onClick={() => handleDecision('APPROVED')}
                      disabled={isDeciding}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono shadow-lg shadow-emerald-950/40 transition-all cursor-pointer disabled:opacity-50"
                    >
                      Authorize Action
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs space-y-1.5">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Decision Audit Record</div>
                  <div>Resolution: <strong className={selectedApproval.status === 'APPROVED' ? 'text-emerald-400' : 'text-rose-400'}>{selectedApproval.status}</strong></div>
                  <div>Authorized By: <strong className="text-white">{selectedApproval.decidedBy}</strong></div>
                  <div>Decided At: <strong className="text-slate-300">{selectedApproval.decidedAt}</strong></div>
                  {selectedApproval.approverComments && (
                    <div className="text-slate-300 mt-1">Comments: "{selectedApproval.approverComments}"</div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="py-16 text-center text-xs text-slate-400 font-mono">
              Select an approval request to review its parameter bindings and execute sign-off.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
