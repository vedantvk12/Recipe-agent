const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface HealthStatus {
  status: string;
  llm_model: string;
  embedding_model: string;
  ollama_url: string;
  ollama_live?: boolean;
  ollama_available_models?: string[];
  ollama_latency_ms?: number | null;
  sqlite_checkpointer: boolean;
  sqlite_long_term: boolean;
  chroma_dir: boolean;
  chroma_chunks_count: number;
  chroma_error?: string;
  saved_recipes_count?: number;
}

export interface TraceStep {
  step: number;
  tool?: string;
  agent?: string;
  action?: string;
  status?: string;
  details?: string;
  arguments?: Record<string, any>;
  result?: Record<string, any> | string;
  ticket_id?: string;
  formula?: string;
}

export interface RecipeResponse {
  success: boolean;
  final_answer: string;
  scaling_result?: Record<string, any>;
  nutrition_result?: Record<string, any>;
  pending_approval?: {
    approval_id: string;
    thread_id: string;
    operation: string;
    description: string;
    payload?: any;
    status: string;
  };
  thread_id: string;
  user_id: string;
  trace: TraceStep[];
}

export interface IngredientItem {
  name: string;
  amount: number;
  unit: string;
  calories_per_unit?: number;
  notes?: string;
}

export interface ScaledIngredientItem {
  name: string;
  original_amount: number;
  original_fraction: string;
  scaled_amount: number;
  scaled_fraction: string;
  unit: string;
  is_nonlinear_adjusted?: boolean;
  culinary_note?: string;
  calories_per_unit?: number;
  total_ingredient_calories?: number;
}

export interface AdvancedScalingResult {
  servings_original: number;
  servings_target: number;
  scale_factor: number;
  ingredients: ScaledIngredientItem[];
  culinary_warnings: string[];
  equipment_advice: string[];
  is_extreme_scale: boolean;
}

export interface NutritionMacroData {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
}

export interface NutritionAnalysisResult {
  is_estimate: boolean;
  disclaimer: string;
  servings: number;
  total_recipe: NutritionMacroData;
  per_serving: NutritionMacroData;
  macro_distribution: {
    protein_percentage: number;
    carbs_percentage: number;
    fat_percentage: number;
  };
  ingredient_breakdown: Array<{
    name: string;
    amount: number;
    unit: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
  }>;
}

export interface SavedRecipe {
  id: string;
  user_id: string;
  title: string;
  description: string;
  cuisine: string;
  meal_type: string;
  servings: number;
  prep_time: string;
  cook_time: string;
  difficulty: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
  ingredients: IngredientItem[];
  instructions: string[];
  tags: string[];
  is_favorite: boolean;
  created_at: string;
  updated_at?: string;
}

export interface StudioGenerateRequest {
  prompt?: string;
  ingredients_available?: string[];
  cuisine?: string;
  dietary?: string;
  allergies?: string[];
  servings: number;
  cook_time_minutes?: number;
  difficulty?: string;
  meal_category?: string;
  calorie_target?: number;
  custom_instructions?: string;
  thread_id?: string;
  user_id?: string;
}

export interface MultiIngredientRequest {
  servings_original: number;
  servings_target: number;
  ingredients: IngredientItem[];
  thread_id?: string;
  user_id?: string;
}

export interface RAGQueryResult {
  query: string;
  k: number;
  answer: string;
  sources: string[];
  chunks: Array<{
    source: string;
    title: string;
    chunk_id: number;
    content: string;
    relevance_score: number;
  }>;
}

export interface EvaluationResult {
  has_results: boolean;
  data?: {
    timestamp: string;
    total_test_cases: number;
    ta1_pass_rate: string;
    ta2_pass_rate: string;
    results: Array<{
      id: string;
      name: string;
      ta1: {
        status: string;
        latency_ms?: number;
        tool_calls: number;
        answer_excerpt: string;
        notes: string;
      };
      ta2: {
        status: string;
        latency_ms?: number;
        tool_calls: number;
        answer_excerpt: string;
        notes: string;
      };
    }>;
  };
}

export interface AgentStreamEvent {
  event: string;
  data: {
    agent?: string;
    agent_key?: string;
    status?: 'idle' | 'waiting' | 'running' | 'completed' | 'needs_approval' | 'failed';
    operation?: string;
    output_summary?: string;
    duration_ms?: number;
    details?: string;
    arguments?: Record<string, any>;
    result?: any;
    ticket_id?: string;
    timestamp?: number;
    ticket?: any;
    error?: string;
    recovery_suggestion?: string;
    success?: boolean;
    final_answer?: string;
    scaling_result?: any;
    nutrition_result?: any;
    total_latency_ms?: number;
    trace?: TraceStep[];
  };
}

