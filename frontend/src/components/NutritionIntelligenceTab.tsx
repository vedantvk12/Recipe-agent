import { useState, useEffect } from 'react';
import {
  Flame,
  PieChart,
  Info,
  Plus,
  Trash2
} from 'lucide-react';
import { apiClient } from '../api/client';
import type { IngredientItem, NutritionAnalysisResult } from '../api/client';

export default function NutritionIntelligenceTab() {
  const [servings, setServings] = useState<number>(2);
  const [viewMode, setViewMode] = useState<'per_serving' | 'total'>('per_serving');
  const [ingredients, setIngredients] = useState<IngredientItem[]>([
    { name: 'Paneer', amount: 250, unit: 'grams' },
    { name: 'Basmati Rice', amount: 1, unit: 'cups' },
    { name: 'Greek Yogurt (plain)', amount: 0.5, unit: 'cups' },
    { name: 'Olive Oil', amount: 1, unit: 'tbsp' }
  ]);

  const [nutritionData, setNutritionData] = useState<NutritionAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    calculateNutrition();
  }, [servings, ingredients]);

  const calculateNutrition = async () => {
    if (ingredients.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.analyzeNutrition({
        ingredients: ingredients,
        servings: servings
      });
      setNutritionData(res.nutrition);
    } catch (err: any) {
      setError(err.message || 'Nutrition analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { name: 'Chicken Breast', amount: 150, unit: 'grams' }]);
  };

  const handleRemove = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const activeMacros = viewMode === 'per_serving'
    ? nutritionData?.per_serving
    : nutritionData?.total_recipe;

  const distribution = nutritionData?.macro_distribution || {
    protein_percentage: 30,
    carbs_percentage: 45,
    fat_percentage: 25
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surfaceBorder pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-textMain tracking-tight">Nutrition Intelligence</h2>
            <span className="px-2 py-0.5 text-[10px] font-mono font-semibold uppercase bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-md">
              Macronutrient Analytics
            </span>
          </div>
          <p className="text-xs text-textMuted mt-0.5">
            Real-time heuristic macronutrient estimation, caloric density calculations, and transparent approximations.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center p-1 bg-surfaceHighlight/60 border border-surfaceBorder rounded-xl">
          <button
            onClick={() => setViewMode('per_serving')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'per_serving'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-textMuted hover:text-textMain'
            }`}
          >
            Per Serving
          </button>
          <button
            onClick={() => setViewMode('total')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'total'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-textMuted hover:text-textMain'
            }`}
          >
            Total Recipe ({servings}x)
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
          {error}
        </div>
      )}
      {loading && (
        <div className="text-[11px] font-mono text-emerald-400 animate-pulse">
          Estimating macronutrient breakdown...
        </div>
      )}

      {/* Mandatory Scientific Estimation Disclaimer Banner */}
      <div className="p-4 bg-surfaceHighlight/40 border border-surfaceBorder rounded-2xl flex items-start gap-3 text-xs text-textMuted">
        <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-textMain">Heuristic Nutritional Estimate: </span>
          Nutritional figures are mathematical approximations calculated from culinary density averages and USDA food tables, not laboratory-verified chemical assays. Real nutritional values vary with brand, moisture loss, and preparation techniques.
        </div>
      </div>

      {/* Primary Nutritional Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Calories Card */}
        <div className="p-5 rounded-2xl bg-surface border border-surfaceBorder">
          <div className="text-[11px] font-semibold text-textMuted uppercase tracking-wider flex items-center justify-between">
            <span>Energy</span>
            <Flame className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-extrabold text-orange-400 font-mono mt-2">
            {activeMacros?.calories || 0} <span className="text-xs font-normal text-textMuted">kcal</span>
          </div>
          <div className="text-[10px] text-textMuted mt-1">
            {viewMode === 'per_serving' ? `1 of ${servings} servings` : `Full recipe (${servings} servings)`}
          </div>
        </div>

        {/* Protein Card */}
        <div className="p-5 rounded-2xl bg-surface border border-surfaceBorder">
          <div className="text-[11px] font-semibold text-textMuted uppercase tracking-wider flex items-center justify-between">
            <span>Protein</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono mt-2">
            {activeMacros?.protein_g || 0} <span className="text-xs font-normal text-textMuted">g</span>
          </div>
          <div className="text-[10px] text-textMuted mt-1">
            {distribution.protein_percentage}% of total calories
          </div>
        </div>

        {/* Carbohydrates Card */}
        <div className="p-5 rounded-2xl bg-surface border border-surfaceBorder">
          <div className="text-[11px] font-semibold text-textMuted uppercase tracking-wider flex items-center justify-between">
            <span>Carbohydrates</span>
            <span className="w-2 h-2 rounded-full bg-blue-400" />
          </div>
          <div className="text-2xl font-extrabold text-blue-400 font-mono mt-2">
            {activeMacros?.carbs_g || 0} <span className="text-xs font-normal text-textMuted">g</span>
          </div>
          <div className="text-[10px] text-textMuted mt-1">
            {distribution.carbs_percentage}% of total calories
          </div>
        </div>

        {/* Total Fat Card */}
        <div className="p-5 rounded-2xl bg-surface border border-surfaceBorder">
          <div className="text-[11px] font-semibold text-textMuted uppercase tracking-wider flex items-center justify-between">
            <span>Total Fat</span>
            <span className="w-2 h-2 rounded-full bg-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-400 font-mono mt-2">
            {activeMacros?.fat_g || 0} <span className="text-xs font-normal text-textMuted">g</span>
          </div>
          <div className="text-[10px] text-textMuted mt-1">
            {distribution.fat_percentage}% of total calories
          </div>
        </div>
      </div>

      {/* Visual Macro Distribution & Fiber/Sodium Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Macro Distribution Visualizer */}
        <div className="p-6 rounded-2xl bg-surface border border-surfaceBorder shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-textMain uppercase tracking-wider mb-4 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-400" />
              <span>Caloric Macro Split</span>
            </h3>

            {/* Stacked Progress Bar */}
            <div className="w-full h-3 rounded-full bg-surfaceHighlight overflow-hidden flex mb-4">
              <div
                style={{ width: `${distribution.protein_percentage}%` }}
                className="bg-emerald-500 h-full transition-all duration-300"
                title={`Protein: ${distribution.protein_percentage}%`}
              />
              <div
                style={{ width: `${distribution.carbs_percentage}%` }}
                className="bg-blue-500 h-full transition-all duration-300"
                title={`Carbs: ${distribution.carbs_percentage}%`}
              />
              <div
                style={{ width: `${distribution.fat_percentage}%` }}
                className="bg-amber-500 h-full transition-all duration-300"
                title={`Fat: ${distribution.fat_percentage}%`}
              />
            </div>

            {/* Legend */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-textMuted">Protein (4 kcal/g)</span>
                </div>
                <span className="font-mono font-bold text-textMain">{distribution.protein_percentage}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="text-textMuted">Carbohydrates (4 kcal/g)</span>
                </div>
                <span className="font-mono font-bold text-textMain">{distribution.carbs_percentage}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-textMuted">Fat (9 kcal/g)</span>
                </div>
                <span className="font-mono font-bold text-textMain">{distribution.fat_percentage}%</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-surfaceBorder/60 text-[11px] text-textMuted">
            Total Recipe Yield: <span className="font-mono text-emerald-400 font-bold">{servings} servings</span>
          </div>
        </div>

        {/* Secondary Micronutrients / Fiber */}
        <div className="md:col-span-2 p-6 rounded-2xl bg-surface border border-surfaceBorder shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-textMain uppercase tracking-wider">
              Secondary Nutrients & Heuristics
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-textMuted">Servings:</span>
              <input
                type="number"
                min={1}
                max={20}
                value={servings}
                onChange={(e) => setServings(Math.max(1, Number(e.target.value)))}
                className="w-16 px-2 py-1 bg-surfaceHighlight border border-surfaceBorder rounded-lg text-xs font-mono text-center text-textMain focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="p-3 bg-surfaceHighlight/30 border border-surfaceBorder rounded-xl">
              <div className="text-[10px] text-textMuted uppercase font-semibold">Dietary Fiber</div>
              <div className="text-base font-bold text-textMain font-mono mt-1">
                {activeMacros?.fiber_g || 0} g
              </div>
              <div className="text-[10px] text-emerald-400 mt-0.5">Digestive Health</div>
            </div>

            <div className="p-3 bg-surfaceHighlight/30 border border-surfaceBorder rounded-xl">
              <div className="text-[10px] text-textMuted uppercase font-semibold">Sugars</div>
              <div className="text-base font-bold text-textMain font-mono mt-1">
                {activeMacros?.sugar_g || 0} g
              </div>
              <div className="text-[10px] text-textMuted mt-0.5">Natural/Added</div>
            </div>

            <div className="p-3 bg-surfaceHighlight/30 border border-surfaceBorder rounded-xl">
              <div className="text-[10px] text-textMuted uppercase font-semibold">Sodium</div>
              <div className="text-base font-bold text-textMain font-mono mt-1">
                {activeMacros?.sodium_mg || 0} mg
              </div>
              <div className="text-[10px] text-textMuted mt-0.5">Electrolyte</div>
            </div>
          </div>

          {/* Ingredient-by-Ingredient Breakdown Table */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-textMain uppercase tracking-wider">
                Ingredient Caloric Contributions
              </span>
              <button
                onClick={handleAddIngredient}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="max-h-52 overflow-y-auto space-y-1.5">
              {(nutritionData?.ingredient_breakdown || []).map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-surfaceHighlight/30 border border-surfaceBorder rounded-xl flex items-center justify-between text-xs font-mono"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-sans font-medium text-textMain">{item.name}</span>
                    <span className="text-textMuted text-[11px]">({item.amount} {item.unit})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-orange-400 font-bold">{item.calories} kcal</span>
                    <span className="text-emerald-400/90">{item.protein_g}g P</span>
                    <button
                      onClick={() => handleRemove(idx)}
                      className="p-1 hover:text-rose-400 text-textMuted transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
