import { useState } from 'react';
import {
  Loader2,
  Sparkles,
  ChefHat,
  BookmarkPlus,
  Scale,
  Copy,
  Printer,
  Download,
  Check,
  Plus,
  X,
  ShieldCheck,
  AlertTriangle,
  MessageSquare
} from 'lucide-react';
import { apiClient } from '../api/client';
import type { RecipeResponse } from '../api/client';

interface RecipeStudioTabProps {
  threadId: string;
  userId: string;
  onExecutionComplete: (res: RecipeResponse) => void;
  onNavigateToScaling?: (recipe: any) => void;
}

export default function RecipeStudioTab({
  threadId,
  userId,
  onExecutionComplete,
  onNavigateToScaling
}: RecipeStudioTabProps) {
  const [activeMode, setActiveMode] = useState<'prompt' | 'designer'>('prompt');
  const [promptText, setPromptText] = useState(
    'I have paneer, tomatoes, onions and rice. Create a high-protein Indian dinner for two people that takes less than 30 minutes.'
  );

  // Structured Designer State
  const [ingredientTags, setIngredientTags] = useState<string[]>(['Paneer', 'Tomatoes', 'Onions', 'Basmati Rice']);
  const [newTagInput, setNewTagInput] = useState('');
  const [cuisine, setCuisine] = useState('Indian');
  const [dietary, setDietary] = useState('High-Protein');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [servings, setServings] = useState(2);
  const [cookTime, setCookTime] = useState(30);
  const [difficulty, setDifficulty] = useState('Easy');
  const [mealCategory, setMealCategory] = useState('Dinner');
  const [calorieTarget, setCalorieTarget] = useState<number | undefined>(550);
  const [customNotes, setCustomNotes] = useState('Crispy seared paneer edges with fresh cilantro garnish.');

  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recipeResult, setRecipeResult] = useState<any | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState<Record<number, boolean>>({});
  const [followUpQuestion, setFollowUpQuestion] = useState('');

  const cuisinesList = ['Indian', 'Italian', 'Mediterranean', 'Mexican', 'Asian', 'French', 'American', 'Middle Eastern', 'Any'];
  const dietaryList = ['Any', 'High-Protein', 'Vegetarian', 'Vegan', 'Keto', 'Low-Carb', 'Gluten-Free'];
  const commonAllergens = ['Peanuts', 'Tree Nuts', 'Dairy', 'Gluten', 'Eggs', 'Shellfish', 'Soy', 'Sesame'];

  const handleAddTag = () => {
    if (newTagInput.trim() && !ingredientTags.includes(newTagInput.trim())) {
      setIngredientTags([...ingredientTags, newTagInput.trim()]);
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setIngredientTags(ingredientTags.filter(t => t !== tagToRemove));
  };

  const toggleAllergy = (allergy: string) => {
    if (allergies.includes(allergy)) {
      setAllergies(allergies.filter(a => a !== allergy));
    } else {
      setAllergies([...allergies, allergy]);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setSavedSuccess(false);

    try {
      let result;
      if (activeMode === 'prompt') {
        if (!promptText.trim()) {
          setError('Please provide a recipe prompt or question.');
          setLoading(false);
          return;
        }
        result = await apiClient.generateStudioRecipe({
          prompt: promptText,
          servings: servings,
          thread_id: threadId,
          user_id: userId,
          allergies: allergies
        });
      } else {
        result = await apiClient.generateStudioRecipe({
          ingredients_available: ingredientTags,
          cuisine: cuisine,
          dietary: dietary,
          allergies: allergies,
          servings: servings,
          cook_time_minutes: cookTime,
          difficulty: difficulty,
          meal_category: mealCategory,
          calorie_target: calorieTarget,
          custom_instructions: customNotes,
          thread_id: threadId,
          user_id: userId
        });
      }

      setRecipeResult(result);
      if (result.agent_response) {
        onExecutionComplete(result.agent_response);
      }
    } catch (err: any) {
      setError(err.message || 'Recipe generation failed. Check server connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRecipe = async () => {
    if (!recipeResult) return;
    try {
      await apiClient.saveRecipe({
        user_id: userId,
        title: recipeResult.title,
        description: recipeResult.description,
        cuisine: recipeResult.cuisine,
        meal_type: recipeResult.meal_type,
        servings: recipeResult.servings,
        prep_time: recipeResult.prep_time,
        cook_time: recipeResult.cook_time,
        difficulty: recipeResult.difficulty,
        calories: recipeResult.calories,
        protein_g: recipeResult.protein_g,
        carbs_g: recipeResult.carbs_g,
        fat_g: recipeResult.fat_g,
        fiber_g: recipeResult.fiber_g,
        sugar_g: recipeResult.sugar_g,
        sodium_mg: recipeResult.sodium_mg,
        ingredients: recipeResult.ingredients,
        instructions: recipeResult.instructions,
        tags: recipeResult.tags,
        is_favorite: true
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setError('Failed to save recipe: ' + err.message);
    }
  };

  const handleCopyRecipe = () => {
    if (!recipeResult) return;
    const ingText = (recipeResult.ingredients || [])
      .map((i: any) => `- ${i.amount} ${i.unit} ${i.name} (${i.notes || ''})`)
      .join('\n');
    const stepText = (recipeResult.instructions || [])
      .map((step: string, idx: number) => `${idx + 1}. ${step}`)
      .join('\n');

    const fullMarkdown = `# ${recipeResult.title}\n\n${recipeResult.description}\n\n**Servings:** ${recipeResult.servings} | **Prep:** ${recipeResult.prep_time} | **Cook:** ${recipeResult.cook_time} | **Calories:** ${recipeResult.calories} kcal\n\n### Ingredients\n${ingText}\n\n### Instructions\n${stepText}\n\n*Generated with Recipe-Agent Multi-Agent Platform*`;

    navigator.clipboard.writeText(fullMarkdown);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2500);
  };

  const handlePrintRecipe = () => {
    window.print();
  };

  const handleExportJSON = () => {
    if (!recipeResult) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(recipeResult, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${recipeResult.title.toLowerCase().replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleFollowUp = async () => {
    if (!followUpQuestion.trim()) return;
    setLoading(true);
    try {
      const res = await apiClient.runRecipe({
        question: followUpQuestion,
        thread_id: threadId,
        user_id: userId,
        memory_enabled: true
      });
      onExecutionComplete(res);
      setFollowUpQuestion('');
    } catch (err: any) {
      setError(err.message || 'Follow-up query failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Studio Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surfaceBorder pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-textMain tracking-tight">AI Recipe Studio</h2>
            <span className="px-2 py-0.5 text-[10px] font-mono font-semibold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md">
              LangGraph Agentic
            </span>
          </div>
          <p className="text-xs text-textMuted mt-0.5">
            Orchestrate culinary critic reviews, non-linear scaling calculations, and nutrition estimations.
          </p>
        </div>

        {/* Mode Toggle Buttons */}
        <div className="flex items-center p-1 bg-surfaceHighlight/60 border border-surfaceBorder rounded-xl">
          <button
            onClick={() => setActiveMode('prompt')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeMode === 'prompt'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-textMuted hover:text-textMain'
            }`}
          >
            Natural Language
          </button>
          <button
            onClick={() => setActiveMode('designer')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeMode === 'designer'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-textMuted hover:text-textMain'
            }`}
          >
            Structured Studio
          </button>
        </div>
      </div>

      {/* Input Section */}
      <div className="p-6 rounded-2xl bg-surface border border-surfaceBorder shadow-xl space-y-6">
        {activeMode === 'prompt' ? (
          <div>
            <label className="block text-xs font-semibold text-textMain uppercase tracking-wider mb-2">
              Natural Language Instruction
            </label>
            <div className="relative">
              <textarea
                rows={3}
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="Example: I have paneer, tomatoes, onions and rice. Create a high-protein Indian dinner for two people that takes less than 30 minutes."
                className="w-full p-4 bg-surfaceHighlight/40 border border-surfaceBorder rounded-xl text-xs text-textMain placeholder:text-textMuted focus:outline-none focus:border-emerald-500/50 leading-relaxed font-sans"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Ingredients Available at Home */}
            <div>
              <label className="block text-xs font-semibold text-textMain uppercase tracking-wider mb-2">
                Ingredients Available at Home
              </label>
              <div className="flex flex-wrap gap-2 p-3 bg-surfaceHighlight/30 border border-surfaceBorder rounded-xl min-h-[46px] items-center">
                {ingredientTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-rose-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <div className="flex items-center gap-1 flex-1 min-w-[140px]">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="+ Add ingredient..."
                    className="bg-transparent text-xs text-textMain placeholder:text-textMuted focus:outline-none w-full"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="p-1 rounded bg-surfaceHighlight hover:bg-emerald-500/20 text-textMuted hover:text-emerald-400 text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Grid of Cuisine, Dietary, Servings, Cook Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Cuisine */}
              <div>
                <label className="block text-xs font-medium text-textMuted mb-1.5">Cuisine</label>
                <select
                  value={cuisine}
                  onChange={(e) => setCuisine(e.target.value)}
                  className="w-full px-3 py-2 bg-surfaceHighlight/50 border border-surfaceBorder rounded-xl text-xs text-textMain focus:outline-none focus:border-emerald-500/40"
                >
                  {cuisinesList.map(c => <option key={c} value={c} className="bg-surface">{c}</option>)}
                </select>
              </div>

              {/* Dietary */}
              <div>
                <label className="block text-xs font-medium text-textMuted mb-1.5">Dietary</label>
                <select
                  value={dietary}
                  onChange={(e) => setDietary(e.target.value)}
                  className="w-full px-3 py-2 bg-surfaceHighlight/50 border border-surfaceBorder rounded-xl text-xs text-textMain focus:outline-none focus:border-emerald-500/40"
                >
                  {dietaryList.map(d => <option key={d} value={d} className="bg-surface">{d}</option>)}
                </select>
              </div>

              {/* Servings */}
              <div>
                <label className="block text-xs font-medium text-textMuted mb-1.5">Servings: {servings}</label>
                <input
                  type="range"
                  min={1}
                  max={12}
                  value={servings}
                  onChange={(e) => setServings(Number(e.target.value))}
                  className="w-full accent-emerald-500 h-2 bg-surfaceHighlight rounded-lg cursor-pointer"
                />
              </div>

              {/* Cooking Time */}
              <div>
                <label className="block text-xs font-medium text-textMuted mb-1.5">Max Cook Time (mins)</label>
                <input
                  type="number"
                  min={10}
                  max={180}
                  step={5}
                  value={cookTime}
                  onChange={(e) => setCookTime(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-surfaceHighlight/50 border border-surfaceBorder rounded-xl text-xs text-textMain focus:outline-none focus:border-emerald-500/40 font-mono"
                />
              </div>
            </div>

            {/* Row 2: Difficulty, Meal Category, Calorie Target */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-textMuted mb-1.5">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-3 py-2 bg-surfaceHighlight/50 border border-surfaceBorder rounded-xl text-xs text-textMain focus:outline-none focus:border-emerald-500/40"
                >
                  <option value="Easy" className="bg-surface">Easy</option>
                  <option value="Intermediate" className="bg-surface">Intermediate</option>
                  <option value="Advanced" className="bg-surface">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-textMuted mb-1.5">Meal Category</label>
                <select
                  value={mealCategory}
                  onChange={(e) => setMealCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-surfaceHighlight/50 border border-surfaceBorder rounded-xl text-xs text-textMain focus:outline-none focus:border-emerald-500/40"
                >
                  <option value="Dinner" className="bg-surface">Dinner</option>
                  <option value="Lunch" className="bg-surface">Lunch</option>
                  <option value="Breakfast" className="bg-surface">Breakfast</option>
                  <option value="Snack" className="bg-surface">Snack</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-textMuted mb-1.5">Calorie Target (kcal/serving)</label>
                <input
                  type="number"
                  min={200}
                  max={2000}
                  step={50}
                  value={calorieTarget || ''}
                  onChange={(e) => setCalorieTarget(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="e.g. 550"
                  className="w-full px-3 py-2 bg-surfaceHighlight/50 border border-surfaceBorder rounded-xl text-xs text-textMain focus:outline-none focus:border-emerald-500/40 font-mono"
                />
              </div>
            </div>

            {/* Custom Chef Instructions */}
            <div>
              <label className="block text-xs font-medium text-textMuted mb-1.5">Custom Culinary Instructions</label>
              <input
                type="text"
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="e.g. Crispy seared edges, extra garlicky, medium spice level..."
                className="w-full px-3 py-2 bg-surfaceHighlight/50 border border-surfaceBorder rounded-xl text-xs text-textMain focus:outline-none focus:border-emerald-500/40"
              />
            </div>

            {/* Allergens to Exclude */}
            <div>
              <label className="block text-xs font-medium text-textMuted mb-2">
                Allergies to Strictly Avoid (Culinary Critic Enforced)
              </label>
              <div className="flex flex-wrap gap-2">
                {commonAllergens.map((alg) => {
                  const isSelected = allergies.includes(alg);
                  return (
                    <button
                      key={alg}
                      type="button"
                      onClick={() => toggleAllergy(alg)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                        isSelected
                          ? 'bg-rose-500/15 text-rose-300 border-rose-500/30 font-semibold'
                          : 'bg-surfaceHighlight/40 text-textMuted border-surfaceBorder hover:text-textMain'
                      }`}
                    >
                      {alg}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Generate Button */}
        <div className="flex items-center justify-between pt-2 border-t border-surfaceBorder/60">
          <div className="text-[11px] text-textMuted flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Multi-Agent LangGraph with Deterministic Supervisor Routing</span>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Orchestrating Agents...</span>
              </>
            ) : (
              <>
                <ChefHat className="w-4 h-4" />
                <span>Generate Recipe</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generated Recipe Presentation Card */}
      {recipeResult && (
        <div className="p-8 rounded-3xl bg-surface border border-surfaceBorder shadow-2xl space-y-6 animate-in slide-in-from-bottom-2 duration-300">
          {/* Header & Meta Badges */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-surfaceBorder/80 pb-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-semibold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {recipeResult.cuisine}
                </span>
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-semibold uppercase bg-surfaceHighlight text-textMuted border border-surfaceBorder">
                  {recipeResult.meal_type}
                </span>
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-semibold uppercase bg-surfaceHighlight text-textMuted border border-surfaceBorder">
                  {recipeResult.difficulty}
                </span>
              </div>
              <h3 className="text-2xl font-extrabold text-textMain tracking-tight">
                {recipeResult.title}
              </h3>
              <p className="text-xs text-textMuted mt-1.5 max-w-2xl leading-relaxed">
                {recipeResult.description}
              </p>
            </div>

            {/* Quick Action Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleSaveRecipe}
                title="Save Recipe to Persistent SQLite Store"
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                  savedSuccess
                    ? 'bg-emerald-500 text-slate-950 border-emerald-500'
                    : 'bg-surfaceHighlight hover:bg-surfaceHighlight/80 text-textMain border-surfaceBorder'
                }`}
              >
                {savedSuccess ? <Check className="w-3.5 h-3.5" /> : <BookmarkPlus className="w-3.5 h-3.5 text-amber-400" />}
                <span>{savedSuccess ? 'Saved!' : 'Save'}</span>
              </button>

              <button
                onClick={handleCopyRecipe}
                title="Copy Markdown Recipe"
                className="px-3 py-2 rounded-xl bg-surfaceHighlight hover:bg-surfaceHighlight/80 text-textMain border border-surfaceBorder text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                {copiedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSuccess ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={() => {
                  if (onNavigateToScaling) onNavigateToScaling(recipeResult);
                }}
                title="Scale ingredients in Workbench"
                className="px-3 py-2 rounded-xl bg-surfaceHighlight hover:bg-surfaceHighlight/80 text-textMain border border-surfaceBorder text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <Scale className="w-3.5 h-3.5 text-blue-400" />
                <span>Scale</span>
              </button>

              <button
                onClick={handlePrintRecipe}
                title="Print clean recipe layout"
                className="p-2 rounded-xl bg-surfaceHighlight hover:bg-surfaceHighlight/80 text-textMuted hover:text-textMain border border-surfaceBorder transition-all"
              >
                <Printer className="w-4 h-4" />
              </button>

              <button
                onClick={handleExportJSON}
                title="Export JSON payload"
                className="p-2 rounded-xl bg-surfaceHighlight hover:bg-surfaceHighlight/80 text-textMuted hover:text-textMain border border-surfaceBorder transition-all"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Cooking Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-surfaceHighlight/30 border border-surfaceBorder text-center font-mono">
            <div>
              <div className="text-[10px] text-textMuted uppercase font-semibold">Prep Time</div>
              <div className="text-sm font-bold text-textMain mt-0.5">{recipeResult.prep_time}</div>
            </div>
            <div>
              <div className="text-[10px] text-textMuted uppercase font-semibold">Cook Time</div>
              <div className="text-sm font-bold text-textMain mt-0.5">{recipeResult.cook_time}</div>
            </div>
            <div>
              <div className="text-[10px] text-textMuted uppercase font-semibold">Servings</div>
              <div className="text-sm font-bold text-emerald-400 mt-0.5">{recipeResult.servings} People</div>
            </div>
            <div>
              <div className="text-[10px] text-textMuted uppercase font-semibold">Calories / Serving</div>
              <div className="text-sm font-bold text-amber-400 mt-0.5">{recipeResult.calories} kcal</div>
            </div>
          </div>

          {/* Two Columns: Ingredients Checklist vs Step-by-Step Instructions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Ingredients Column */}
            <div>
              <h4 className="text-sm font-bold text-textMain uppercase tracking-wider mb-3 flex items-center gap-2">
                <span>Ingredients</span>
                <span className="text-xs text-textMuted font-mono font-normal">
                  ({recipeResult.ingredients?.length || 0} items)
                </span>
              </h4>

              <div className="space-y-2">
                {(recipeResult.ingredients || []).map((ing: any, i: number) => {
                  const isChecked = !!checkedIngredients[i];
                  return (
                    <div
                      key={i}
                      onClick={() => setCheckedIngredients({ ...checkedIngredients, [i]: !isChecked })}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-emerald-500/5 border-emerald-500/20 text-textMuted line-through'
                          : 'bg-surfaceHighlight/40 border-surfaceBorder hover:border-surfaceBorderHover text-textMain'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                            isChecked
                              ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                              : 'border-surfaceBorder text-transparent'
                          }`}
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                        <span className="text-xs font-medium">{ing.name}</span>
                      </div>
                      <div className="text-xs font-mono font-semibold text-emerald-400/90">
                        {ing.amount} {ing.unit}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Instructions Column */}
            <div>
              <h4 className="text-sm font-bold text-textMain uppercase tracking-wider mb-3">
                Culinary Instructions
              </h4>

              <ol className="space-y-3">
                {(recipeResult.instructions || []).map((step: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 p-3.5 rounded-xl bg-surfaceHighlight/30 border border-surfaceBorder text-xs text-textMain leading-relaxed">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-[10px] font-bold font-mono shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Culinary Critic & Safety Notes */}
          {recipeResult.critic_advice && recipeResult.critic_advice.length > 0 && (
            <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 text-xs">
              <div className="flex items-center gap-2 font-bold text-indigo-400 mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Culinary Critic & Safety Review</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-textMuted mt-1">
                {recipeResult.critic_advice.map((adv: string, idx: number) => (
                  <li key={idx}>{adv}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Natural Language Follow-Up in Session Thread */}
          <div className="pt-4 border-t border-surfaceBorder/80">
            <label className="block text-xs font-semibold text-textMain mb-2 flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ask follow-up or refine recipe in current thread ({threadId})</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={followUpQuestion}
                onChange={(e) => setFollowUpQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleFollowUp();
                }}
                placeholder="e.g. 'Can I substitute Greek yogurt with coconut milk?' or 'Scale this to 6 people'"
                className="flex-1 px-4 py-2.5 bg-surfaceHighlight/40 border border-surfaceBorder rounded-xl text-xs text-textMain focus:outline-none focus:border-emerald-500/40"
              />
              <button
                onClick={handleFollowUp}
                disabled={loading || !followUpQuestion.trim()}
                className="px-4 py-2.5 rounded-xl bg-surfaceHighlight hover:bg-emerald-500 hover:text-slate-950 text-textMain text-xs font-semibold border border-surfaceBorder transition-all"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
