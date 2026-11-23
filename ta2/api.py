import os
import io
import json
import contextlib
from typing import Dict, Any, Optional, List
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from ta2.config import (
    DEFAULT_SESSION_ID,
    DEFAULT_USER_ID,
    LLM_MODEL,
    EMBEDDING_MODEL,
    OLLAMA_BASE_URL,
    CHROMA_PERSIST_DIR,
    SQLITE_LONG_TERM_PATH,
    SQLITE_CHECKPOINT_PATH
)
from ta2.agent import run_ta2_agent
from ta2.memory.long_term import default_long_term_store
from ta2.memory.short_term import get_thread_state_summary, list_all_threads
from ta2.memory.seed_memory import seed_test_memories, demonstrate_amnesia_comparison
from ta2.rag.retriever import answer_with_rag, get_chroma_vector_store
from ta2.rag.ingest import ingest_knowledge_base, load_documents_from_dir, RAG_DOCS_DIR
from ta2.safety.approval import get_pending_approvals, resolve_approval
from ta2.evaluation.evaluate import run_evaluation_suite, RESULTS_JSON_PATH, REPORT_MD_PATH
from ta2.tools import scale_recipe_multi, estimate_calories_multi

app = FastAPI(title="TA2 Recipe Scaler & Nutrition Estimator API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Request / Response Schemas ---

class RecipeRequest(BaseModel):
    question: str = Field(description="Natural language recipe request")
    thread_id: str = Field(default=DEFAULT_SESSION_ID, description="Session thread ID for multi-turn continuity")
    user_id: str = Field(default=DEFAULT_USER_ID, description="User ID for long-term memory scoping")
    memory_enabled: bool = Field(default=True, description="Whether to apply long-term memory preferences")
    approval_decision: Optional[str] = Field(default=None, description="Optional 'approved' or 'rejected' decision")

class IngredientInput(BaseModel):
    name: str
    amount: float
    unit: str = "units"
    calories_per_unit: Optional[float] = None

class MultiIngredientRecipeRequest(BaseModel):
    servings_original: int
    servings_target: int
    ingredients: List[IngredientInput]
    thread_id: str = Field(default=DEFAULT_SESSION_ID)
    user_id: str = Field(default=DEFAULT_USER_ID)

class MemoryWriteRequest(BaseModel):
    user_id: str
    namespace: str
    key: str
    value: Any

class RAGQueryRequest(BaseModel):
    query: str
    k: int = Field(default=3, ge=1, le=10)

class ApprovalResolveRequest(BaseModel):
    approval_id: str
    decision: str = Field(description="'approved' or 'rejected'")

# --- Health Endpoint ---

@app.get("/api/health")
def get_system_health():
    """Verify status of local Ollama, embedding model, SQLite, and Chroma."""
    status = {
        "status": "healthy",
        "llm_model": LLM_MODEL,
        "embedding_model": EMBEDDING_MODEL,
        "ollama_url": OLLAMA_BASE_URL,
        "sqlite_checkpointer": os.path.exists(SQLITE_CHECKPOINT_PATH),
        "sqlite_long_term": os.path.exists(SQLITE_LONG_TERM_PATH),
        "chroma_dir": os.path.exists(CHROMA_PERSIST_DIR)
    }
    try:
        store = get_chroma_vector_store()
        count = store._collection.count()
        status["chroma_chunks_count"] = count
    except Exception as e:
        status["chroma_chunks_count"] = 0
        status["chroma_error"] = str(e)
    return status

# --- Primary Recipe Execution ---

@app.post("/api/recipe")
def execute_recipe_request(req: RecipeRequest):
    """Executes multi-agent graph with thread continuity, memory scoping, and approval gating."""
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Recipe request question cannot be empty.")
    try:
        result = run_ta2_agent(
            question=req.question,
            thread_id=req.thread_id,
            user_id=req.user_id,
            memory_enabled=req.memory_enabled,
            approval_decision=req.approval_decision
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/recipe/multi")
def execute_multi_ingredient_recipe(req: MultiIngredientRecipeRequest):
    """Direct structured multi-ingredient scaling and calorie calculation."""
    try:
        # 1. Scale ingredients
        raw_scale = scale_recipe_multi.invoke({
            "servings_original": req.servings_original,
            "servings_target": req.servings_target,
            "ingredients": [{"name": i.name, "amount": i.amount, "unit": i.unit} for i in req.ingredients]
        })
        scale_res = json.loads(raw_scale)
        if scale_res.get("status") == "error":
            return {"success": False, "error": scale_res.get("message")}

        # 2. Nutrition calculation
        cal_items = []
        for orig, scaled in zip(req.ingredients, scale_res.get("scaled_ingredients", [])):
            if orig.calories_per_unit is not None:
                cal_items.append({
                    "name": scaled["name"],
                    "scaled_amount": scaled["scaled_amount"],
                    "calories_per_unit": orig.calories_per_unit,
                    "unit": scaled["unit"]
                })

        nutrition_res = None
        if cal_items:
            raw_cals = estimate_calories_multi.invoke({"ingredients": cal_items})
            nutrition_res = json.loads(raw_cals)

        formula = f"Scale Factor: {scale_res.get('scale_factor')}x ({req.servings_original} -> {req.servings_target} servings)"
        
        return {
            "success": True,
            "scaling_result": scale_res,
            "nutrition_result": nutrition_res,
            "formula": formula
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Session & Short-Term Memory ---

@app.get("/api/session/threads")
def get_threads():
    threads = list_all_threads()
    return {"threads": threads}

@app.get("/api/session/history")
def get_session_history(thread_id: str = Query(DEFAULT_SESSION_ID)):
    summary = get_thread_state_summary(thread_id)
    return summary

# --- Long-Term Memory & User Profiles ---

@app.get("/api/memory/user")
def get_user_memory(user_id: str = Query(DEFAULT_USER_ID)):
    memories = default_long_term_store.get_all_user_memories(user_id)
    return {"user_id": user_id, "namespaces": memories}

@app.post("/api/memory/user")
def set_user_memory(req: MemoryWriteRequest):
    default_long_term_store.put(req.user_id, req.namespace, req.key, req.value)
    return {"success": True, "message": f"Saved {req.key} under {req.namespace} for {req.user_id}."}

@app.delete("/api/memory/user")
def delete_user_memory(user_id: str, namespace: str, key: str):
    success = default_long_term_store.delete(user_id, namespace, key)
    return {"success": success}

@app.post("/api/memory/seed")
def seed_memory_endpoint():
    seed_test_memories()
    return {"success": True, "message": "Memory successfully seeded with Elena and Marcus profiles."}

# --- Local Chroma RAG Endpoints ---

@app.get("/api/rag/documents")
def get_rag_documents():
    docs = load_documents_from_dir(RAG_DOCS_DIR)
    store = get_chroma_vector_store()
    chunk_count = store._collection.count()
    return {
        "documents_count": len(docs),
        "total_chunks": chunk_count,
        "sources": [d.metadata["source"] for d in docs]
    }

@app.post("/api/rag/query")
def query_rag_endpoint(req: RAGQueryRequest):
    """Retrieve grounded answers and source citations with k=1 or k=3 comparison."""
    res = answer_with_rag(req.query, k=req.k)
    return res

@app.post("/api/rag/ingest")
def reingest_rag_documents():
    stats = ingest_knowledge_base()
    return stats

# --- Human Oversight & Approval ---

@app.get("/api/approvals/pending")
def list_pending_approvals(thread_id: Optional[str] = None):
    pending = get_pending_approvals(thread_id)
    return {"pending_approvals": pending}

@app.post("/api/approvals/resolve")
def resolve_approval_endpoint(req: ApprovalResolveRequest):
    res = resolve_approval(req.approval_id, req.decision)
    return res

# --- Evaluation Lab ---

@app.get("/api/evaluation/latest")
def get_latest_evaluation():
    if not os.path.exists(RESULTS_JSON_PATH):
        return {"has_results": False, "message": "No evaluation has been run yet."}
    with open(RESULTS_JSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    return {"has_results": True, "data": data}

@app.post("/api/evaluation/run")
def trigger_evaluation_run():
    summary = run_evaluation_suite()
    return {"success": True, "summary": summary}

# --- Backward Compatible TA1 Endpoint ---

@app.get("/api/validate")
def run_validation_tests():
    from ta1.main import test_validation
    f = io.StringIO()
    with contextlib.redirect_stdout(f):
        test_validation()
    return {"success": True, "output": f.getvalue()}
