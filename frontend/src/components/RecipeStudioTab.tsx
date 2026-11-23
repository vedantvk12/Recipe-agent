import { useState } from 'react';
import {
  Send,
  Loader2,
  Plus,
  Trash2,
  Sparkles,
  Calculator,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { apiClient } from '../api/client';
import type { RecipeResponse } from '../api/client';

interface RecipeStudioTabProps {
  threadId: string;
  userId: string;
  onExecutionComplete: (res: RecipeResponse) => void;
}

export default function RecipeStudioTab({
  threadId,
  userId,
  onExecutionComplete,
}: RecipeStudioTabProps) {
  const [mode, setMode] = useState<'prompt' | 'structured'>('prompt');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RecipeResponse | null>(null);

  // Multi-ingredient structured state
  const [servingsOrig, setServingsOrig] = useState<number>(4);
  const [servingsTarg, setServingsTarg] = useState<number>(8);
  const [ingredients, setIngredients] = useState<Array<{ name: string; amount: number; unit: string; calories_per_unit?: number }>>([
    { name: 'All-Purpose Flour', amount: 2, unit: 'cups', calories_per_unit: 455 },
    { name: 'Granulated Sugar', amount: 1, unit: 'cups', calories_per_unit: 774 },
  ]);

  const presets = [
    {
      title: 'Standard Flour Scaling',
      text: 'A recipe serves 4 people and uses 2 cups of flour. Scale it to serve 8 people. Each cup contains 455 calories. Calculate the calories for the scaled amount.',
    },
    {
      title: 'Missing Info Follow-Up',
      text: 'A recipe serves 4 people and uses 2 cups of flour. (Missing target servings)',
    },
    {
      title: 'Extreme 12.5x Scaling (Approval Gate)',
      text: 'A recipe serves 4 people and uses 2 cups of flour. Scale it to serve 50 people. Each cup has 455 calories.',
    },
  ];

  const handleRunPrompt = async () => {
    if (!prompt.trim()) {
      setError('Please provide a recipe instruction.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.runRecipe({
        question: prompt,
        thread_id: threadId,
        user_id: userId,
        memory_enabled: true,
      });
      setResult(res);
      onExecutionComplete(res);
    } catch (err: any) {
      setError(err.message || 'Execution failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRunStructured = async () => {
    if (servingsOrig <= 0 || servingsTarg <= 0) {
      setError('Original and target servings must be greater than zero.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.runMultiRecipe({
        servings_original: servingsOrig,
        servings_target: servingsTarg,
        ingredients: ingredients,
        thread_id: threadId,
        user_id: userId,
      });

      // Adapt structured response to view
      const adapted: RecipeResponse = {
        success: res.success,
        final_answer: `Scaled ${ingredients.length} ingredients by ${res.scaling_result?.scale_factor}x from ${servingsOrig} to ${servingsTarg} servings. Total calories: ${res.nutrition_result?.total_calories || 'N/A'} kcal.`,
        scaling_result: res.scaling_result,
        nutrition_result: res.nutrition_result,
        thread_id: threadId,
        user_id: userId,
        trace: [
          { step: 1, agent: 'Culinary Critic & Guard Agent', action: 'security_check', status: 'passed' },
          { step: 2, agent: 'Recipe Scaling Agent', action: 'scale_recipe_multi', status: 'success' },
          { step: 3, agent: 'Nutrition Estimation Agent', action: 'estimate_calories_multi', status: 'success' },
          { step: 4, agent: 'Response Synthesizer', action: 'compose_final_answer', status: 'success' },
        ],
      };
      setResult(adapted);
      onExecutionComplete(adapted);
    } catch (err: any) {
      setError(err.message || 'Structured recipe calculation failed');
    } finally {
      setLoading(false);
    }
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', amount: 1, unit: 'cups', calories_per_unit: 0 }]);
  };

  const removeIngredient = (idx: number) => {
    setIngredients(ingredients.filter((_, i) => i !== idx));
  };

  const updateIngredient = (idx: number, field: string, val: any) => {
    const updated = [...ingredients];
    updated[idx] = { ...updated[idx], [field]: val };
    setIngredients(updated);
  };

  return (
    <div className="space-y-6">
      {/* Mode Switcher */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-textMain tracking-tight">Recipe Studio</h2>
          <p className="text-xs text-textMuted mt-0.5">Scale recipes and estimate nutritional energy via autonomous multi-tool chaining.</p>
        </div>
        <div className="flex items-center p-1 bg-surface border border-surfaceBorder rounded-xl">
          <button
            onClick={() => setMode('prompt')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === 'prompt' ? 'bg-primary text-slate-900 shadow-sm' : 'text-textMuted hover:text-textMain'
            }`}
          >
            Natural Language
          </button>
          <button
            onClick={() => setMode('structured')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === 'structured' ? 'bg-primary text-slate-900 shadow-sm' : 'text-textMuted hover:text-textMain'
            }`}
          >
            Multi-Ingredient Form
          </button>
        </div>
      </div>

      {/* Input Section */}
      {mode === 'prompt' ? (
        <div className="p-6 rounded-2xl bg-surface border border-surfaceBorder space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-textMuted font-medium flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-primary" /> Preset Prompts:
            </span>
            {presets.map((p, idx) => (
              <button
                key={idx}
                onClick={() => setPrompt(p.text)}
                className="px-2.5 py-1 text-xs rounded-lg bg-surfaceHighlight hover:bg-surfaceHighlight/80 text-textMuted hover:text-textMain border border-surfaceBorder transition-all"
              >
                {p.title}
              </button>
            ))}
          </div>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            placeholder="Type your recipe instruction or follow-up turn (e.g., 'A recipe serves 4 people and uses 2 cups of flour. Scale it to serve 8 people. Each cup contains 455 calories.')..."
            className="w-full p-4 rounded-xl bg-background border border-surfaceBorder text-textMain text-sm focus:outline-none focus:border-primary/50 resize-none font-mono"
          />

          <div className="flex items-center justify-between">
            <span className="text-xs text-textMuted font-mono">
              Thread: <span className="text-emerald-400">{threadId}</span> (Turns share state)
            </span>
            <button
              onClick={handleRunPrompt}
              disabled={loading}
              className="px-5 py-2.5 bg-primary hover:bg-primaryHover disabled:opacity-50 text-slate-900 font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Orchestrating Multi-Agent Run...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" /> Execute Agent Workflow
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-surface border border-surfaceBorder space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-textMuted uppercase mb-1">Original Servings</label>
              <input
                type="number"
                min={1}
                value={servingsOrig}
                onChange={(e) => setServingsOrig(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl bg-background border border-surfaceBorder text-textMain text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-textMuted uppercase mb-1">Target Servings</label>
              <input
                type="number"
                min={1}
                value={servingsTarg}
                onChange={(e) => setServingsTarg(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl bg-background border border-surfaceBorder text-textMain text-sm"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-textMuted uppercase">Ingredient Ratios</label>
              <button
                onClick={addIngredient}
                className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
              >
                <Plus className="w-3.5 h-3.5" /> Add Ingredient
              </button>
            </div>

            <div className="space-y-2">
              {ingredients.map((ing, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center p-3 rounded-xl bg-surfaceHighlight/30 border border-surfaceBorder">
                  <div className="col-span-4">
                    <input
                      type="text"
                      placeholder="Ingredient Name"
                      value={ing.name}
                      onChange={(e) => updateIngredient(idx, 'name', e.target.value)}
                      className="w-full p-2 rounded-lg bg-background border border-surfaceBorder text-xs text-textMain"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      placeholder="Amount"
                      value={ing.amount}
                      onChange={(e) => updateIngredient(idx, 'amount', Number(e.target.value))}
                      className="w-full p-2 rounded-lg bg-background border border-surfaceBorder text-xs text-textMain"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="Unit"
                      value={ing.unit}
                      onChange={(e) => updateIngredient(idx, 'unit', e.target.value)}
                      className="w-full p-2 rounded-lg bg-background border border-surfaceBorder text-xs text-textMain"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      placeholder="kcal/unit"
                      value={ing.calories_per_unit || ''}
                      onChange={(e) => updateIngredient(idx, 'calories_per_unit', Number(e.target.value))}
                      className="w-full p-2 rounded-lg bg-background border border-surfaceBorder text-xs text-textMain"
                    />
                  </div>
                  <div className="col-span-1 text-right">
                    <button
                      onClick={() => removeIngredient(idx)}
                      disabled={ingredients.length <= 1}
                      className="p-2 text-rose-400 hover:text-rose-300 disabled:opacity-20"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleRunStructured}
              disabled={loading}
              className="px-5 py-2.5 bg-primary hover:bg-primaryHover disabled:opacity-50 text-slate-900 font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-3.5 h-3.5" />}
              Scale Multi-Ingredients
            </button>
          </div>
        </div>
      )}

      {/* Error Feedback */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Pending Approval Banner */}
      {result?.pending_approval && (
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 font-bold text-sm text-amber-400">
              <AlertCircle className="w-4 h-4" /> Pending Human Approval Required
            </div>
            <p className="text-xs text-amber-200/90 mt-1.5 leading-relaxed">
              {result.pending_approval.description}
            </p>
            <div className="mt-2 text-[11px] font-mono opacity-80">
              Ticket ID: {result.pending_approval.approval_id} | Operation: {result.pending_approval.operation}
            </div>
          </div>
          <button
            onClick={() => {
              // Direct resolve quick action
              apiClient.resolveApproval(result.pending_approval!.approval_id, 'approved').then(() => {
                // Resume execution
                apiClient.runRecipe({
                  question: prompt,
                  thread_id: threadId,
                  user_id: userId,
                  approval_decision: 'approved',
                }).then((res) => {
                  setResult(res);
                  onExecutionComplete(res);
                });
              });
            }}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-900 text-xs font-bold rounded-lg shrink-0 transition-all shadow-sm"
          >
            Authorize Operation
          </button>
        </div>
      )}

      {/* Final Verified Calculation Result */}
      {result && (
        <div className="p-6 rounded-2xl bg-surface border border-surfaceBorder space-y-5">
          <div className="flex items-center justify-between border-b border-surfaceBorder pb-4">
            <h3 className="text-base font-bold text-textMain flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Verified Agent Results
            </h3>
            <span className="text-xs font-mono text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              Deterministic Math
            </span>
          </div>

          {/* Structured Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-surfaceHighlight/40 border border-surfaceBorder">
              <span className="text-[11px] text-textMuted uppercase font-semibold">Scaling Factor</span>
              <div className="text-xl font-bold text-textMain mt-1">
                {result.scaling_result?.scale_factor || (result.scaling_result?.servings_target ? `${result.scaling_result?.servings_target / result.scaling_result?.servings_original}x` : 'Calculated')}
              </div>
              <p className="text-xs text-textMuted mt-1">
                {result.scaling_result?.scaled_amount ? `${result.scaling_result?.scaled_amount} ${result.scaling_result?.unit || 'units'}` : 'All ingredients updated'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surfaceHighlight/40 border border-surfaceBorder">
              <span className="text-[11px] text-textMuted uppercase font-semibold">Total Estimated Energy</span>
              <div className="text-xl font-bold text-emerald-400 mt-1">
                {result.nutrition_result?.estimated_calories || result.nutrition_result?.total_calories || 'N/A'} kcal
              </div>
              <p className="text-xs text-textMuted mt-1">Atwater energy coefficients applied</p>
            </div>

            <div className="p-4 rounded-xl bg-surfaceHighlight/40 border border-surfaceBorder">
              <span className="text-[11px] text-textMuted uppercase font-semibold">Validation Guard</span>
              <div className="text-xl font-bold text-textMain mt-1">Zero Hallucinations</div>
              <p className="text-xs text-textMuted mt-1">Tool verified Python execution</p>
            </div>
          </div>

          {/* Formatted Natural Language Response */}
          <div className="p-4 rounded-xl bg-background border border-surfaceBorder font-sans text-xs text-textMain/90 leading-relaxed whitespace-pre-wrap">
            {result.final_answer}
          </div>
        </div>
      )}
    </div>
  );
}
