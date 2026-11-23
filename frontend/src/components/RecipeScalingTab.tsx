import { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  AlertTriangle,
  Sparkles,
  Info
} from 'lucide-react';
import { apiClient } from '../api/client';
import type { IngredientItem, AdvancedScalingResult } from '../api/client';

interface RecipeScalingTabProps {
  initialRecipe?: any;
}

export default function RecipeScalingTab({ initialRecipe }: RecipeScalingTabProps) {
  const [servingsOrig, setServingsOrig] = useState<number>(4);
  const [servingsTarg, setServingsTarg] = useState<number>(8);
  const [unitSystem, setUnitSystem] = useState<string>('original');
  const [ingredients, setIngredients] = useState<IngredientItem[]>([
    { name: 'All-Purpose Flour', amount: 2, unit: 'cups', calories_per_unit: 455 },
    { name: 'Baking Powder', amount: 1.5, unit: 'tsp', notes: 'Leavener' },
    { name: 'Granulated Sugar', amount: 0.75, unit: 'cups', calories_per_unit: 774 },
    { name: 'Kosher Salt', amount: 0.5, unit: 'tsp', notes: 'Seasoning' },
    { name: 'Whole Milk', amount: 1, unit: 'cups', calories_per_unit: 149 }
  ]);

  const [scalingResult, setScalingResult] = useState<AdvancedScalingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If initial recipe is passed from Studio or Collection, seed state
  useEffect(() => {
    if (initialRecipe && initialRecipe.ingredients) {
      setServingsOrig(initialRecipe.servings || 4);
      setServingsTarg(initialRecipe.servings ? initialRecipe.servings * 2 : 8);
      setIngredients(
        initialRecipe.ingredients.map((i: any) => ({
          name: i.name,
          amount: Number(i.amount) || 1,
          unit: i.unit || 'units',
          calories_per_unit: i.calories_per_unit
        }))
      );
    }
  }, [initialRecipe]);

  // Recalculate scaling whenever inputs change
  useEffect(() => {
    runScaling();
  }, [servingsOrig, servingsTarg, ingredients, unitSystem]);

  const runScaling = async () => {
    if (servingsOrig <= 0 || servingsTarg <= 0 || ingredients.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.scaleRecipeAdvanced({
        servings_original: servingsOrig,
        servings_target: servingsTarg,
        ingredients: ingredients,
        target_unit_system: unitSystem
      });
      setScalingResult(res.data);
    } catch (err: any) {
      setError(err.message || 'Scaling calculation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAddIngredient = () => {
    setIngredients([
      ...ingredients,
      { name: 'New Ingredient', amount: 1, unit: 'cups' }
    ]);
  };

  const handleUpdateIngredient = (index: number, field: keyof IngredientItem, val: any) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: val };
    setIngredients(updated);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const scaleRatio = servingsOrig > 0 ? (servingsTarg / servingsOrig).toFixed(2) : '1.0';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surfaceBorder pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-textMain tracking-tight">Intelligent Recipe Scaling</h2>
            <span className="px-2 py-0.5 text-[10px] font-mono font-semibold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md">
              Culinary Physics Engine
            </span>
          </div>
          <p className="text-xs text-textMuted mt-0.5">
            Non-linear ingredient scaling, fractional measurement representations, and thermal pan volume validation.
          </p>
        </div>

        {/* Scale Multiplier & Unit System Badges */}
        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 bg-surfaceHighlight/60 border border-surfaceBorder rounded-xl text-xs">
            <button
              onClick={() => setUnitSystem('original')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                unitSystem === 'original' ? 'bg-surface text-emerald-400 font-semibold' : 'text-textMuted'
              }`}
            >
              Original Units
            </button>
            <button
              onClick={() => setUnitSystem('metric')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                unitSystem === 'metric' ? 'bg-surface text-emerald-400 font-semibold' : 'text-textMuted'
              }`}
            >
              Metric (g/ml)
            </button>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surfaceHighlight border border-surfaceBorder font-mono text-xs">
            <span className="text-textMuted">Scale Factor:</span>
            <span className="text-emerald-400 font-bold">{scaleRatio}x</span>
            <span className="text-textMuted">({servingsOrig} &rarr; {servingsTarg})</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
          {error}
        </div>
      )}
      {loading && (
        <div className="text-[11px] font-mono text-emerald-400 animate-pulse">
          Recalculating non-linear proportions...
        </div>
      )}

      {/* Servings Controls Bar */}
      <div className="p-6 rounded-2xl bg-surface border border-surfaceBorder shadow-xl space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Original Servings */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-textMuted uppercase tracking-wider">
                Original Servings
              </label>
              <span className="text-xs font-bold text-textMain font-mono">{servingsOrig} people</span>
            </div>
            <input
              type="range"
              min={1}
              max={24}
              value={servingsOrig}
              onChange={(e) => setServingsOrig(Number(e.target.value))}
              className="w-full accent-blue-500 h-2 bg-surfaceHighlight rounded-lg cursor-pointer"
            />
          </div>

          {/* Target Servings */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-textMuted uppercase tracking-wider">
                Target Servings
              </label>
              <span className="text-xs font-bold text-emerald-400 font-mono">{servingsTarg} people</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={50}
                value={servingsTarg}
                onChange={(e) => setServingsTarg(Number(e.target.value))}
                className="flex-1 accent-emerald-500 h-2 bg-surfaceHighlight rounded-lg cursor-pointer"
              />
              <input
                type="number"
                min={1}
                max={100}
                value={servingsTarg}
                onChange={(e) => setServingsTarg(Math.max(1, Number(e.target.value)))}
                className="w-20 px-3 py-1 bg-surfaceHighlight/60 border border-surfaceBorder rounded-lg text-xs font-mono text-textMain text-center focus:outline-none focus:border-emerald-500/40"
              />
            </div>
          </div>
        </div>

        {/* Extreme Scaling Guard Alert */}
        {scalingResult?.is_extreme_scale && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-start gap-3 animate-pulse">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Extreme Scaling Factor Detected ({scaleRatio}x)</div>
              <p className="mt-0.5 text-textMuted">
                This batch size requires human authorization when run through the autonomous agent loop to ensure kitchen vessel safety and spice balance.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Side-by-Side Comparison Matrix */}
      <div className="p-6 rounded-2xl bg-surface border border-surfaceBorder shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-textMain uppercase tracking-wider flex items-center gap-2">
            <span>Ingredients Side-by-Side Comparison</span>
            <span className="text-xs text-textMuted font-mono font-normal">
              ({ingredients.length} items)
            </span>
          </h3>

          <button
            onClick={handleAddIngredient}
            className="px-3 py-1.5 rounded-lg bg-surfaceHighlight hover:bg-emerald-500/10 hover:text-emerald-400 text-textMuted text-xs font-semibold border border-surfaceBorder flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Ingredient</span>
          </button>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-surfaceBorder text-textMuted font-mono uppercase text-[10px]">
                <th className="pb-3 pl-2">Ingredient Name</th>
                <th className="pb-3 text-center">Original Qty</th>
                <th className="pb-3 text-center">Scaled Qty</th>
                <th className="pb-3 text-center">Fractional (Chef's Measure)</th>
                <th className="pb-3 text-center">Unit</th>
                <th className="pb-3 text-right pr-2">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surfaceBorder/60">
              {(scalingResult?.ingredients || []).map((item, idx) => (
                <tr key={idx} className="group hover:bg-surfaceHighlight/30 transition-colors">
                  <td className="py-3 pl-2">
                    <input
                      type="text"
                      value={ingredients[idx]?.name || item.name}
                      onChange={(e) => handleUpdateIngredient(idx, 'name', e.target.value)}
                      className="bg-transparent font-medium text-textMain focus:outline-none border-b border-transparent focus:border-emerald-500/40 w-full"
                    />
                    {item.is_nonlinear_adjusted && (
                      <div className="text-[10px] text-amber-400 font-mono mt-0.5 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>Non-linear culinary adjustment applied</span>
                      </div>
                    )}
                  </td>
                  <td className="py-3 text-center font-mono text-textMuted">
                    <input
                      type="number"
                      step={0.25}
                      value={ingredients[idx]?.amount || item.original_amount}
                      onChange={(e) => handleUpdateIngredient(idx, 'amount', Number(e.target.value))}
                      className="bg-transparent font-mono text-center text-textMuted focus:outline-none border-b border-transparent focus:border-emerald-500/40 w-16"
                    />
                  </td>
                  <td className="py-3 text-center font-mono font-bold text-emerald-400">
                    {item.scaled_amount}
                  </td>
                  <td className="py-3 text-center font-mono font-bold text-amber-300">
                    {item.scaled_fraction} {item.unit}
                  </td>
                  <td className="py-3 text-center">
                    <input
                      type="text"
                      value={ingredients[idx]?.unit || item.unit}
                      onChange={(e) => handleUpdateIngredient(idx, 'unit', e.target.value)}
                      className="bg-transparent font-mono text-center text-textMuted focus:outline-none border-b border-transparent focus:border-emerald-500/40 w-16"
                    />
                  </td>
                  <td className="py-3 text-right pr-2">
                    <button
                      onClick={() => handleRemoveIngredient(idx)}
                      className="p-1 rounded text-textMuted hover:text-rose-400 hover:bg-surfaceHighlight transition-colors"
                      title="Remove ingredient"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Culinary Physics & Equipment Advice */}
      {scalingResult && (scalingResult.culinary_warnings.length > 0 || scalingResult.equipment_advice.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Culinary Non-linear Rules */}
          {scalingResult.culinary_warnings.length > 0 && (
            <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-xs">
              <div className="flex items-center gap-2 font-bold text-amber-400 mb-2">
                <Sparkles className="w-4 h-4" />
                <span>Culinary Non-Linear Rules</span>
              </div>
              <ul className="space-y-1.5 text-textMuted">
                {scalingResult.culinary_warnings.map((w, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-400 font-mono">•</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Cooking Vessel & Thermal Advice */}
          {scalingResult.equipment_advice.length > 0 && (
            <div className="p-5 rounded-2xl bg-blue-500/5 border border-blue-500/20 text-xs">
              <div className="flex items-center gap-2 font-bold text-blue-400 mb-2">
                <Info className="w-4 h-4" />
                <span>Vessel & Thermal Dynamics</span>
              </div>
              <ul className="space-y-1.5 text-textMuted">
                {scalingResult.equipment_advice.map((a, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-blue-400 font-mono">•</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
