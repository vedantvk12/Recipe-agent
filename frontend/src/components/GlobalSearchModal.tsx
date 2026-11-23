import { useState, useEffect } from 'react';
import { Search, X, ChefHat, BookOpen, BrainCircuit, ArrowRight } from 'lucide-react';
import type { TabType } from './Sidebar';
import { apiClient } from '../api/client';
import type { SavedRecipe } from '../api/client';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: TabType, extra?: any) => void;
}

export default function GlobalSearchModal({ isOpen, onClose, onNavigate }: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');
  const [recipes, setRecipes] = useState<SavedRecipe[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadInitial();
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const loadInitial = async () => {
    try {
      const res = await apiClient.getSavedRecipes();
      setRecipes(res.recipes || []);
    } catch {
      // ignore
    }
  };

  if (!isOpen) return null;

  const filteredRecipes = recipes.filter(r =>
    r.title.toLowerCase().includes(query.toLowerCase()) ||
    r.cuisine.toLowerCase().includes(query.toLowerCase()) ||
    r.tags.some(t => t.toLowerCase().includes(query.toLowerCase()))
  );

  const quickNav = [
    { label: 'AI Recipe Studio', tab: 'studio' as TabType, icon: ChefHat, desc: 'Generate custom recipes with multi-agent orchestration' },
    { label: 'Recipe Scaling', tab: 'scaling' as TabType, icon: ChefHat, desc: 'Calculate fractional scaling and culinary non-linear ratios' },
    { label: 'Nutrition Intelligence', tab: 'nutrition' as TabType, icon: ChefHat, desc: 'Analyze macros, calories, and nutrient density' },
    { label: 'Knowledge Base (RAG)', tab: 'knowledge' as TabType, icon: BookOpen, desc: 'Explore vector knowledge chunks & citations' },
    { label: 'AI Memory Center', tab: 'memory' as TabType, icon: BrainCircuit, desc: 'Manage user dietary preferences and stored facts' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-surface border border-surfaceBorder rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-surfaceBorder gap-3">
          <Search className="w-5 h-5 text-textMuted" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search recipes, ingredients, culinary knowledge..."
            className="flex-1 bg-transparent text-sm text-textMain placeholder:text-textMuted focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-surfaceHighlight text-textMuted hover:text-textMain transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Body */}
        <div className="p-3 max-h-[60vh] overflow-y-auto space-y-4">
          {/* Matching Saved Recipes */}
          <div>
            <div className="text-[11px] font-semibold text-textMuted uppercase tracking-wider px-2 mb-2">
              Saved Recipes ({filteredRecipes.length})
            </div>
            {filteredRecipes.length === 0 ? (
              <div className="px-3 py-2 text-xs text-textMuted italic">No matching saved recipes found.</div>
            ) : (
              <div className="space-y-1">
                {filteredRecipes.slice(0, 5).map((rec) => (
                  <button
                    key={rec.id}
                    onClick={() => {
                      onNavigate('collection');
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-surfaceHighlight text-left transition-colors group"
                  >
                    <div>
                      <div className="text-xs font-semibold text-textMain group-hover:text-emerald-400 transition-colors">
                        {rec.title}
                      </div>
                      <div className="text-[11px] text-textMuted flex items-center gap-2 mt-0.5">
                        <span>{rec.cuisine}</span>
                        <span>•</span>
                        <span>{rec.servings} servings</span>
                        <span>•</span>
                        <span className="text-emerald-400/90 font-mono">{rec.calories} kcal</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-textMuted group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Platform Navigation */}
          <div className="pt-2 border-t border-surfaceBorder/60">
            <div className="text-[11px] font-semibold text-textMuted uppercase tracking-wider px-2 mb-2">
              Features & Tools
            </div>
            <div className="space-y-1">
              {quickNav.map((item) => (
                <button
                  key={item.tab}
                  onClick={() => {
                    onNavigate(item.tab);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-surfaceHighlight text-left transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="text-xs font-medium text-textMain group-hover:text-emerald-400 transition-colors">
                        {item.label}
                      </div>
                      <div className="text-[11px] text-textMuted">{item.desc}</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-textMuted group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-surfaceHighlight/30 border-t border-surfaceBorder text-[11px] text-textMuted flex items-center justify-between">
          <span>Navigate with mouse or arrow keys</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
}
