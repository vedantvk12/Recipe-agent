import { useState, useEffect } from 'react';
import {
  BookmarkCheck,
  Search,
  Star,
  Trash2,
  ChefHat,
  Scale,
  Printer,
  ArrowRight,
  X
} from 'lucide-react';
import { apiClient } from '../api/client';
import type { SavedRecipe } from '../api/client';
import type { TabType } from './Sidebar';

interface RecipeCollectionTabProps {
  userId: string;
  setActiveTab: (tab: TabType) => void;
  onScaleRecipe?: (recipe: SavedRecipe) => void;
}

export default function RecipeCollectionTab({
  userId,
  setActiveTab,
  onScaleRecipe
}: RecipeCollectionTabProps) {
  const [recipes, setRecipes] = useState<SavedRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState<string>('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [activeModalRecipe, setActiveModalRecipe] = useState<SavedRecipe | null>(null);

  useEffect(() => {
    loadRecipes();
  }, [userId, selectedCuisine, favoritesOnly]);

  const loadRecipes = async () => {
    setLoading(true);
    try {
      const res = await apiClient.getSavedRecipes({
        user_id: userId,
        query: searchQuery || undefined,
        cuisine: selectedCuisine !== 'all' ? selectedCuisine : undefined,
        favorites_only: favoritesOnly
      });
      setRecipes(res.recipes || []);
    } catch (err) {
      console.error('Failed to load recipes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (recipeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await apiClient.toggleFavoriteRecipe(recipeId);
      setRecipes(recipes.map(r => r.id === recipeId ? { ...r, is_favorite: res.is_favorite } : r));
      if (activeModalRecipe && activeModalRecipe.id === recipeId) {
        setActiveModalRecipe({ ...activeModalRecipe, is_favorite: res.is_favorite });
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const handleDeleteRecipe = async (recipeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this recipe from persistent storage?')) return;
    try {
      await apiClient.deleteRecipe(recipeId);
      setRecipes(recipes.filter(r => r.id !== recipeId));
      if (activeModalRecipe && activeModalRecipe.id === recipeId) {
        setActiveModalRecipe(null);
      }
    } catch (err) {
      console.error('Failed to delete recipe:', err);
    }
  };

  const cuisines = ['all', 'Indian', 'Mediterranean', 'American', 'Italian', 'Asian'];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surfaceBorder pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-textMain tracking-tight">Recipe Collection</h2>
            <span className="px-2 py-0.5 text-[10px] font-mono font-semibold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md">
              {recipes.length} Saved
            </span>
          </div>
          <p className="text-xs text-textMuted mt-0.5">
            Your persistent cookbook stored safely in local SQLite. Filter by cuisine or favorites.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('studio')}
          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-emerald-500/10"
        >
          <ChefHat className="w-4 h-4" />
          <span>New Recipe</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-surface border border-surfaceBorder rounded-2xl">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-textMuted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') loadRecipes();
            }}
            placeholder="Search by recipe title, ingredient or tags..."
            className="w-full pl-9 pr-4 py-2 bg-surfaceHighlight/50 border border-surfaceBorder rounded-xl text-xs text-textMain placeholder:text-textMuted focus:outline-none focus:border-emerald-500/40"
          />
        </div>

        {/* Cuisine Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {cuisines.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCuisine(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                selectedCuisine === c
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold'
                  : 'bg-surfaceHighlight/40 text-textMuted border border-transparent hover:text-textMain'
              }`}
            >
              {c}
            </button>
          ))}

          {/* Favorites Filter */}
          <button
            onClick={() => setFavoritesOnly(!favoritesOnly)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all border ${
              favoritesOnly
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 font-semibold'
                : 'bg-surfaceHighlight/40 text-textMuted border-transparent hover:text-textMain'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${favoritesOnly ? 'fill-amber-400 text-amber-400' : ''}`} />
            <span>Favorites</span>
          </button>
        </div>
      </div>

      {/* Recipe Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-textMuted text-xs">Loading collection...</div>
      ) : recipes.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-surface border border-surfaceBorder space-y-3">
          <BookmarkCheck className="w-10 h-10 text-textMuted mx-auto opacity-30" />
          <h3 className="text-sm font-semibold text-textMain">No Saved Recipes Found</h3>
          <p className="text-xs text-textMuted max-w-sm mx-auto">
            {searchQuery || selectedCuisine !== 'all' || favoritesOnly
              ? 'No recipes match your active search filters.'
              : 'Save your favorite recipes generated in AI Recipe Studio to see them here.'}
          </p>
          <button
            onClick={() => setActiveTab('studio')}
            className="px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/30 transition-all inline-flex items-center gap-2"
          >
            <span>Create with Recipe Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {recipes.map((rec) => (
            <div
              key={rec.id}
              onClick={() => setActiveModalRecipe(rec)}
              className="p-5 rounded-2xl bg-surface border border-surfaceBorder hover:border-surfaceBorderHover hover:bg-surfaceHighlight/20 cursor-pointer transition-all flex flex-col justify-between group shadow-lg shadow-black/20"
            >
              <div>
                {/* Card Top: Cuisine & Favorite */}
                <div className="flex items-center justify-between mb-2.5">
                  <span className="px-2.5 py-0.5 text-[10px] font-mono font-semibold uppercase bg-surfaceHighlight text-emerald-400 rounded-md border border-surfaceBorder">
                    {rec.cuisine}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleToggleFavorite(rec.id, e)}
                      className="p-1.5 rounded-lg hover:bg-surfaceHighlight text-textMuted hover:text-amber-400 transition-colors"
                      title={rec.is_favorite ? 'Favorited' : 'Add to Favorites'}
                    >
                      <Star className={`w-4 h-4 ${rec.is_favorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>
                    <button
                      onClick={(e) => handleDeleteRecipe(rec.id, e)}
                      className="p-1.5 rounded-lg hover:bg-surfaceHighlight text-textMuted hover:text-rose-400 transition-colors"
                      title="Delete recipe"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-textMain group-hover:text-emerald-400 transition-colors line-clamp-1">
                  {rec.title}
                </h3>
                <p className="text-xs text-textMuted mt-1.5 line-clamp-2 leading-relaxed">
                  {rec.description}
                </p>

                {/* Tags */}
                {rec.tags && rec.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {rec.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="px-2 py-0.5 text-[10px] bg-surfaceHighlight/40 text-textMuted rounded-md">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Meta Bar */}
              <div className="mt-4 pt-3 border-t border-surfaceBorder/60 flex items-center justify-between text-xs font-mono">
                <span className="text-emerald-400 font-bold">{rec.calories} kcal</span>
                <span className="text-textMuted">{rec.protein_g}g Protein</span>
                <span className="text-textMuted">{rec.cook_time}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recipe Details Full Modal Dialog */}
      {activeModalRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-surface border border-surfaceBorder rounded-3xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-surfaceBorder flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 text-[10px] font-mono font-semibold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-md">
                    {activeModalRecipe.cuisine}
                  </span>
                  <span className="text-xs text-textMuted font-mono">
                    {activeModalRecipe.servings} Servings • {activeModalRecipe.cook_time}
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-textMain">{activeModalRecipe.title}</h3>
                <p className="text-xs text-textMuted mt-1">{activeModalRecipe.description}</p>
              </div>

              <button
                onClick={() => setActiveModalRecipe(null)}
                className="p-1.5 rounded-xl hover:bg-surfaceHighlight text-textMuted hover:text-textMain transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Macro Bar */}
              <div className="grid grid-cols-4 gap-2 p-3 bg-surfaceHighlight/40 border border-surfaceBorder rounded-xl text-center font-mono text-xs">
                <div>
                  <div className="text-[10px] text-textMuted uppercase">Calories</div>
                  <div className="font-bold text-amber-400 mt-0.5">{activeModalRecipe.calories} kcal</div>
                </div>
                <div>
                  <div className="text-[10px] text-textMuted uppercase">Protein</div>
                  <div className="font-bold text-emerald-400 mt-0.5">{activeModalRecipe.protein_g}g</div>
                </div>
                <div>
                  <div className="text-[10px] text-textMuted uppercase">Carbs</div>
                  <div className="font-bold text-textMain mt-0.5">{activeModalRecipe.carbs_g}g</div>
                </div>
                <div>
                  <div className="text-[10px] text-textMuted uppercase">Fat</div>
                  <div className="font-bold text-textMain mt-0.5">{activeModalRecipe.fat_g}g</div>
                </div>
              </div>

              {/* Ingredients List */}
              <div>
                <h4 className="text-xs font-bold text-textMain uppercase tracking-wider mb-2">
                  Ingredients ({activeModalRecipe.ingredients?.length || 0})
                </h4>
                <div className="space-y-1.5">
                  {(activeModalRecipe.ingredients || []).map((ing: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-surfaceHighlight/30 border border-surfaceBorder rounded-lg text-xs">
                      <span className="font-medium text-textMain">{ing.name}</span>
                      <span className="font-mono text-emerald-400 font-semibold">{ing.amount} {ing.unit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              <div>
                <h4 className="text-xs font-bold text-textMain uppercase tracking-wider mb-2">
                  Instructions
                </h4>
                <ol className="space-y-2">
                  {(activeModalRecipe.instructions || []).map((step: string, i: number) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-textMain leading-relaxed p-2.5 rounded-lg bg-surfaceHighlight/20 border border-surfaceBorder">
                      <span className="font-bold text-emerald-400 font-mono text-[11px] mt-0.5">{i + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="p-4 bg-surfaceHighlight/40 border-t border-surfaceBorder flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (onScaleRecipe) {
                      onScaleRecipe(activeModalRecipe);
                      setActiveModalRecipe(null);
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-surfaceHighlight hover:bg-surfaceHighlight/80 text-textMain border border-surfaceBorder text-xs font-semibold flex items-center gap-1.5"
                >
                  <Scale className="w-4 h-4 text-blue-400" />
                  <span>Scale Ingredients</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="p-2 rounded-xl bg-surfaceHighlight hover:bg-surfaceHighlight/80 text-textMuted hover:text-textMain border border-surfaceBorder"
                  title="Print Recipe"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => setActiveModalRecipe(null)}
                className="px-4 py-2 rounded-xl bg-surfaceHighlight hover:bg-surfaceHighlight/80 text-xs font-semibold text-textMain border border-surfaceBorder"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
