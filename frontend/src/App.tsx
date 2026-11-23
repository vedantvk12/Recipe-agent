import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import type { TabType } from './components/Sidebar';
import TopBar from './components/TopBar';
import OverviewTab from './components/OverviewTab';
import RecipeStudioTab from './components/RecipeStudioTab';
import RecipeCollectionTab from './components/RecipeCollectionTab';
import RecipeScalingTab from './components/RecipeScalingTab';
import NutritionIntelligenceTab from './components/NutritionIntelligenceTab';
import MemoryCenterTab from './components/MemoryCenterTab';
import KnowledgeBaseTab from './components/KnowledgeBaseTab';
import AgentActivityTab from './components/AgentActivityTab';
import EvaluationLabTab from './components/EvaluationLabTab';
import SettingsTab from './components/SettingsTab';
import GlobalSearchModal from './components/GlobalSearchModal';
import { apiClient } from './api/client';
import type { HealthStatus, EvaluationResult, RecipeResponse, TraceStep } from './api/client';

export type { TraceStep, RecipeResponse };

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [threadId, setThreadId] = useState<string>('session_main');
  const [userId, setUserId] = useState<string>('chef_elena');
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [evalData, setEvalData] = useState<EvaluationResult | null>(null);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [currentTrace, setCurrentTrace] = useState<TraceStep[]>([]);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(true);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [savedRecipesCount, setSavedRecipesCount] = useState<number>(0);
  const [recipeToScale, setRecipeToScale] = useState<any | null>(null);

  useEffect(() => {
    refreshAllData();
    const interval = setInterval(checkHealthAndApprovals, 12000);
    return () => clearInterval(interval);
  }, [threadId, userId]);

  // Keyboard shortcut Ctrl+K / Cmd+K to open search modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const checkHealthAndApprovals = async () => {
    try {
      const [h, apprs, recs] = await Promise.all([
        apiClient.getHealth().catch(() => null),
        apiClient.getPendingApprovals().catch(() => ({ pending_approvals: [] })),
        apiClient.getSavedRecipes({ user_id: userId }).catch(() => ({ recipes: [] }))
      ]);

      if (h) {
        setHealth(h);
        setIsBackendConnected(true);
      } else {
        setIsBackendConnected(false);
      }
      setPendingApprovals(apprs?.pending_approvals || []);
      setSavedRecipesCount(recs?.recipes?.length || 0);
    } catch {
      setIsBackendConnected(false);
    }
  };

  const refreshAllData = async () => {
    try {
      const [h, ev, apprs, recs] = await Promise.all([
        apiClient.getHealth().catch(() => null),
        apiClient.getEvaluationResults().catch(() => null),
        apiClient.getPendingApprovals().catch(() => ({ pending_approvals: [] })),
        apiClient.getSavedRecipes({ user_id: userId }).catch(() => ({ recipes: [] }))
      ]);

      if (h) {
        setHealth(h);
        setIsBackendConnected(true);
      } else {
        setIsBackendConnected(false);
      }
      if (ev) setEvalData(ev);
      setPendingApprovals(apprs?.pending_approvals || []);
      setSavedRecipesCount(recs?.recipes?.length || 0);
    } catch {
      setIsBackendConnected(false);
    }
  };

  const handleExecutionComplete = (res: RecipeResponse) => {
    if (res.trace && res.trace.length > 0) {
      setCurrentTrace(res.trace);
    }
    checkHealthAndApprovals();
  };

  const handleNewSession = () => {
    const newId = `session_${Math.random().toString(36).substring(2, 8)}`;
    setThreadId(newId);
    setCurrentTrace([]);
  };

  const handleNavigateToScaling = (recipe: any) => {
    setRecipeToScale(recipe);
    setActiveTab('scaling');
  };

  return (
    <div className="flex h-screen bg-background text-textMain overflow-hidden font-sans selection:bg-emerald-500/20">
      {/* Global Command Palette / Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={(tab, extra) => {
          setActiveTab(tab);
          if (extra) setRecipeToScale(extra);
        }}
      />

      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingApprovalsCount={pendingApprovals.length}
        savedRecipesCount={savedRecipesCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <TopBar
          threadId={threadId}
          setThreadId={setThreadId}
          userId={userId}
          setUserId={setUserId}
          health={health}
          isBackendConnected={isBackendConnected}
          onNewSession={handleNewSession}
          onOpenSearch={() => setIsSearchOpen(true)}
        />

        {/* Tab View Container */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto">
            {activeTab === 'overview' && (
              <OverviewTab
                health={health}
                evalData={evalData}
                setActiveTab={setActiveTab}
                pendingCount={pendingApprovals.length}
                userId={userId}
              />
            )}
            {activeTab === 'studio' && (
              <RecipeStudioTab
                threadId={threadId}
                userId={userId}
                onExecutionComplete={handleExecutionComplete}
                onNavigateToScaling={handleNavigateToScaling}
              />
            )}
            {activeTab === 'collection' && (
              <RecipeCollectionTab
                userId={userId}
                setActiveTab={setActiveTab}
                onScaleRecipe={handleNavigateToScaling}
              />
            )}
            {activeTab === 'scaling' && (
              <RecipeScalingTab
                initialRecipe={recipeToScale}
              />
            )}
            {activeTab === 'nutrition' && (
              <NutritionIntelligenceTab />
            )}
            {activeTab === 'activity' && (
              <AgentActivityTab
                trace={currentTrace}
                threadId={threadId}
                userId={userId}
                onRefreshApprovals={checkHealthAndApprovals}
              />
            )}
            {activeTab === 'knowledge' && <KnowledgeBaseTab />}
            {activeTab === 'memory' && (
              <MemoryCenterTab
                userId={userId}
                threadId={threadId}
              />
            )}
            {activeTab === 'evaluation' && <EvaluationLabTab />}
            {activeTab === 'settings' && (
              <SettingsTab
                health={health}
                onRefreshHealth={checkHealthAndApprovals}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
