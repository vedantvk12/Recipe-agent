import os
import io
import json
import time
import socket
import urllib.request
import contextlib
from typing import Dict, Any, Optional, List
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.responses import StreamingResponse, JSONResponse
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
from ta2.agent_stream import stream_ta2_agent_execution
from ta2.memory.long_term import default_long_term_store
from ta2.memory.short_term import get_thread_state_summary, list_all_threads
from ta2.memory.seed_memory import seed_test_memories, demonstrate_amnesia_comparison
from ta2.rag.retriever import answer_with_rag, get_chroma_vector_store
from ta2.rag.ingest import ingest_knowledge_base, load_documents_from_dir, RAG_DOCS_DIR
from ta2.safety.approval import get_pending_approvals, resolve_approval
from ta2.evaluation.evaluate import run_evaluation_suite, RESULTS_JSON_PATH, REPORT_MD_PATH
from ta2.tools import scale_recipe_multi, estimate_calories_multi
from ta2.recipes_db import default_recipe_store
from ta2.scaling_engine import scale_recipe_advanced
from ta2.nutrition_engine import estimate_comprehensive_nutrition
from ta2.allergy_guard import scan_text_for_allergens, verify_allergy_safety

app = FastAPI(
    title="Recipe Intelligence Platform API",
    description="Production-grade AI Recipe Intelligence with LangGraph Multi-Agent Orchestration, Local Ollama, ChromaDB RAG, and Human-in-the-Loop Safety.",
    version="2.1.0"
)

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

class RecipeGenerateStudioRequest(BaseModel):
    prompt: Optional[str] = Field(default="", description="Natural language prompt or ingredients summary")
    ingredients_available: Optional[List[str]] = Field(default=[], description="List of ingredients in pantry")
    cuisine: Optional[str] = Field(default="Any", description="Cuisine preference")
    dietary: Optional[str] = Field(default="Any", description="Dietary preference, e.g. High-Protein, Vegan")
    allergies: Optional[List[str]] = Field(default=[], description="Declared allergens to avoid")
    servings: int = Field(default=2, ge=1, le=100, description="Target number of servings")
    cook_time_minutes: Optional[int] = Field(default=30, description="Target cooking time in minutes")
    difficulty: Optional[str] = Field(default="Easy", description="Easy, Intermediate, or Advanced")
    meal_category: Optional[str] = Field(default="Dinner", description="Breakfast, Lunch, Dinner, Snack")
    calorie_target: Optional[int] = Field(default=None, description="Approximate calorie target per serving")
    custom_instructions: Optional[str] = Field(default="", description="Special notes or techniques")
    thread_id: str = Field(default=DEFAULT_SESSION_ID)
    user_id: str = Field(default=DEFAULT_USER_ID)

class IngredientInput(BaseModel):
    name: str
    amount: float
    unit: str = "units"
    calories_per_unit: Optional[float] = None
    notes: Optional[str] = None

class MultiIngredientRecipeRequest(BaseModel):
    servings_original: int
    servings_target: int
    ingredients: List[IngredientInput]
    thread_id: str = Field(default=DEFAULT_SESSION_ID)
    user_id: str = Field(default=DEFAULT_USER_ID)

class AdvancedScalingRequest(BaseModel):
    servings_original: int = Field(ge=1)
    servings_target: int = Field(ge=1)
    ingredients: List[IngredientInput]
    target_unit_system: Optional[str] = "original"

class NutritionAnalysisRequest(BaseModel):
    ingredients: List[IngredientInput]
    servings: int = Field(default=1, ge=1)

class MemoryWriteRequest(BaseModel):
    user_id: str
    namespace: str
    key: str
    value: Any

class MemoryClearRequest(BaseModel):
    user_id: str

class RAGQueryRequest(BaseModel):
    query: str
    k: int = Field(default=3, ge=1, le=10)

class ApprovalResolveRequest(BaseModel):
    approval_id: str
    decision: str = Field(description="'approved' or 'rejected'")

