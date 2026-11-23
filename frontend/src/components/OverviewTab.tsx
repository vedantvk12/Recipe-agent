import { useState, useEffect } from 'react';
import {
  Sparkles,
  ChefHat,
  BookmarkCheck,
  Scale,
  Flame,
  Activity,
  ArrowRight,
  ShieldCheck,
  Clock,
  Zap
} from 'lucide-react';
import type { TabType } from './Sidebar';
import { apiClient } from '../api/client';
import type { HealthStatus, EvaluationResult, SavedRecipe } from '../api/client';

interface OverviewTabProps {
  health: HealthStatus | null;
  evalData: EvaluationResult | null;
  setActiveTab: (tab: TabType) => void;
  pendingCount: number;
  userId: string;
}

export default function OverviewTab({
  health,
  evalData: _evalData,
  setActiveTab,
  pendingCount,
  userId,
}: OverviewTabProps) {
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [quickInput, setQuickInput] = useState('');

  useEffect(() => {
    loadSavedRecipes();
  }, [userId]);

  const loadSavedRecipes = async () => {
    try {
      const res = await apiClient.getSavedRecipes({ user_id: userId });
      setSavedRecipes(res.recipes || []);
    } catch {
      // ignore
    }
  };

  const quickPrompts = [
    {
      title: 'High-Protein Indian Paneer Dinner',
      desc: 'Paneer, tomatoes, onions, basmati rice under 30 mins',
      prompt: 'I have paneer, tomatoes, onions and rice. Create a high-protein Indian dinner for two people that takes less than 30 minutes.'
    },
    {
      title: 'Mediterranean Quinoa Power Lunch',
      desc: 'Quinoa, chickpeas, cucumber, lemon-herb dressing',
      prompt: 'Create a Mediterranean quinoa and chickpea bowl for 4 servings with fresh lemon-herb dressing.'
    },
    {
      title: 'Keto Garlic Butter Salmon',
      desc: 'Salmon fillets, garlic butter, fresh asparagus',
      prompt: 'Pan-seared garlic herb butter salmon for 2 servings with asparagus spears.'
    },
    {
      title: 'Standard Recipe Scaling & Calorie Test',
      desc: '4 to 8 servings flour scaling with calories',
      prompt: 'A recipe serves 4 people and uses 2 cups of flour. Scale it to serve 8 people. Each cup contains 455 calories. Calculate the calories for the scaled amount.'
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Personalized Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-surfaceHighlight/80 via-surface to-surfaceHighlight/50 border border-surfaceBorder p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Autonomous LangGraph Multi-Agent Culinary AI</span>
          </div>
          <h1 className="text-3xl font-extrabold text-textMain tracking-tight">
            Welcome back, <span className="text-emerald-400">{userId === 'chef_elena' ? 'Chef Elena' : userId === 'chef_marcus' ? 'Chef Marcus' : 'Executive Chef'}</span>
          </h1>
          <p className="mt-2 text-sm text-textMuted leading-relaxed">
            Your intelligence platform is ready. Scale recipes with non-linear culinary physics, estimate accurate macronutrient distributions, explore local Chroma vector embeddings, and visualize supervisor multi-agent routing.
          </p>

          {/* Quick AI Search / Launch Box */}
          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && quickInput.trim()) {
                    setActiveTab('studio');
                  }
                }}
                placeholder="Ask recipe agent... (e.g. 'Scale 2 cups of flour from 4 to 8 servings at 455 kcal/cup')"
                className="w-full px-4 py-3 bg-surface border border-surfaceBorder rounded-2xl text-xs text-textMain placeholder:text-textMuted focus:outline-none focus:border-emerald-500/50 shadow-inner"
              />
            </div>
            <button
              onClick={() => setActiveTab('studio')}
              className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              <span>Launch Studio</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI & System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Ollama Model Card */}
        <div className="p-5 rounded-2xl bg-surface border border-surfaceBorder flex flex-col justify-between">
          <div className="flex items-center justify-between text-textMuted">
            <span className="text-xs font-medium">Local LLM Engine</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold text-textMain">{health?.llm_model || 'qwen2.5:3b'}</div>
            <div className="text-[11px] text-emerald-400 font-mono mt-0.5">
              {health?.ollama_live ? 'Offline Local Inference' : 'Standby'}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-surfaceBorder/60 text-[11px] text-textMuted flex items-center justify-between">
            <span>Latency</span>
            <span className="font-mono text-textMain">{health?.ollama_latency_ms ? `${health.ollama_latency_ms} ms` : '1.2 ms (Local)'}</span>
          </div>
        </div>

        {/* Vector DB RAG Chunks */}
        <div className="p-5 rounded-2xl bg-surface border border-surfaceBorder flex flex-col justify-between">
          <div className="flex items-center justify-between text-textMuted">
            <span className="text-xs font-medium">ChromaDB RAG</span>
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold text-textMain">{health?.chroma_chunks_count || 12} Chunks</div>
            <div className="text-[11px] text-indigo-400 font-mono mt-0.5">nomic-embed-text (768d)</div>
          </div>
          <div className="mt-4 pt-3 border-t border-surfaceBorder/60 text-[11px] text-textMuted flex items-center justify-between">
            <span>Sources</span>
            <span className="text-textMain font-mono">4 Markdown Docs</span>
          </div>
        </div>

        {/* Saved Recipes Count */}
        <div className="p-5 rounded-2xl bg-surface border border-surfaceBorder flex flex-col justify-between">
          <div className="flex items-center justify-between text-textMuted">
            <span className="text-xs font-medium">Saved Collection</span>
            <BookmarkCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold text-textMain">{savedRecipes.length} Recipes</div>
            <div className="text-[11px] text-amber-400 font-mono mt-0.5">Persistent SQLite Store</div>
          </div>
          <div className="mt-4 pt-3 border-t border-surfaceBorder/60 text-[11px] text-textMuted flex items-center justify-between">
            <span>Storage</span>
            <span className="text-textMain font-mono">recipes.sqlite</span>
          </div>
        </div>

        {/* Human Oversight Gate */}
        <div className="p-5 rounded-2xl bg-surface border border-surfaceBorder flex flex-col justify-between">
          <div className="flex items-center justify-between text-textMuted">
            <span className="text-xs font-medium">Human Safety Gate</span>
            <Clock className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold text-textMain">
              {pendingCount > 0 ? `${pendingCount} Pending` : '0 Actions Required'}
            </div>
            <div className="text-[11px] text-rose-400 font-mono mt-0.5">
              {pendingCount > 0 ? 'Consequential Approval Gate' : 'Guardrails Armed'}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-surfaceBorder/60 text-[11px] text-textMuted flex items-center justify-between">
            <span>Threshold</span>
            <span className="text-textMain font-mono">&gt;10x or &lt;0.1x Scale</span>
          </div>
        </div>
      </div>

      {/* Quick Recipe Generation Shortcuts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-textMain tracking-tight">Quick Generation Templates</h2>
            <p className="text-xs text-textMuted">Preset workflows ready to trigger the multi-agent graph with one click.</p>
          </div>
          <button
            onClick={() => setActiveTab('studio')}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
          >
            <span>Custom Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickPrompts.map((p, idx) => (
            <div
              key={idx}
              onClick={() => setActiveTab('studio')}
              className="p-5 rounded-2xl bg-surface border border-surfaceBorder hover:border-emerald-500/40 hover:bg-surfaceHighlight/40 cursor-pointer transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-textMain group-hover:text-emerald-400 transition-colors">
                    {p.title}
                  </h3>
                  <ChefHat className="w-4 h-4 text-textMuted group-hover:text-emerald-400 transition-colors" />
                </div>
                <p className="text-xs text-textMuted mt-1.5">{p.desc}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-surfaceBorder/60 flex items-center justify-between text-xs text-textMuted">
                <span className="text-[11px] font-mono text-emerald-400/90 truncate max-w-[280px]">
                  "{p.prompt}"
                </span>
                <span className="text-emerald-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                  Run &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Saved Recipes Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-textMain tracking-tight">Featured Culinary Collection</h2>
            <p className="text-xs text-textMuted">Stored recipes with validated ingredients and macronutrient data.</p>
          </div>
          <button
            onClick={() => setActiveTab('collection')}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
          >
            <span>View All ({savedRecipes.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {savedRecipes.slice(0, 3).map((rec) => (
            <div
              key={rec.id}
              onClick={() => setActiveTab('collection')}
              className="p-5 rounded-2xl bg-surface border border-surfaceBorder hover:border-surfaceBorderHover cursor-pointer transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 text-[10px] font-mono font-semibold uppercase bg-surfaceHighlight text-emerald-400 rounded-md border border-surfaceBorder">
                    {rec.cuisine}
                  </span>
                  <span className="text-xs text-textMuted font-mono">{rec.cook_time}</span>
                </div>
                <h3 className="text-sm font-bold text-textMain line-clamp-1">{rec.title}</h3>
                <p className="text-xs text-textMuted mt-1 line-clamp-2 leading-relaxed">{rec.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-surfaceBorder/60 flex items-center justify-between text-xs font-mono">
                <span className="text-emerald-400 font-bold">{rec.calories} kcal</span>
                <span className="text-textMuted">{rec.protein_g}g Protein</span>
                <span className="text-textMuted">{rec.servings} Servings</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Quick Jump Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <button
          onClick={() => setActiveTab('scaling')}
          className="p-4 rounded-2xl bg-surface border border-surfaceBorder hover:border-emerald-500/30 flex items-center gap-3 text-left transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-textMain">Intelligent Scaling Workbench</div>
            <div className="text-[11px] text-textMuted">Non-linear culinary conversions</div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('nutrition')}
          className="p-4 rounded-2xl bg-surface border border-surfaceBorder hover:border-emerald-500/30 flex items-center gap-3 text-left transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-textMain">Nutrition Analytics</div>
            <div className="text-[11px] text-textMuted">Macro distributions & density score</div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className="p-4 rounded-2xl bg-surface border border-surfaceBorder hover:border-emerald-500/30 flex items-center gap-3 text-left transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-textMain">Live Multi-Agent Stream</div>
            <div className="text-[11px] text-textMuted">LangGraph state visualization</div>
          </div>
        </button>
      </div>
    </div>
  );
}
