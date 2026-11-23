import { User, Hash, RefreshCw, Search, CheckCircle2, AlertCircle } from 'lucide-react';
import type { HealthStatus } from '../api/client';

interface TopBarProps {
  threadId: string;
  setThreadId: (id: string) => void;
  userId: string;
  setUserId: (id: string) => void;
  health: HealthStatus | null;
  isBackendConnected: boolean;
  onNewSession: () => void;
  onOpenSearch: () => void;
}

export default function TopBar({
  threadId,
  userId,
  setUserId,
  health,
  isBackendConnected,
  onNewSession,
  onOpenSearch,
}: TopBarProps) {
  return (
    <header className="h-14 border-b border-surfaceBorder bg-surface/90 backdrop-blur-md px-6 flex items-center justify-between z-10 shrink-0">
      <div className="flex items-center gap-4">
        {/* Global Search Trigger */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2.5 px-3 py-1.5 bg-surfaceHighlight/60 hover:bg-surfaceHighlight border border-surfaceBorder rounded-xl text-xs text-textMuted hover:text-textMain transition-all shadow-sm group"
        >
          <Search className="w-3.5 h-3.5 text-textMuted group-hover:text-emerald-400 transition-colors" />
          <span className="font-normal">Quick search...</span>
          <kbd className="ml-3 px-1.5 py-0.5 text-[10px] bg-surface border border-surfaceBorder rounded text-textMuted font-mono">
            Ctrl+K
          </kbd>
        </button>

        {/* User Scoping Selector */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-surfaceHighlight/50 border border-surfaceBorder rounded-xl text-xs">
          <User className="w-3.5 h-3.5 text-textMuted" />
          <span className="text-textMuted">Profile:</span>
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="bg-transparent text-textMain font-medium focus:outline-none cursor-pointer"
          >
            <option value="chef_elena" className="bg-surface text-textMain">Elena Rostova (Metric • Dairy-Free)</option>
            <option value="chef_marcus" className="bg-surface text-textMain">Marcus Chen (US Units • Peanut Allergy)</option>
            <option value="default_chef" className="bg-surface text-textMain">Default Chef (Universal)</option>
          </select>
        </div>

        {/* Active Session Thread Identifier */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-surfaceHighlight/50 border border-surfaceBorder rounded-xl text-xs">
          <Hash className="w-3.5 h-3.5 text-textMuted" />
          <span className="text-textMuted">Thread:</span>
          <span className="font-mono text-emerald-400 font-semibold">{threadId}</span>
        </div>

        <button
          onClick={onNewSession}
          title="Start fresh conversation thread"
          className="p-1.5 rounded-xl bg-surfaceHighlight/40 hover:bg-surfaceHighlight text-textMuted hover:text-textMain border border-surfaceBorder transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Model & System Health Badges */}
      <div className="flex items-center gap-3">
        {/* Ollama Status */}
        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${
            health?.ollama_live
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              health?.ollama_live ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`}
          />
          <span>{health?.ollama_live ? 'Ollama Live (qwen2.5:3b)' : 'Ollama Standby'}</span>
        </div>

        {/* Backend Status */}
        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${
            isBackendConnected
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
          }`}
        >
          {isBackendConnected ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
          )}
          <span>{isBackendConnected ? 'FastAPI 8000' : 'Offline'}</span>
        </div>
      </div>
    </header>
  );
}