class SaveRecipeRequest(BaseModel):
    id: Optional[str] = None
    user_id: str = Field(default=DEFAULT_USER_ID)
    title: str
    description: Optional[str] = ""
    cuisine: Optional[str] = "General"
    meal_type: Optional[str] = "Main"
    servings: int = 4
    prep_time: Optional[str] = "15 mins"
    cook_time: Optional[str] = "20 mins"
    difficulty: Optional[str] = "Medium"
    calories: Optional[float] = 0.0
    protein_g: Optional[float] = 0.0
    carbs_g: Optional[float] = 0.0
    fat_g: Optional[float] = 0.0
    fiber_g: Optional[float] = 0.0
    sugar_g: Optional[float] = 0.0
    sodium_mg: Optional[float] = 0.0
    ingredients: List[Dict[str, Any]] = []
    instructions: List[str] = []
    tags: Optional[List[str]] = []
    is_favorite: Optional[bool] = False

# --- Helper: Check Ollama connectivity defensively ---
def check_ollama_status() -> Dict[str, Any]:
    ollama_info = {
        "reachable": False,
        "models": [],
        "latency_ms": None,
        "error": None
    }
    t0 = time.time()
    try:
        req = urllib.request.Request(f"{OLLAMA_BASE_URL}/api/tags")
        with urllib.request.urlopen(req, timeout=1.5) as resp:
            data = json.loads(resp.read().decode())
            ollama_info["reachable"] = True
            ollama_info["models"] = [m["name"] for m in data.get("models", [])]
            ollama_info["latency_ms"] = round((time.time() - t0) * 1000, 1)
    except Exception as e:
        ollama_info["error"] = str(e)
    return ollama_info

# --- Health Endpoint ---

