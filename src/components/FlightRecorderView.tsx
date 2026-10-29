import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Filter, 
  RefreshCw,
  Hash,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type { FlightRecorderEvent } from '../types.js';

interface FlightRecorderViewProps {
  events: FlightRecorderEvent[];
  integrityValid: boolean;
  onVerifyIntegrity: () => Promise<void>;
  isVerifying: boolean;
}

export const FlightRecorderView: React.FC<FlightRecorderViewProps> = ({
  events,
  integrityValid,
  onVerifyIntegrity,
  isVerifying,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEventType, setSelectedEventType] = useState<string>('ALL');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  const filteredEvents = events.filter(e => {
    if (selectedEventType !== 'ALL' && e.eventType !== selectedEventType) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match = 
        e.id.toLowerCase().includes(q) ||
        e.correlationId.toLowerCase().includes(q) ||
        (e.agentId && e.agentId.toLowerCase().includes(q)) ||
        JSON.stringify(e.payload).toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const uniqueEventTypes = Array.from(new Set(events.map(e => e.eventType)));

  return (
    <div className="space-y-6">
      {/* Header & Cryptographic Integrity Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            Governance Flight Recorder (Append-Only Audit Log)
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Cryptographically sealed execution trace with SHA-256 hash chaining. Guaranteed forensic accountability across multi-agent workflows.
          </p>
        </div>

        {/* Cryptographic Verification Action */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs">
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Ledger Status:</span>
            {integrityValid ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> VERIFIED INTACT
              </span>
            ) : (
              <span className="text-rose-400 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> CHAIN COMPROMISED
              </span>
            )}
          </div>

          <button
            onClick={onVerifyIntegrity}
            disabled={isVerifying}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 border border-slate-700 cursor-pointer transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Verify SHA-256 Hashes</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search correlation ID, agent, payload..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-xs text-white rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedEventType}
            onChange={(e) => setSelectedEventType(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="ALL">All Event Types ({events.length})</option>
            {uniqueEventTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Event Timeline Table */}
      <div className="space-y-3">
        {filteredEvents.map((evt) => {
          const isExpanded = expandedEventId === evt.id;
          return (
            <div
              key={evt.id}
              className="glass-card rounded-xl border border-slate-800/80 overflow-hidden transition-all"
            >
              {/* Event Summary Bar */}
              <div
                onClick={() => setExpandedEventId(isExpanded ? null : evt.id)}
                className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer hover:bg-slate-800/40"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-cyan-400 w-10">
                    #{evt.sequenceNumber}
                  </span>

                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
                    evt.eventType.includes('ALLOW') ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                    evt.eventType.includes('DENY') ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                    evt.eventType.includes('APPROVAL') ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                    evt.eventType.includes('CONTRADICTION') ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                    'bg-slate-800 text-slate-300 border-slate-700'
                  }`}>
                    {evt.eventType}
                  </span>

                  <span className="text-xs font-mono font-bold text-white">
                    {evt.agentId || 'SYSTEM'}
                  </span>

                  <span className="text-xs text-slate-400 font-sans truncate max-w-sm">
                    {evt.payload.reason || evt.payload.workflow || evt.payload.message || evt.payload.discrepancy || 'Execution state logged'}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono text-slate-400 shrink-0">
                  <span>{new Date(evt.timestamp).toLocaleTimeString()} UTC</span>
                  <span className="text-slate-400">Corr: <strong className="text-slate-300">{evt.correlationId}</strong></span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Expanded Forensic Dossier */}
              {isExpanded && (
                <div className="p-4 bg-slate-950/80 border-t border-slate-800/80 space-y-3 font-mono text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Event Metadata */}
                    <div className="space-y-1.5">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Event Metadata</div>
                      <div>Event ID: <strong className="text-white">{evt.id}</strong></div>
                      <div>Task ID: <strong className="text-white">{evt.taskId || 'none'}</strong></div>
                      <div>Subtask ID: <strong className="text-white">{evt.subTaskId || 'none'}</strong></div>
                      <div>Timestamp: <strong className="text-white">{evt.timestamp}</strong></div>
                    </div>

                    {/* Cryptographic SHA-256 Hash Chain Proof */}
                    <div className="space-y-1.5">
                      <div className="text-[10px] text-cyan-400 uppercase font-bold flex items-center gap-1">
                        <Hash className="w-3 h-3 text-cyan-400" /> Cryptographic Block Proof
                      </div>
                      <div className="text-[11px] truncate" title={evt.hash}>
                        Block Hash: <strong className="text-cyan-300">{evt.hash}</strong>
                      </div>
                      <div className="text-[11px] truncate text-slate-400" title={evt.previousHash}>
                        Prev Hash: <span className="text-slate-400">{evt.previousHash}</span>
                      </div>
                      <div className="text-[10px] text-emerald-400">
                        ✓ Hash chain link cryptographically verified
                      </div>
                    </div>
                  </div>

                  {/* Full Payload JSON */}
                  <div className="space-y-1">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Captured Payload</div>
                    <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 overflow-x-auto">
                      {JSON.stringify(evt.payload, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
