import React, { useState } from 'react';
import { 
  Share2, 
  Database, 
  FileCheck, 
  AlertTriangle, 
  ShieldAlert, 
  Lock, 
  CheckCircle2, 
  Clock, 
  Search,
  Layers,
  ArrowRight
} from 'lucide-react';
import type { KnowledgeItem, AgentDefinition, GovernancePolicy } from '../types.js';

interface KnowledgeGraphViewProps {
  knowledge: KnowledgeItem[];
  agents: AgentDefinition[];
  policy: GovernancePolicy | null;
}

export const KnowledgeGraphView: React.FC<KnowledgeGraphViewProps> = ({
  knowledge,
  agents,
  policy,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(knowledge[0] || null);

  const filteredKnowledge = knowledge.filter(k => 
    k.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.sourceProvenance.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.classification.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
            <Share2 className="w-5 h-5 text-cyan-400" />
            Governed Knowledge Graph & Lineage Registry
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Interconnected enterprise intelligence graph linking specialized agents, source documents, compliance policies, and verification lifecycles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search provenance, scopes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-xs font-mono text-white rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-cyan-500 w-56"
            />
          </div>
        </div>
      </div>

      {/* Visual Relationship Topology Canvas */}
      <div className="glass-panel p-5 rounded-2xl space-y-4">
        <div className="flex items-center justify-between text-xs font-mono border-b border-slate-800 pb-2">
          <span className="text-slate-400">Stored Entity Relationship Graph</span>
          <span className="text-cyan-400 font-bold">5 Agents • {knowledge.length} Documents • {policy?.rules.length || 0} Policy Gates</span>
        </div>

        {/* Visual Topological Diagram */}
        <div className="p-6 rounded-xl bg-slate-950/80 border border-slate-800 relative overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Column 1: Analytical Agents */}
            <div className="space-y-3">
              <div className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                <Layers className="w-3 h-3" /> Autonomous Agents
              </div>
              {agents.slice(0, 4).map(a => (
                <div key={a.id} className="p-2.5 rounded-lg bg-slate-900 border border-indigo-900/40 text-xs font-mono flex items-center justify-between">
                  <span className="text-white font-bold">{a.name.split(' ')[0]} {a.name.split(' ')[1]}</span>
                  <span className="text-[10px] text-indigo-400">{a.role.split('_')[0]}</span>
                </div>
              ))}
            </div>

            {/* Column 2: Governance Boundary Gate */}
            <div className="flex flex-col items-center justify-center space-y-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-violet-950/60 border border-violet-500/50 flex flex-col items-center justify-center shadow-lg shadow-violet-950/50">
                <Lock className="w-6 h-6 text-cyan-400 mb-1" />
                <span className="text-[9px] font-mono font-bold text-violet-300">RBAC</span>
              </div>
              <div className="space-y-0.5 text-center font-mono">
                <div className="text-xs font-bold text-white">Policy Engine v2.4</div>
                <div className="text-[10px] text-emerald-400">Deterministic Inspection</div>
                <div className="text-[10px] text-slate-400">Zero Unauthenticated Leaks</div>
              </div>
            </div>

            {/* Column 3: Governed Knowledge Nodes */}
            <div className="space-y-3">
              <div className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                <Database className="w-3 h-3" /> Provenance Records
              </div>
              {knowledge.map(k => (
                <div
                  key={k.id}
                  onClick={() => setSelectedItem(k)}
                  className={`p-2.5 rounded-lg border text-xs font-mono flex items-center justify-between cursor-pointer transition-all ${
                    selectedItem?.id === k.id
                      ? 'bg-slate-800 border-cyan-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span className="truncate max-w-[160px] font-medium">{k.title}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border ${
                    k.verificationStatus === 'VERIFIED' ? 'text-emerald-400 border-emerald-800' : 'text-rose-400 border-rose-800'
                  }`}>
                    {k.verificationStatus}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Governed Knowledge Item Detail Dossier */}
      {selectedItem && (
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
                Knowledge Dossier & Lineage
              </span>
              <h3 className="text-base font-bold text-white mt-1">
                {selectedItem.title}
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Provenance: <strong className="text-slate-200">{selectedItem.sourceProvenance}</strong> • Owner: <strong className="text-slate-200">{selectedItem.ownership}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <span className={`px-2.5 py-1 rounded border font-bold ${
                selectedItem.verificationStatus === 'VERIFIED'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
              }`}>
                {selectedItem.verificationStatus}
              </span>
              <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300">
                v{selectedItem.version}
              </span>
            </div>
          </div>

          {/* Content summary */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 leading-relaxed font-mono">
            {selectedItem.content}
          </div>

          {/* Scope Access & Freshness Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-slate-400 text-[10px]">Data Classification</div>
              <div className="font-bold text-white mt-0.5">{selectedItem.classification}</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-slate-400 text-[10px]">Expiry & Freshness</div>
              <div className="font-bold text-slate-200 mt-0.5">
                {new Date(selectedItem.expiresAt).toLocaleDateString()}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-slate-400 text-[10px]">Authorized Scopes</div>
              <div className="font-bold text-cyan-400 mt-0.5 truncate">
                {selectedItem.authorizedAccessScopes.join(', ')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
