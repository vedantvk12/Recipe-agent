import { useState, useEffect } from 'react';
import {
  Database,
  Plus,
  Trash2,
  RefreshCw,
  Layers,
  HelpCircle
} from 'lucide-react';
import { apiClient } from '../api/client';

interface MemoryCenterTabProps {
  userId: string;
  threadId: string;
  setUserId?: (u: string) => void;
}

export default function MemoryCenterTab({ userId, threadId }: MemoryCenterTabProps) {
  const [memories, setMemories] = useState<Record<string, Record<string, any>>>({});
  const [sessionSummary, setSessionSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newVal, setNewVal] = useState('');
  const [newNamespace, setNewNamespace] = useState('recipe_preferences');
  const [amnesiaToggle, setAmnesiaToggle] = useState(true);

  useEffect(() => {
    loadMemoryData();
  }, [userId, threadId]);

  const loadMemoryData = async () => {
    setLoading(true);
    try {
      const memRes = await apiClient.getUserMemory(userId);
      setMemories(memRes.namespaces || {});
      const sessRes = await apiClient.getSessionHistory(threadId);
      setSessionSummary(sessRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePref = async () => {
    if (!newKey.trim() || !newVal.trim()) return;
    try {
      await apiClient.setUserMemory({
        user_id: userId,
        namespace: newNamespace,
        key: newKey.trim(),
        value: isNaN(Number(newVal)) ? newVal.trim() : Number(newVal),
      });
      setNewKey('');
      setNewVal('');
      await loadMemoryData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePref = async (namespace: string, key: string) => {
    try {
      await apiClient.deleteUserMemory(userId, namespace, key);
      await loadMemoryData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSeed = async () => {
    setLoading(true);
    try {
      await apiClient.seedMemory();
      await loadMemoryData();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-textMain tracking-tight">Memory Center (Short-Term & Long-Term)</h2>
          <p className="text-xs text-textMuted mt-0.5">
            SQLite checkpointing for conversation thread continuity + persistent user profile store.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              if (window.confirm(`Clear all long-term memories for ${userId}?`)) {
                await apiClient.clearUserMemory(userId);
                await loadMemoryData();
              }
            }}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/30 flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Memory
          </button>
          <button
            onClick={handleSeed}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl bg-surfaceHighlight hover:bg-surfaceHighlight/80 text-textMain text-xs font-semibold border border-surfaceBorder flex items-center gap-2 transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Reset & Seed Profiles
          </button>
        </div>
      </div>

      {/* Two Column Layout: Short-Term Thread State vs Long-Term Profile Store */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Short-Term Memory Checkpoint Card */}
        <div className="p-6 rounded-2xl bg-surface border border-surfaceBorder space-y-4">
          <div className="flex items-center justify-between border-b border-surfaceBorder pb-3">
            <h3 className="text-sm font-bold text-textMain flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" /> Short-Term Thread State (SQLite)
            </h3>
            <span className="font-mono text-xs text-emerald-400 font-semibold">{threadId}</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-surfaceHighlight/40 border border-surfaceBorder">
              <span className="text-textMuted">Thread Exists in SQLite:</span>
              <span className="font-bold text-textMain">{sessionSummary?.exists ? 'Yes (Persistent)' : 'New / Empty'}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-surfaceHighlight/40 border border-surfaceBorder">
              <span className="text-textMuted">Saved Messages in History:</span>
              <span className="font-bold text-textMain">{sessionSummary?.messages_count ?? 0} Messages</span>
            </div>
            {sessionSummary?.last_message && (
              <div className="p-3 rounded-xl bg-background border border-surfaceBorder">
                <span className="text-[10px] text-textMuted font-mono block mb-1">LAST RECORDED MESSAGE:</span>
                <p className="text-textMain/80 italic line-clamp-3">{sessionSummary.last_message}</p>
              </div>
            )}
          </div>

          <div className="p-3 bg-surfaceHighlight/20 rounded-xl border border-surfaceBorder/60 text-[11px] text-textMuted leading-relaxed">
            Short-term memory stores checkpoint tuples in SQLite. If a user says "Scale it to 8", the system looks up previous turn ingredients and servings.
          </div>
        </div>

        {/* Long-Term Memory Scoped Store */}
        <div className="p-6 rounded-2xl bg-surface border border-surfaceBorder space-y-4">
          <div className="flex items-center justify-between border-b border-surfaceBorder pb-3">
            <h3 className="text-sm font-bold text-textMain flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" /> Long-Term Profile Store (SQLite)
            </h3>
            <span className="text-xs text-textMuted font-mono">user: {userId}</span>
          </div>

          {/* Stored Preferences Table */}
          <div className="space-y-3">
            {Object.keys(memories).length === 0 ? (
              <div className="p-6 text-center text-xs text-textMuted">
                No stored preferences found for {userId}. Click "Reset & Seed Profiles" above.
              </div>
            ) : (
              Object.entries(memories).map(([ns, kvs]) => (
                <div key={ns} className="p-3 rounded-xl bg-surfaceHighlight/30 border border-surfaceBorder">
                  <span className="text-[10px] font-mono font-bold text-primary uppercase">{ns}</span>
                  <div className="mt-2 space-y-1.5">
                    {Object.entries(kvs).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between text-xs py-1 border-b border-surfaceBorder/30 last:border-none">
                        <span className="text-textMuted font-mono">{k}:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-textMain">{JSON.stringify(v)}</span>
                          <button
                            onClick={() => handleDeletePref(ns, k)}
                            className="text-rose-400 hover:text-rose-300 p-0.5"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add Preference Form */}
          <div className="pt-2 border-t border-surfaceBorder/60 space-y-2">
            <span className="text-[11px] font-semibold text-textMuted uppercase">Add Custom Preference</span>
            <div className="grid grid-cols-12 gap-2">
              <select
                value={newNamespace}
                onChange={(e) => setNewNamespace(e.target.value)}
                className="col-span-4 p-2 rounded-lg bg-background border border-surfaceBorder text-xs text-textMain"
              >
                <option value="recipe_preferences">recipe_preferences</option>
                <option value="profile">profile</option>
              </select>
              <input
                type="text"
                placeholder="Key (e.g. preferred_units)"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                className="col-span-4 p-2 rounded-lg bg-background border border-surfaceBorder text-xs text-textMain"
              />
              <input
                type="text"
                placeholder="Value (e.g. grams)"
                value={newVal}
                onChange={(e) => setNewVal(e.target.value)}
                className="col-span-3 p-2 rounded-lg bg-background border border-surfaceBorder text-xs text-textMain"
              />
              <button
                onClick={handleSavePref}
                className="col-span-1 p-2 bg-primary hover:bg-primaryHover text-slate-900 rounded-lg flex items-center justify-center font-bold"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Amnesia Comparison Demonstration */}
      <div className="p-6 rounded-2xl bg-surface border border-surfaceBorder space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-textMain flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-amber-400" /> Empirical Demonstration: Amnesia vs Long-Term Recall
          </h3>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-textMuted">Simulate Memory State:</span>
            <button
              onClick={() => setAmnesiaToggle(!amnesiaToggle)}
              className={`px-3 py-1 rounded-lg font-bold border transition-all ${
                amnesiaToggle
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}
            >
              {amnesiaToggle ? 'Memory ENABLED (Elena: Metric/4 Servings)' : 'Memory DISABLED (Amnesia Simulation)'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-surfaceHighlight/30 border border-surfaceBorder">
            <span className="font-bold text-emerald-400 block mb-1">State: Memory Enabled</span>
            <p className="text-textMuted leading-relaxed">
              When memory is active, the agent retrieves <code className="text-primary font-mono font-semibold">metric_grams</code> and default <code className="text-primary font-mono font-semibold">4 servings</code> from SQLite without prompting the user.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surfaceHighlight/30 border border-surfaceBorder">
            <span className="font-bold text-rose-400 block mb-1">State: Memory Disabled (Amnesia)</span>
            <p className="text-textMuted leading-relaxed">
              When disabled, the agent has zero recollection of user habits and halts to ask for target servings and unit preferences every session.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
