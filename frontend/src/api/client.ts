const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface HealthStatus {
  status: string;
  llm_model: string;
  embedding_model: string;
  ollama_url: string;
  sqlite_checkpointer: boolean;
  sqlite_long_term: boolean;
  chroma_dir: boolean;
  chroma_chunks_count: number;
  chroma_error?: string;
}

export interface TraceStep {
  step: number;
  tool?: string;
  agent?: string;
  action?: string;
  status?: string;
  details?: string;
  arguments?: Record<string, any>;
  result?: Record<string, any>;
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

export interface MultiIngredientRequest {
  servings_original: number;
  servings_target: number;
  ingredients: Array<{
    name: string;
    amount: number;
    unit: string;
    calories_per_unit?: number;
  }>;
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
