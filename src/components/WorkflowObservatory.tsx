import React, { useState } from 'react';
import { 
  GitFork, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  FileText, 
  Search, 
  Cpu, 
  ArrowRight,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import type { OrchestratedTask, SubTask, EvidenceItem } from '../types.js';

interface WorkflowObservatoryProps {
  tasks: OrchestratedTask[];
  onSelectTask?: (taskId: string) => void;
}

export const WorkflowObservatory: React.FC<WorkflowObservatoryProps> = ({
  tasks,
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string>(tasks[0]?.id || '');
  const [selectedSubTaskId, setSelectedSubTaskId] = useState<string>('');

  const currentTask = tasks.find(t => t.id === selectedTaskId) || tasks[0];
  const activeSubTask = currentTask?.subTasks.find((st: SubTask) => st.id === selectedSubTaskId) || currentTask?.subTasks[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
            <GitFork className="w-5 h-5 text-cyan-400" />
            Workflow Observatory & Task Graph
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Interactive Directed Acyclic Graph (DAG) visualizing subtask decomposition, agent assignments, and governance checkpoints.
          </p>
        </div>

        {/* Task Selector Dropdown */}
        {tasks.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">Select Workflow:</span>
            <select
              value={currentTask?.id || ''}
              onChange={(e) => {
                setSelectedTaskId(e.target.value);
                setSelectedSubTaskId('');
              }}
              className="bg-slate-900 border border-slate-700 text-xs font-mono text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              {tasks.map(t => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.status})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {currentTask ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Interactive DAG Graph Visualizer */}
          <div className="lg:col-span-7 glass-panel p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Workflow Execution DAG
                </span>
                <h3 className="text-sm font-bold text-white">{currentTask.title}</h3>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                currentTask.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                currentTask.status === 'AWAITING_APPROVAL' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
              }`}>
                {currentTask.status}
              </span>
            </div>

            {/* Visual Task Graph Node Sequence */}
            <div className="space-y-4 py-2">
              {currentTask.subTasks.map((st: SubTask, index: number) => {
                const isSelected = (activeSubTask?.id || currentTask.subTasks[0].id) === st.id;
                return (
                  <div key={st.id} className="relative">
                    {/* Connecting line to previous node */}
                    {index > 0 && (
                      <div className="absolute -top-4 left-6 w-0.5 h-4 bg-slate-700/80 -z-10" />
                    )}

                    <div
                      onClick={() => setSelectedSubTaskId(st.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                        isSelected
                          ? 'bg-slate-800 border-cyan-500/60 shadow-lg shadow-cyan-950/20'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Node status icon */}
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-bold ${
                          st.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          st.status === 'IN_PROGRESS' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 animate-pulse' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {index + 1}
                        </div>

                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-2">
                            {st.title}
                            {isSelected && <ChevronRight className="w-4 h-4 text-cyan-400" />}
                          </div>
                          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2 mt-0.5">
                            <span className="text-indigo-400 font-semibold">{st.assignedRole}</span>
                            <span>•</span>
                            <span>Checkpoint: <ShieldCheck className="w-3 h-3 text-emerald-400 inline" /> Governed</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 font-mono">
                        <span className={`text-[10px] px-2 py-0.5 rounded border ${
                          st.status === 'COMPLETED' ? 'text-emerald-400 border-emerald-800/40' :
                          st.status === 'IN_PROGRESS' ? 'text-cyan-400 border-cyan-800/40' :
                          'text-slate-400 border-slate-700'
                        }`}>
                          {st.status}
                        </span>
                        {st.result?.durationMs && (
                          <div className="text-[10px] text-slate-400 mt-1">
                            {st.result.durationMs}ms
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Requester & Provenance Footer */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-mono text-slate-400 flex items-center justify-between">
              <span>Requester: <strong className="text-white">{currentTask.requester.userName}</strong> ({currentTask.requester.role})</span>
              <span>Correlation: <strong className="text-cyan-400">{currentTask.correlationId}</strong></span>
            </div>
          </div>

          {/* Detailed Node Inspector (Structured Evidence, Limitations, Actions) */}
          <div className="lg:col-span-5 glass-panel p-6 rounded-2xl space-y-5">
            {activeSubTask ? (
              <>
                <div className="border-b border-slate-800 pb-3">
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-bold">
                    Node Inspector
                  </span>
                  <h3 className="text-sm font-bold text-white mt-1">
                    {activeSubTask.title}
                  </h3>
                  <div className="text-xs font-mono text-slate-400 mt-1">
                    Worker: <span className="text-indigo-300 font-semibold">{activeSubTask.assignedAgentId}</span> ({activeSubTask.assignedRole})
                  </div>
                </div>

                {activeSubTask.result ? (
                  <div className="space-y-4">
                    {/* Finding Summary */}
                    <div className="space-y-1">
                      <div className="text-[11px] font-mono text-slate-400 font-semibold uppercase">
                        Executive Finding
                      </div>
                      <p className="text-xs text-slate-200 bg-slate-900/80 p-3 rounded-xl border border-slate-800 leading-relaxed">
                        {activeSubTask.result.finding}
                      </p>
                    </div>

                    {/* Verified Evidence Items */}
                    <div className="space-y-2">
                      <div className="text-[11px] font-mono text-slate-400 font-semibold uppercase flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Structured Authoritative Evidence ({activeSubTask.result.evidence.length})
                      </div>
                      <div className="space-y-2">
                        {activeSubTask.result.evidence.map((ev: EvidenceItem, i: number) => (
                          <div key={i} className="p-3 rounded-lg bg-emerald-950/15 border border-emerald-800/30 text-xs space-y-1">
                            <div className="flex items-center justify-between font-mono text-[10px]">
                              <span className="text-emerald-400 font-bold">Source: {ev.source_id}</span>
                              <span className="text-slate-400">Confidence: {(ev.confidence * 100).toFixed(0)}%</span>
                            </div>
                            <p className="text-slate-200">{ev.claim}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Stated Limitations */}
                    {activeSubTask.result.limitations.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-mono text-slate-400 font-semibold uppercase">
                          Explicit Limitations & Uncertainty
                        </div>
                        <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                          {activeSubTask.result.limitations.map((lim: string, i: number) => (
                            <li key={i} className="text-slate-300">{lim}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Recommended Next Action */}
                    <div className="p-3 rounded-lg bg-indigo-950/30 border border-indigo-800/40 text-xs font-mono space-y-1">
                      <div className="text-indigo-400 font-bold text-[10px] uppercase">
                        Recommended Next Operational Action
                      </div>
                      <div className="text-white font-semibold">
                        {activeSubTask.result.recommended_next_action}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400 font-mono">
                    Node in pending state. Awaiting upstream execution dependencies.
                  </div>
                )}
              </>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400 font-mono">
                Click a subtask node to inspect its execution trace.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="glass-panel p-12 text-center text-slate-400 font-mono text-xs">
          No workflow tasks found. Launch a task via Executive Overview or Interactive Demo Lab.
        </div>
      )}
    </div>
  );
};
