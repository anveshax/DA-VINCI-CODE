import React from 'react';
import { 
  ShieldAlert, 
  Activity, 
  Users, 
  GitFork, 
  Scale, 
  Share2, 
  FileText, 
  Wrench, 
  Inbox, 
  FlaskConical, 
  Settings, 
  CheckCircle2, 
  AlertTriangle,
  Radio,
  Lock
} from 'lucide-react';

export type ActiveTab = 
  | 'overview'
  | 'agents'
  | 'observatory'
  | 'governance'
  | 'knowledge'
  | 'flight-recorder'
  | 'recovery'
  | 'approvals'
  | 'demo-lab'
  | 'settings';

interface NavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  pendingApprovalsCount: number;
  integrityValid: boolean;
  activeAgentsCount: number;
  totalAgentsCount: number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  pendingApprovalsCount,
  integrityValid,
  activeAgentsCount,
  totalAgentsCount,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const navItems = [
    { id: 'overview' as ActiveTab, label: 'Executive Overview', icon: Activity, badge: null },
    { id: 'agents' as ActiveTab, label: 'Agent Command Center', icon: Users, badge: `${activeAgentsCount}/${totalAgentsCount}` },
    { id: 'observatory' as ActiveTab, label: 'Workflow Observatory', icon: GitFork, badge: null },
    { id: 'governance' as ActiveTab, label: 'Governance & Simulator', icon: Scale, badge: 'v2.4' },
    { id: 'knowledge' as ActiveTab, label: 'Knowledge Graph', icon: Share2, badge: null },
    { id: 'flight-recorder' as ActiveTab, label: 'Flight Recorder', icon: FileText, badge: integrityValid ? 'SHA-256' : 'ALERT' },
    { id: 'recovery' as ActiveTab, label: 'Recovery Lab', icon: Wrench, badge: null },
    { id: 'approvals' as ActiveTab, label: 'Approval Inbox', icon: Inbox, badge: pendingApprovalsCount > 0 ? String(pendingApprovalsCount) : null, badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    { id: 'demo-lab' as ActiveTab, label: 'Interactive Demo Lab', icon: FlaskConical, badge: 'Live Demo', badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
    { id: 'settings' as ActiveTab, label: 'Settings & Architecture', icon: Settings, badge: null },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 lg:hidden"
        />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-72 bg-[#090d16] border-r border-slate-800/80 flex flex-col shrink-0 select-none transition-transform duration-200 lg:translate-x-0 ${
        isMobileOpen ? 'translate-x-0 shadow-2xl shadow-black/80' : '-translate-x-full lg:translate-x-0'
      }`}>
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 bg-[#070a12]/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-indigo-400/30">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wider text-base text-white">AEGIS NEXUS</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30 font-semibold">
                v2.4
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono tracking-tight">TEAM DA VINCI CODE</p>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 mt-2 font-mono italic">
          "Autonomous Intelligence. Governed by Design."
        </p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="text-[10px] uppercase tracking-wider font-mono text-slate-400 px-3 py-1 font-semibold">
          Control Plane Systems
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-violet-600/15 text-white border border-violet-500/30 shadow-sm shadow-violet-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-300'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                    item.badgeColor || 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Security Perimeter Status */}
      <div className="p-3.5 m-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] font-mono space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            Control Plane
          </span>
          <span className="text-emerald-400 font-semibold">ENFORCING</span>
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-slate-400 flex items-center gap-1">
            <Lock className="w-2.5 h-2.5 text-slate-400" />
            Audit Hash Chain
          </span>
          {integrityValid ? (
            <span className="text-cyan-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> VERIFIED
            </span>
          ) : (
            <span className="text-rose-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> FAULT
            </span>
          )}
        </div>
      </div>
    </aside>
    </>
  );
};