export const apiClient = {
  getHealth: async (): Promise<HealthStatus> => {
    const res = await fetch(`${API_BASE_URL}/api/health`);
    if (!res.ok) throw new Error(`Health check failed: HTTP ${res.status}`);
    return res.json();
  },

  runRecipe: async (params: {
    question: string;
    thread_id?: string;
    user_id?: string;
    memory_enabled?: boolean;
    approval_decision?: string;
  }): Promise<RecipeResponse> => {
    const res = await fetch(`${API_BASE_URL}/api/recipe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Network error' }));
      throw new Error(err.detail || `Request failed: HTTP ${res.status}`);
    }
    return res.json();
  },

  // Real-Time SSE Multi-Agent Stream
  streamRecipeExecution: (
    params: {
      question: string;
      thread_id?: string;
      user_id?: string;
      memory_enabled?: boolean;
      approval_decision?: string;
    },
    onEvent: (event: AgentStreamEvent) => void,
    onError: (err: Error) => void,
    onComplete: () => void
  ): (() => void) => {
    const url = new URL(`${API_BASE_URL}/api/recipe/stream`);
    url.searchParams.set('question', params.question);
    if (params.thread_id) url.searchParams.set('thread_id', params.thread_id);
    if (params.user_id) url.searchParams.set('user_id', params.user_id);
    url.searchParams.set('memory_enabled', String(params.memory_enabled !== false));
    if (params.approval_decision) url.searchParams.set('approval_decision', params.approval_decision);

    const eventSource = new EventSource(url.toString());

    eventSource.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data) as AgentStreamEvent;
        onEvent(parsed);
        if (parsed.event === 'workflow_complete' || parsed.event === 'workflow_error') {
          eventSource.close();
          onComplete();
        }
      } catch (err) {
        console.error('Failed to parse SSE event payload:', err);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      onError(new Error('SSE Stream disconnected or server unreachable'));
      onComplete();
    };

    return () => eventSource.close();
  },

  generateStudioRecipe: async (data: StudioGenerateRequest): Promise<any> => {
    const res = await fetch(`${API_BASE_URL}/api/recipe/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Recipe studio failed' }));
      throw new Error(err.detail || `Generation failed: HTTP ${res.status}`);
    }
    return res.json();
  },

  runMultiRecipe: async (data: MultiIngredientRequest): Promise<any> => {
    const res = await fetch(`${API_BASE_URL}/api/recipe/multi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Network error' }));
      throw new Error(err.detail || `Multi recipe failed: HTTP ${res.status}`);
    }
    return res.json();
  },

  scaleRecipeAdvanced: async (data: {
    servings_original: number;
    servings_target: number;
    ingredients: IngredientItem[];
    target_unit_system?: string;
  }): Promise<{ success: boolean; data: AdvancedScalingResult }> => {
    const res = await fetch(`${API_BASE_URL}/api/recipe/scale-advanced`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Advanced scaling failed' }));
      throw new Error(err.detail || `Scaling failed: HTTP ${res.status}`);
    }
    return res.json();
  },

  analyzeNutrition: async (data: {
    ingredients: IngredientItem[];
    servings: number;
  }): Promise<{ success: boolean; nutrition: NutritionAnalysisResult }> => {
    const res = await fetch(`${API_BASE_URL}/api/recipe/nutrition-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Nutrition analysis failed' }));
      throw new Error(err.detail || `Analysis failed: HTTP ${res.status}`);
    }
    return res.json();
  },

  getSavedRecipes: async (params?: {
    user_id?: string;
    query?: string;
    cuisine?: string;
    favorites_only?: boolean;
  }): Promise<{ recipes: SavedRecipe[]; count: number }> => {
    const url = new URL(`${API_BASE_URL}/api/recipes/saved`);
    if (params?.user_id) url.searchParams.set('user_id', params.user_id);
    if (params?.query) url.searchParams.set('query', params.query);
    if (params?.cuisine) url.searchParams.set('cuisine', params.cuisine);
    if (params?.favorites_only) url.searchParams.set('favorites_only', 'true');

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Fetch recipes failed: HTTP ${res.status}`);
    return res.json();
  },

  saveRecipe: async (recipe: Partial<SavedRecipe>): Promise<{ success: boolean; recipe: SavedRecipe }> => {
    const res = await fetch(`${API_BASE_URL}/api/recipes/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recipe),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Save failed' }));
      throw new Error(err.detail || `Save failed: HTTP ${res.status}`);
    }
    return res.json();
  },

  deleteRecipe: async (recipeId: string): Promise<any> => {
    const res = await fetch(`${API_BASE_URL}/api/recipes/saved/${encodeURIComponent(recipeId)}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`Delete recipe failed: HTTP ${res.status}`);
    return res.json();
  },

  toggleFavoriteRecipe: async (recipeId: string): Promise<{ success: boolean; is_favorite: boolean }> => {
    const res = await fetch(`${API_BASE_URL}/api/recipes/favorite/${encodeURIComponent(recipeId)}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error(`Toggle favorite failed: HTTP ${res.status}`);
    return res.json();
  },

  queryRAG: async (query: string, k: number = 3): Promise<RAGQueryResult> => {
    const res = await fetch(`${API_BASE_URL}/api/rag/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, k }),
    });
    if (!res.ok) throw new Error(`RAG query failed: HTTP ${res.status}`);
    return res.json();
  },

  getRAGDocuments: async (): Promise<{ documents_count: number; total_chunks: number; sources: string[] }> => {
    const res = await fetch(`${API_BASE_URL}/api/rag/documents`);
    if (!res.ok) throw new Error(`Fetch docs failed: HTTP ${res.status}`);
    return res.json();
  },

  reingestRAG: async (): Promise<any> => {
    const res = await fetch(`${API_BASE_URL}/api/rag/ingest`, { method: 'POST' });
    if (!res.ok) throw new Error(`Reingestion failed: HTTP ${res.status}`);
    return res.json();
  },

  getUserMemory: async (userId: string = 'chef_elena'): Promise<any> => {
    const res = await fetch(`${API_BASE_URL}/api/memory/user?user_id=${encodeURIComponent(userId)}`);
    if (!res.ok) throw new Error(`Fetch memory failed: HTTP ${res.status}`);
    return res.json();
  },

  setUserMemory: async (data: { user_id: string; namespace: string; key: string; value: any }): Promise<any> => {
    const res = await fetch(`${API_BASE_URL}/api/memory/user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Save memory failed: HTTP ${res.status}`);
    return res.json();
  },

  deleteUserMemory: async (userId: string, namespace: string, key: string): Promise<any> => {
    const res = await fetch(`${API_BASE_URL}/api/memory/user?user_id=${encodeURIComponent(userId)}&namespace=${encodeURIComponent(namespace)}&key=${encodeURIComponent(key)}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`Delete memory failed: HTTP ${res.status}`);
    return res.json();
  },

  clearUserMemory: async (userId: string): Promise<{ success: boolean; deleted_count: number }> => {
    const res = await fetch(`${API_BASE_URL}/api/memory/clear`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    });
    if (!res.ok) throw new Error(`Clear memory failed: HTTP ${res.status}`);
    return res.json();
  },

  seedMemory: async (): Promise<any> => {
    const res = await fetch(`${API_BASE_URL}/api/memory/seed`, { method: 'POST' });
    if (!res.ok) throw new Error(`Seed memory failed: HTTP ${res.status}`);
    return res.json();
  },

  getPendingApprovals: async (): Promise<any> => {
    const res = await fetch(`${API_BASE_URL}/api/approvals/pending`);
    if (!res.ok) throw new Error(`Fetch approvals failed: HTTP ${res.status}`);
    return res.json();
  },

  resolveApproval: async (approvalId: string, decision: 'approved' | 'rejected'): Promise<any> => {
    const res = await fetch(`${API_BASE_URL}/api/approvals/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approval_id: approvalId, decision }),
    });
    if (!res.ok) throw new Error(`Resolve approval failed: HTTP ${res.status}`);
    return res.json();
  },

  getEvaluationResults: async (): Promise<EvaluationResult> => {
    const res = await fetch(`${API_BASE_URL}/api/evaluation/latest`);
    if (!res.ok) throw new Error(`Fetch eval results failed: HTTP ${res.status}`);
    return res.json();
  },

  runEvaluationSuite: async (): Promise<any> => {
    const res = await fetch(`${API_BASE_URL}/api/evaluation/run`, { method: 'POST' });
    if (!res.ok) throw new Error(`Run eval suite failed: HTTP ${res.status}`);
    return res.json();
  },

  getSessionHistory: async (threadId: string): Promise<any> => {
    const res = await fetch(`${API_BASE_URL}/api/session/history?thread_id=${encodeURIComponent(threadId)}`);
    if (!res.ok) throw new Error(`Fetch session history failed: HTTP ${res.status}`);
    return res.json();
  },

  getThreads: async (): Promise<{ threads: string[] }> => {
    const res = await fetch(`${API_BASE_URL}/api/session/threads`);
    if (!res.ok) throw new Error(`Fetch threads failed: HTTP ${res.status}`);
    return res.json();
  }
};
