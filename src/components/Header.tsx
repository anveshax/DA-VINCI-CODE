import React, { useState, useEffect } from 'react';
import { 
  Play, 
  ShieldCheck, 
  Sparkles, 
  Cpu, 
  Clock, 
  Bell,
  RefreshCw,
  Menu
} from 'lucide-react';

interface HeaderProps {
  activeTabTitle: string;
  onQuickRunDemo: () => void;
  isExecuting: boolean;
  systemMode: string;
  onRefresh: () => void;
  onOpenMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTabTitle,
  onQuickRunDemo,
  isExecuting,
  systemMode,
  onRefresh,
  onOpenMobileMenu,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(now.toTimeString().split(' ')[0] + ' UTC');
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-[#080b12]/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between z-10 shrink-0">
      {/* Title & Breadcrumbs */}
      <div className="flex items-center gap-3">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            aria-label="Open mobile navigation menu"
            className="lg:hidden p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-sm sm:text-base font-bold text-white tracking-wide truncate max-w-[180px] sm:max-w-none">
          {activeTabTitle}
        </h1>
        <div className="h-4 w-px bg-slate-800 hidden sm:block" />
        <span className="text-xs text-slate-400 font-mono hidden md:inline">
          aegis-nexus://control-plane/v2.4
        </span>
      </div>

      {/* Controls & Badges */}
      <div className="flex items-center gap-3">
        {/* Real-time Clock */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-xs font-mono text-slate-400">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>{currentTime || '02:30:00 UTC'}</span>
        </div>

        {/* System Mode Pill */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-violet-950/40 border border-violet-800/40 text-xs font-mono text-violet-300">
          <Cpu className="w-3.5 h-3.5 text-violet-400" />
          <span className="font-medium hidden sm:inline">Execution Mode:</span>
          <span className="text-white font-semibold">{systemMode.replace(/_/g, ' ')}</span>
        </div>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          title="Refresh State"
          aria-label="Refresh application state"
          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isExecuting ? 'animate-spin text-cyan-400' : ''}`} />
        </button>

        {/* Quick Launch Vendor Onboarding Workflow */}
        <button
          onClick={onQuickRunDemo}
          disabled={isExecuting}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-cyan-900/20 border border-cyan-400/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-white" />
          <span>{isExecuting ? 'Evaluating...' : 'Run Vendor Onboarding'}</span>
        </button>
      </div>
    </header>
  );
};
