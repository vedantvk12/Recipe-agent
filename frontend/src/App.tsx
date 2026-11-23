import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import type { TabType } from './components/Sidebar';
import TopBar from './components/TopBar';
import OverviewTab from './components/OverviewTab';
import RecipeStudioTab from './components/RecipeStudioTab';
import TraceExplorerTab from './components/TraceExplorerTab';
import KnowledgeBaseTab from './components/KnowledgeBaseTab';
import MemoryCenterTab from './components/MemoryCenterTab';
import EvaluationLabTab from './components/EvaluationLabTab';
import SettingsTab from './components/SettingsTab';
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

  useEffect(() => {
    refreshAllData();
    const interval = setInterval(checkHealthAndApprovals, 15000);
    return () => clearInterval(interval);
  }, [threadId, userId]);

  const checkHealthAndApprovals = async () => {
    try {
      const h = await apiClient.getHealth();
      setHealth(h);
      setIsBackendConnected(true);
      const apprs = await apiClient.getPendingApprovals();
      setPendingApprovals(apprs.pending_approvals || []);
    } catch {
      setIsBackendConnected(false);
    }
  };

  const refreshAllData = async () => {
    try {
      const [h, ev, apprs] = await Promise.all([
        apiClient.getHealth().catch(() => null),
        apiClient.getEvaluationResults().catch(() => null),
        apiClient.getPendingApprovals().catch(() => ({ pending_approvals: [] })),
      ]);
      if (h) {
        setHealth(h);
        setIsBackendConnected(true);
      } else {
        setIsBackendConnected(false);
      }
      if (ev) setEvalData(ev);
      if (apprs) setPendingApprovals(apprs.pending_approvals || []);
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

  return (
    <div className="flex h-screen bg-background text-textMain overflow-hidden font-sans selection:bg-primary/30">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingApprovalsCount={pendingApprovals.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <TopBar
          threadId={threadId}
          setThreadId={setThreadId}
          userId={userId}
          setUserId={setUserId}
          isBackendConnected={isBackendConnected}
          onNewSession={handleNewSession}
        />

        {/* Tab View Container */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            {activeTab === 'overview' && (
              <OverviewTab
                health={health}
                evalData={evalData}
                setActiveTab={setActiveTab}
                pendingCount={pendingApprovals.length}
              />
            )}
            {activeTab === 'studio' && (
              <RecipeStudioTab
                threadId={threadId}
                userId={userId}
                onExecutionComplete={handleExecutionComplete}
              />
            )}
            {activeTab === 'trace' && (
              <TraceExplorerTab
                trace={currentTrace}
                threadId={threadId}
                onRefreshApprovals={checkHealthAndApprovals}
              />
            )}
            {activeTab === 'knowledge' && <KnowledgeBaseTab />}
            {activeTab === 'memory' && (
              <MemoryCenterTab
                userId={userId}
                threadId={threadId}
                setUserId={setUserId}
              />
            )}
            {activeTab === 'evaluation' && <EvaluationLabTab />}
            {activeTab === 'settings' && (
              <SettingsTab health={health} onRefreshHealth={checkHealthAndApprovals} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
