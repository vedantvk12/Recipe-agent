import {
  LayoutDashboard,
  ChefHat,
  GitBranch,
  BookOpen,
  Database,
  FlaskConical,
  Settings
} from 'lucide-react';

export type TabType =
  | 'overview'
  | 'studio'
  | 'trace'
  | 'knowledge'
  | 'memory'
  | 'evaluation'
  | 'settings';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  pendingApprovalsCount: number;
}

export default function Sidebar({ activeTab, setActiveTab, pendingApprovalsCount }: SidebarProps) {
  const navItems = [
    { id: 'overview' as TabType, label: 'Overview', icon: LayoutDashboard },
    { id: 'studio' as TabType, label: 'Recipe Studio', icon: ChefHat },
    { id: 'trace' as TabType, label: 'Trace Explorer', icon: GitBranch, badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined },
    { id: 'knowledge' as TabType, label: 'Knowledge Base', icon: BookOpen },
    { id: 'memory' as TabType, label: 'Memory Center', icon: Database },
    { id: 'evaluation' as TabType, label: 'Evaluation Lab', icon: FlaskConical },
    { id: 'settings' as TabType, label: 'Settings & Health', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-surface border-r border-surfaceBorder flex flex-col justify-between shrink-0">
      <div className="p-4">
        {/* Brand */}
        <div className="flex items-center gap-3 px-2 py-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-bold text-lg">
            🍳
          </div>
          <div>
            <h1 className="text-sm font-bold text-textMain tracking-tight">Recipe Scaler AI</h1>
            <p className="text-[11px] text-textMuted font-mono">TA2 Agentic System</p>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-primary/15 text-primary border border-primary/30 shadow-sm'
                    : 'text-textMuted hover:text-textMain hover:bg-surfaceHighlight/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-textMuted'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full font-semibold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Model Indicator Footer */}
      <div className="p-4 border-t border-surfaceBorder/60">
        <div className="p-3 bg-surfaceHighlight/40 rounded-xl border border-surfaceBorder/40">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-textMuted uppercase tracking-wider font-semibold">Local Model</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="text-xs font-semibold text-textMain">qwen2.5:3b (Ollama)</div>
          <div className="text-[10px] text-textMuted mt-0.5">Embed: nomic-embed-text</div>
        </div>
      </div>
    </aside>
  );
}
