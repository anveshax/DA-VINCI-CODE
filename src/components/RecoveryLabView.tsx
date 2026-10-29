import React, { useState } from 'react';
import { 
  Wrench, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCw, 
  Cpu, 
  Zap, 
  Radio, 
  FileCode,
  ShieldCheck,
  Play
} from 'lucide-react';
import type { RecoveryEvent } from '../types.js';

interface RecoveryLabViewProps {
  timeline: RecoveryEvent[];
  circuitBreakers: any[];
  onTriggerRecoveryDemo: () => Promise<void>;
  isTriggering: boolean;
}

export const RecoveryLabView: React.FC<RecoveryLabViewProps> = ({
  timeline,
  circuitBreakers,
  onTriggerRecoveryDemo,
  isTriggering,
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
            <Wrench className="w-5 h-5 text-indigo-400" />
            Bounded Self-Healing Agent Runtime & Recovery Lab
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Autonomous failure capture, error taxonomy classification, schema-guided repair, and circuit-breaker isolation.
          </p>
        </div>

        <button
          onClick={onTriggerRecoveryDemo}
          disabled={isTriggering}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-mono font-bold shadow-md shadow-indigo-950/40 border border-indigo-400/30 transition-all cursor-pointer disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5 fill-white" />
          <span>{isTriggering ? 'Executing Repair...' : 'Simulate Schema Output Failure'}</span>
        </button>
      </div>

      {/* Circuit Breakers & Retry Budget Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Gemini Provider Circuit Breaker */}
        <div className="glass-panel p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-300">Provider Circuit Breaker</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {circuitBreakers[0]?.state || 'CLOSED (HEALTHY)'}
            </span>
          </div>
          <div className="text-xs font-mono space-y-1">
            <div className="text-slate-400">Target: <strong className="text-white">gemini-api / upstream model</strong></div>
            <div className="text-slate-400">Failure Threshold: <strong className="text-white">3 consecutive failures</strong></div>
            <div className="text-slate-400">Cooldown: <strong className="text-white">30s backoff window</strong></div>
          </div>
          <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1 pt-1 border-t border-slate-800">
            <CheckCircle2 className="w-3 h-3" /> Auto-fallback to deterministic simulation if tripped
          </div>
        </div>

        {/* Bounded Exponential Retry Budget */}
        <div className="glass-panel p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-300">Retry Budget Guard</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              MAX 3 RETRIES
            </span>
          </div>
          <div className="text-xs font-mono space-y-1">
            <div className="text-slate-400">Algorithm: <strong className="text-white">Exponential Backoff + Jitter</strong></div>
            <div className="text-slate-400">Max Latency Budget: <strong className="text-white">30,000ms</strong></div>
            <div className="text-slate-400">Idempotency: <strong className="text-white">Enforced via Hash Keys</strong></div>
          </div>
          <div className="text-[11px] text-cyan-400 font-mono flex items-center gap-1 pt-1 border-t border-slate-800">
            <ShieldCheck className="w-3 h-3" /> Non-idempotent financial actions strictly non-retryable
          </div>
        </div>

        {/* Schema-Guided Output Repair */}
        <div className="glass-panel p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-300">Schema Guidance</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
              ZOD PIPELINE
            </span>
          </div>
          <div className="text-xs font-mono space-y-1">
            <div className="text-slate-400">Parser: <strong className="text-white">Structured Output Guard</strong></div>
            <div className="text-slate-400">Repair Action: <strong className="text-white">Markdown Strip + Reconstruction</strong></div>
            <div className="text-slate-400">Validation: <strong className="text-white">Evidence & Policy references</strong></div>
          </div>
          <div className="text-[11px] text-violet-400 font-mono flex items-center gap-1 pt-1 border-t border-slate-800">
            <FileCode className="w-3 h-3" /> Prevents fatal unhandled JSON parse crashes
          </div>
        </div>
      </div>

      {/* Recovery Timeline Table */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
            <RotateCw className="w-4 h-4 text-cyan-400" />
            Execution Failure & Self-Healing Event Timeline
          </h3>
          <span className="text-xs font-mono text-slate-400">
            Total Captured Incidents: {timeline.length}
          </span>
        </div>

        {timeline.length > 0 ? (
          <div className="space-y-3">
            {timeline.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-white">{item.agentId}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {item.errorClassification}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${
                      item.status === 'RECOVERED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                      item.status === 'ATTEMPTING' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' :
                      'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    }`}>
                      {item.status}
                    </span>
                  </div>

                  <p className="text-slate-400 text-[11px] font-sans">
                    Error: <span className="text-rose-300 font-mono">{item.rawError}</span>
                  </p>

                  <div className="text-[10px] text-indigo-400">
                    Action Taken: <strong>{item.recoveryAction}</strong> (Attempt {item.attemptNumber}/{item.maxAttempts}, Delay: {item.backoffDelayMs}ms)
                  </div>
                </div>

                <div className="text-right text-slate-400 text-[11px] shrink-0">
                  <div>{new Date(item.timestamp).toLocaleTimeString()} UTC</div>
                  <div className="text-[10px] text-slate-400">Task: {item.taskId}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-400 font-mono">
            No runtime failures recorded. The agent control plane is operating at 100% nominal state.
          </div>
        )}
      </div>
    </div>
  );
};
