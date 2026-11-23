import {
  LayoutDashboard,
  ChefHat,
  BookmarkCheck,
  Scale,
  Flame,
  BrainCircuit,
  BookOpen,
  Activity,
  Settings,
  Sparkles,
  FlaskConical
} from 'lucide-react';

export type TabType =
  | 'overview'
  | 'studio'
  | 'collection'
  | 'scaling'
  | 'nutrition'
  | 'memory'
  | 'knowledge'
  | 'activity'
  | 'evaluation'
  | 'settings';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  pendingApprovalsCount: number;
  savedRecipesCount: number;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  pendingApprovalsCount,
  savedRecipesCount
}: SidebarProps) {
  const navItems = [
    { id: 'overview' as TabType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'studio' as TabType, label: 'AI Recipe Studio', icon: ChefHat, badge: 'AI', badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    { id: 'collection' as TabType, label: 'Recipe Collection', icon: BookmarkCheck, count: savedRecipesCount },
    { id: 'scaling' as TabType, label: 'Recipe Scaling', icon: Scale },
    { id: 'nutrition' as TabType, label: 'Nutrition Intelligence', icon: Flame },
    { id: 'memory' as TabType, label: 'AI Memory', icon: BrainCircuit },
    { id: 'knowledge' as TabType, label: 'Knowledge Base (RAG)', icon: BookOpen },
    {
      id: 'activity' as TabType,
      label: 'Agent Activity',
      icon: Activity,
      count: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
      countColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse'
    },
    { id: 'evaluation' as TabType, label: 'Evaluation Lab', icon: FlaskConical },
    { id: 'settings' as TabType, label: 'Settings & Health', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-surface border-r border-surfaceBorder flex flex-col justify-between shrink-0 select-none">
      <div className="p-4">
        {/* Brand */}
        <div className="flex items-center gap-3 px-2 py-3 mb-5 border-b border-surfaceBorder/60 pb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-indigo-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/5">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-bold text-textMain tracking-tight">Recipe-Agent</h1>
              <span className="px-1.5 py-0.2 text-[9px] font-mono font-semibold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded">
                v2.1
              </span>
            </div>
            <p className="text-[11px] text-textMuted tracking-tight font-medium">Culinary Intelligence Platform</p>
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
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm font-semibold'
                    : 'text-textMuted hover:text-textMain hover:bg-surfaceHighlight/50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-textMuted'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded-md border ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
                {item.count !== undefined && (
                  <span className={`px-2 py-0.5 text-[10px] rounded-full font-mono font-semibold border ${item.countColor || 'bg-surfaceHighlight text-textMuted border-surfaceBorder'}`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Model & System Health Footer */}
      <div className="p-4 border-t border-surfaceBorder/60">
        <div className="p-3 bg-surfaceHighlight/30 rounded-xl border border-surfaceBorder/40">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-textMuted uppercase tracking-wider font-semibold">Local Architecture</span>
            <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Active
            </span>
          </div>
          <div className="text-xs font-semibold text-textMain flex items-center justify-between">
            <span>qwen2.5:3b</span>
            <span className="text-[10px] text-textMuted font-mono font-normal">Ollama</span>
          </div>
          <div className="text-[10px] text-textMuted mt-1 flex items-center justify-between font-mono">
            <span>RAG: nomic-embed</span>
            <span>SQLite WAL</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