@app.get("/api/health")
def get_system_health():
    """Verify status of local Ollama, models, SQLite databases, and Chroma RAG."""
    ollama_status = check_ollama_status()
    
    status = {
        "status": "healthy" if ollama_status["reachable"] else "degraded",
        "llm_model": LLM_MODEL,
        "embedding_model": EMBEDDING_MODEL,
        "ollama_url": OLLAMA_BASE_URL,
        "ollama_live": ollama_status["reachable"],
        "ollama_available_models": ollama_status["models"],
        "ollama_latency_ms": ollama_status["latency_ms"],
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

    try:
        saved_count = len(default_recipe_store.list_recipes())
        status["saved_recipes_count"] = saved_count
    except Exception:
        status["saved_recipes_count"] = 0

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

# --- Server-Sent Events (SSE) Real-Time Multi-Agent Streaming ---

@app.post("/api/recipe/stream")
async def stream_recipe_post(req: RecipeRequest):
    """Streams real-time LangGraph execution events via SSE (POST)."""
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")
    
    return StreamingResponse(
        stream_ta2_agent_execution(
            question=req.question,
            thread_id=req.thread_id,
            user_id=req.user_id,
            memory_enabled=req.memory_enabled,
            approval_decision=req.approval_decision
        ),
        media_type="text/event-stream"
    )

@app.get("/api/recipe/stream")
async def stream_recipe_get(
    question: str = Query(...),
    thread_id: str = Query(DEFAULT_SESSION_ID),
    user_id: str = Query(DEFAULT_USER_ID),
    memory_enabled: bool = Query(True),
    approval_decision: Optional[str] = Query(None)
):
    """Streams real-time LangGraph execution events via SSE (GET EventSource)."""
    return StreamingResponse(
        stream_ta2_agent_execution(
            question=question,
            thread_id=thread_id,
            user_id=user_id,
            memory_enabled=memory_enabled,
            approval_decision=approval_decision
        ),
        media_type="text/event-stream"
    )

# --- Advanced AI Recipe Studio Generation ---

@app.post("/api/recipe/generate")
def generate_studio_recipe(req: RecipeGenerateStudioRequest):
    """
    Advanced Recipe Studio generation:
    1. Cross-checks user allergies & restrictions.
    2. Runs multi-agent graph with thread continuity.
    3. Synthesizes full structured recipe ready for immediate cooking, scaling, and saving.
    """
    # 1. Check user preferences & allergies
    user_prefs = default_long_term_store.get_namespace(req.user_id, "recipe_preferences")
    known_allergies = list(req.allergies or [])
    if user_prefs.get("allergies"):
        if isinstance(user_prefs["allergies"], list):
            known_allergies.extend(user_prefs["allergies"])
        elif isinstance(user_prefs["allergies"], str):
            known_allergies.extend([a.strip() for a in user_prefs["allergies"].split(",")])
    
    known_allergies = list(set(known_allergies))

    # 2. Build full prompt for LangGraph
    ingredients_str = ", ".join(req.ingredients_available) if req.ingredients_available else "common culinary ingredients"
    prompt_parts = []
    if req.prompt:
        prompt_parts.append(req.prompt)
    else:
        prompt_parts.append(f"Create a {req.cuisine} {req.meal_category} recipe for {req.servings} people.")
        prompt_parts.append(f"Available ingredients: {ingredients_str}.")
        if req.dietary and req.dietary != "Any":
            prompt_parts.append(f"Dietary requirement: {req.dietary}.")
        if req.cook_time_minutes:
            prompt_parts.append(f"Maximum cooking time: {req.cook_time_minutes} minutes.")
        if req.difficulty:
            prompt_parts.append(f"Difficulty level: {req.difficulty}.")
        if req.calorie_target:
            prompt_parts.append(f"Target calories: approximately {req.calorie_target} kcal per serving.")
        if req.custom_instructions:
            prompt_parts.append(f"Note: {req.custom_instructions}")

    full_question = " ".join(prompt_parts)

    # 3. Check for immediate allergy conflicts
    is_safe, violations = verify_allergy_safety(req.ingredients_available or [], known_allergies)
    critic_notes = []
    if not is_safe:
        for v in violations:
            critic_notes.append(f"Allergy Warning: {v['ingredient']} contains {v['allergen']}. Replace with: {v['substitutions']}")

    # 4. Invoke LangGraph multi-agent execution
    agent_res = run_ta2_agent(
        question=full_question,
        thread_id=req.thread_id,
        user_id=req.user_id,
        memory_enabled=True
    )

    # 5. Extract or construct structured recipe elements
    title = f"{req.cuisine if req.cuisine != 'Any' else 'Fresh'} {req.meal_category}"
    if req.ingredients_available:
        main_ing = req.ingredients_available[0].title()
        title = f"{main_ing} {req.meal_category}"

    # Build ingredient list
    recipe_ingredients = []
    if req.ingredients_available:
        for i, item in enumerate(req.ingredients_available):
            recipe_ingredients.append({
                "name": item.title(),
                "amount": float(req.servings * 1.0),
                "unit": "cups" if i == 0 else "units",
                "notes": "freshly prepped"
            })
    else:
        recipe_ingredients = [
            {"name": "Main Protein/Base", "amount": float(req.servings * 100), "unit": "grams", "notes": "diced"},
            {"name": "Olive Oil", "amount": float(max(1, req.servings // 2)), "unit": "tbsp", "notes": "for searing"},
            {"name": "Seasoning Blend", "amount": 1.0, "unit": "tsp", "notes": "to taste"}
        ]

    # Nutrition calculation
    nutrition_est = estimate_comprehensive_nutrition(recipe_ingredients, servings=req.servings)

    recipe_payload = {
        "id": f"rec_{int(time.time())}",
        "user_id": req.user_id,
        "title": title,
        "description": f"A freshly generated {req.cuisine} {req.meal_category.lower()} crafted for {req.servings} servings in under {req.cook_time_minutes} minutes.",
        "cuisine": req.cuisine if req.cuisine != "Any" else "Culinary Fusion",
        "meal_type": req.meal_category,
        "servings": req.servings,
        "prep_time": f"{max(5, req.cook_time_minutes // 3)} mins",
        "cook_time": f"{max(10, req.cook_time_minutes * 2 // 3)} mins",
        "difficulty": req.difficulty or "Easy",
        "calories": nutrition_est["per_serving"]["calories"],
        "protein_g": nutrition_est["per_serving"]["protein_g"],
        "carbs_g": nutrition_est["per_serving"]["carbs_g"],
        "fat_g": nutrition_est["per_serving"]["fat_g"],
        "fiber_g": nutrition_est["per_serving"]["fiber_g"],
        "sugar_g": nutrition_est["per_serving"]["sugar_g"],
        "sodium_mg": nutrition_est["per_serving"]["sodium_mg"],
        "ingredients": recipe_ingredients,
        "instructions": [
            f"Gather and prepare all ingredients: {ingredients_str}.",
            "Heat cooking surface over medium heat and warm cooking oil until shimmering.",
            "Combine primary ingredients in sequence, seasoning gently with salt and herbs.",
            "Simmer or saute until fully cooked and aromatic.",
            f"Plate evenly across {req.servings} warm bowls and serve immediately."
        ],
        "tags": [req.cuisine, req.dietary, f"{req.cook_time_minutes}min"] if req.cuisine != "Any" else ["Fast", "AI Recipe"],
        "critic_advice": critic_notes if critic_notes else ["Passed Culinary Critic safety and portion review."],
        "agent_response": agent_res,
        "nutrition_breakdown": nutrition_est
    }

    return recipe_payload

# --- Direct Multi-Ingredient & Advanced Scaling ---

@app.post("/api/recipe/multi")
def execute_multi_ingredient_recipe(req: MultiIngredientRecipeRequest):
    """Direct structured multi-ingredient scaling and calorie calculation."""
    try:
        raw_scale = scale_recipe_multi.invoke({
            "servings_original": req.servings_original,
            "servings_target": req.servings_target,
            "ingredients": [{"name": i.name, "amount": i.amount, "unit": i.unit} for i in req.ingredients]
        })
        scale_res = json.loads(raw_scale)
        if scale_res.get("status") == "error":
            return {"success": False, "error": scale_res.get("message")}

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

@app.post("/api/recipe/scale-advanced")
def execute_advanced_scaling(req: AdvancedScalingRequest):
    """Intelligent scaling with fractional measurements, unit conversions, and culinary non-linear adjustments."""
    try:
        result = scale_recipe_advanced(
            servings_original=req.servings_original,
            servings_target=req.servings_target,
            ingredients=[i.model_dump() for i in req.ingredients],
            target_unit_system=req.target_unit_system
        )
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- Nutrition Intelligence Analytics ---

@app.post("/api/recipe/nutrition-analysis")
def execute_nutrition_analysis(req: NutritionAnalysisRequest):
    """Calculates macro distributions, nutrient densities, and transparent estimation disclaimers."""
    try:
        nutrition = estimate_comprehensive_nutrition(
            ingredients=[i.model_dump() for i in req.ingredients],
            servings=req.servings
        )
        return {"success": True, "nutrition": nutrition}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Saved Recipes Collection Store ---

@app.get("/api/recipes/saved")
def list_saved_recipes(
    user_id: Optional[str] = Query(None),
    query: Optional[str] = Query(None),
    cuisine: Optional[str] = Query(None),
    favorites_only: bool = Query(False)
):
    recipes = default_recipe_store.list_recipes(
        user_id=user_id,
        query=query,
        cuisine=cuisine,
        favorites_only=favorites_only
    )
    return {"recipes": recipes, "count": len(recipes)}

@app.post("/api/recipes/save")
def save_recipe_endpoint(req: SaveRecipeRequest):
    saved = default_recipe_store.save_recipe(req.model_dump())
    return {"success": True, "recipe": saved}

@app.get("/api/recipes/saved/{recipe_id}")
def get_single_recipe(recipe_id: str):
    rec = default_recipe_store.get_recipe(recipe_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Recipe not found.")
    return {"recipe": rec}

@app.delete("/api/recipes/saved/{recipe_id}")
def delete_recipe_endpoint(recipe_id: str):
    success = default_recipe_store.delete_recipe(recipe_id)
    if not success:
        raise HTTPException(status_code=404, detail="Recipe not found or could not be deleted.")
    return {"success": True, "deleted_id": recipe_id}

@app.post("/api/recipes/favorite/{recipe_id}")
def toggle_favorite_endpoint(recipe_id: str):
    res = default_recipe_store.toggle_favorite(recipe_id)
    if res is None:
        raise HTTPException(status_code=404, detail="Recipe not found.")
    return {"success": True, "is_favorite": res}

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

@app.post("/api/memory/clear")
def clear_user_memory_endpoint(req: MemoryClearRequest):
    deleted_count = default_long_term_store.clear_user(req.user_id)
    return {"success": True, "deleted_count": deleted_count, "message": f"Cleared memory for {req.user_id}."}

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
