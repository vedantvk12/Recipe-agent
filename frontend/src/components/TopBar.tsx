import { User, Hash, RefreshCw } from 'lucide-react';

interface TopBarProps {
  threadId: string;
  setThreadId?: (id: string) => void;
  userId: string;
  setUserId: (id: string) => void;
  isBackendConnected: boolean;
  onNewSession: () => void;
}

export default function TopBar({
  threadId,
  userId,
  setUserId,
  isBackendConnected,
  onNewSession,
}: TopBarProps) {
  return (
    <header className="h-14 border-b border-surfaceBorder bg-surface/90 backdrop-blur-md px-6 flex items-center justify-between z-10 shrink-0">
      <div className="flex items-center gap-4">
        {/* User Scoping Selector */}
        <div className="flex items-center gap-2 px-3 py-1 bg-surfaceHighlight/60 border border-surfaceBorder rounded-lg text-xs">
          <User className="w-3.5 h-3.5 text-textMuted" />
          <span className="text-textMuted">Profile:</span>
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="bg-transparent text-textMain font-medium focus:outline-none cursor-pointer"
          >
            <option value="chef_elena" className="bg-surface text-textMain">Elena Rostova (Metric)</option>
            <option value="chef_marcus" className="bg-surface text-textMain">Marcus Chen (US Cups)</option>
            <option value="default_chef" className="bg-surface text-textMain">Default Chef</option>
          </select>
        </div>

        {/* Thread Session Selector */}
        <div className="flex items-center gap-2 px-3 py-1 bg-surfaceHighlight/60 border border-surfaceBorder rounded-lg text-xs">
          <Hash className="w-3.5 h-3.5 text-textMuted" />
          <span className="text-textMuted">Thread:</span>
          <span className="font-mono text-emerald-400 font-medium">{threadId}</span>
        </div>

        <button
          onClick={onNewSession}
          title="Create New Conversation Thread"
          className="p-1.5 rounded-lg bg-surfaceHighlight/40 hover:bg-surfaceHighlight text-textMuted hover:text-textMain border border-surfaceBorder transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Backend Status Badge */}
      <div className="flex items-center gap-2">
        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${
            isBackendConnected
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isBackendConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
            }`}
          />
          <span>{isBackendConnected ? 'Backend Live' : 'Backend Offline'}</span>
        </div>
      </div>
    </header>
  );
}
