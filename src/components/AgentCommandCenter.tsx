import React, { useState } from 'react';
import { 
  Users, 
  BrainCircuit, 
  Coins, 
  ShieldAlert, 
  Scale, 
  Server, 
  Pause, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Key, 
  Wrench, 
  Lock, 
  Cpu,
  Activity
} from 'lucide-react';
import type { AgentDefinition, AgentStatus } from '../types.js';

interface AgentCommandCenterProps {
  agents: AgentDefinition[];
  onToggleStatus: (agentId: string, currentStatus: AgentStatus) => Promise<void>;
  isUpdating: boolean;
}

export const AgentCommandCenter: React.FC<AgentCommandCenterProps> = ({
  agents,
  onToggleStatus,
  isUpdating,
}) => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>(agents[0]?.id || 'agent_orchestrator');

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'BrainCircuit': return BrainCircuit;
      case 'Coins': return Coins;
      case 'ShieldAlert': return ShieldAlert;
      case 'Scale': return Scale;
      case 'Server': return Server;
      default: return Users;
    }
  };

  const selectedAgent = agents.find(a => a.id === selectedAgentId) || agents[0];
  const SelectedIcon = selectedAgent ? getIcon(selectedAgent.avatarIcon) : Users;

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            Verified Enterprise Agent Registry
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Explicitly defined analytical workers. Privileges, tools, and data scopes strictly isolated by RBAC.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
            Total Agents: <strong className="text-white">{agents.length}</strong>
          </span>
          <span className="px-2.5 py-1 rounded bg-emerald-950/40 border border-emerald-800/40 text-emerald-300">
            Active: <strong className="text-white">{agents.filter(a => a.status === 'ACTIVE').length}</strong>
          </span>
        </div>
      </div>

      {/* Main Grid: Left List, Right Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Agent Cards List */}
        <div className="lg:col-span-5 space-y-3">
          {agents.map((agent) => {
            const Icon = getIcon(agent.avatarIcon);
            const isSelected = agent.id === selectedAgentId;
            const isPaused = agent.status === 'PAUSED';

            return (
              <div
                key={agent.id}
                onClick={() => setSelectedAgentId(agent.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800/60 border-cyan-500/40 shadow-lg shadow-cyan-950/20'
                    : 'glass-card hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                      isPaused ? 'bg-slate-800 border-slate-700 text-slate-500' :
                      agent.role === 'ORCHESTRATOR' ? 'bg-indigo-950/80 border-indigo-600/40 text-indigo-400' :
                      agent.role === 'FINANCE_ANALYST' ? 'bg-amber-950/80 border-amber-600/40 text-amber-400' :
                      agent.role === 'SECURITY_ANALYST' ? 'bg-rose-950/80 border-rose-600/40 text-rose-400' :
                      agent.role === 'LEGAL_ANALYST' ? 'bg-emerald-950/80 border-emerald-600/40 text-emerald-400' :
                      'bg-cyan-950/80 border-cyan-600/40 text-cyan-400'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="font-bold text-sm text-white flex items-center gap-2">
                        {agent.name}
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {agent.role}
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${
                      agent.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                      agent.status === 'PAUSED' ? 'bg-slate-700 text-slate-400 border-slate-600' :
                      'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}>
                      {agent.status}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-1">
                      Health: <span className="text-cyan-400 font-bold">{agent.healthScore}%</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {agent.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Selected Agent Detailed Dossier */}
        {selectedAgent && (
          <div className="lg:col-span-7 glass-panel p-6 rounded-2xl space-y-6">
            {/* Header with Administrative Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-cyan-400">
                  <SelectedIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-wide">
                    {selectedAgent.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    ID: {selectedAgent.id} • Role: {selectedAgent.role}
                  </p>
                </div>
              </div>

              {/* Administrative Pause / Resume Action */}
              <button
                onClick={() => onToggleStatus(selectedAgent.id, selectedAgent.status)}
                disabled={isUpdating}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  selectedAgent.status === 'ACTIVE'
                    ? 'bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border-rose-800/40'
                    : 'bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border-emerald-800/40'
                }`}
              >
                {selectedAgent.status === 'ACTIVE' ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause Agent</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Resume Agent</span>
                  </>
                )}
              </button>
            </div>

            {/* Status & Execution Limits */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="text-slate-400 text-[10px]">Health Score</div>
                <div className="text-base font-bold text-emerald-400 mt-0.5">{selectedAgent.healthScore}/100</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="text-slate-400 text-[10px]">Max Delegations</div>
                <div className="text-base font-bold text-white mt-0.5">{selectedAgent.executionLimits.maxDelegations}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="text-slate-400 text-[10px]">Timeout Budget</div>
                <div className="text-base font-bold text-white mt-0.5">{selectedAgent.executionLimits.timeoutSeconds}s</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="text-slate-400 text-[10px]">Rate Limit</div>
                <div className="text-base font-bold text-cyan-400 mt-0.5">{selectedAgent.executionLimits.rateLimitPerMinute} req/m</div>
              </div>
            </div>

            {/* Authorized Scopes */}
            <div className="space-y-2">
              <div className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                Authorized Data Access Scopes
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedAgent.dataAccessScopes.map((scope: string) => (
                  <span
                    key={scope}
                    className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300"
                  >
                    {scope}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 italic">
                * Any query targeting resources outside these scopes is automatically intercepted and DENIED by the Governance Engine.
              </p>
            </div>

            {/* Allowed Tool Registry */}
            <div className="space-y-2">
              <div className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-indigo-400" />
                Permitted Tool Capabilities
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedAgent.allowedTools.map((tool: string) => (
                  <span
                    key={tool}
                    className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-indigo-950/30 border border-indigo-800/40 text-indigo-300"
                  >
                    {tool}()
                  </span>
                ))}
              </div>
            </div>

            {/* Model Configuration */}
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-mono space-y-1">
              <div className="text-slate-400 font-bold">Runtime Model Infrastructure:</div>
              <div className="text-slate-300">
                Engine: <strong className="text-white">{selectedAgent.modelConfig.model}</strong> • 
                Provider: <strong className="text-cyan-400">{selectedAgent.modelConfig.provider}</strong> • 
                Temperature: <strong className="text-white">{selectedAgent.modelConfig.temperature}</strong>
              </div>
              <div className="text-[11px] text-slate-400">
                Last Active: {new Date(selectedAgent.lastActiveAt).toLocaleString()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
