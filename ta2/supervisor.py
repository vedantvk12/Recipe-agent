"""
Supervisor Node & Routing Controller
====================================
Coordinates the multi-agent workflow:
1. Culinary Critic & Guard Agent (security & human approval gate)
2. Recipe Scaling Agent (serving-size calculation & quantity validation)
3. Nutrition Estimation Agent (caloric density multiplication & disclaimer)
4. Response Synthesizer (formula formulation & final natural language presentation)

Enforces:
- MAX_HOPS limit (=6)
- Deterministic routing to avoid small LLM routing errors
- Complete execution trace annotation
"""
from typing import Dict, Any, Literal
from ta2.state import AgentState
from ta2.config import MAX_HOPS

def supervisor_router(state: AgentState) -> Literal["critic", "recipe_agent", "nutrition_agent", "synthesizer", "__end__"]:
    """Deterministic routing state machine enforcing multi-turn safety, scaling, and nutrition."""
    hop_count = state.get("hop_count", 0)
    
    # 1. Enforce MAX_HOPS limit
    if hop_count >= MAX_HOPS:
        return "__end__"
        
    # 2. Gate against safety blocks or pending human approval
    if state.get("is_safe") is False:
        return "__end__"
    if state.get("approval_status") == "pending":
        return "__end__"

    active = state.get("active_agent")
    scaling_res = state.get("scaling_result")
    nutrition_res = state.get("nutrition_result")

    # Entry into a turn
    if not active or active == "start":
        return "critic"

    if active in ("critic", "critic_agent"):
        # Check if scaling has already completed successfully and we just need nutrition
        if scaling_res and scaling_res.get("status") == "success":
            return "nutrition_agent"
        return "recipe_agent"

    if active in ("recipe_agent", "recipe_scaling"):
        if not scaling_res or scaling_res.get("status") == "error":
            return "__end__"
        return "nutrition_agent"

    if active in ("nutrition_agent", "nutrition_estimation"):
        if not nutrition_res or nutrition_res.get("status") == "error":
            return "__end__"
        return "synthesizer"

    if active in ("synthesizer", "response_synthesizer"):
        return "__end__"

    return "__end__"

def response_synthesizer_node(state: AgentState) -> Dict[str, Any]:
    """Composes the final verified culinary and nutritional report with formulas."""
    scaling = state.get("scaling_result", {})
    nutrition = state.get("nutrition_result", {})
    parsed = state.get("parsed_request", {})
    trace = state.get("execution_trace", [])
    
    orig_serv = parsed.get("servings_original")
    targ_serv = parsed.get("servings_target")
    scaled_amt = scaling.get("scaled_amount")
    orig_amt = scaling.get("original_amount")
    unit = scaling.get("unit", "units")
    ing_name = scaling.get("ingredient_name", "ingredient")
    
    total_cal = nutrition.get("estimated_calories")
    cal_per_unit = nutrition.get("calories_per_unit")
    
    # Format formula
    formula_str = f"Scaled: ({orig_amt} / {orig_serv}) × {targ_serv} = {scaled_amt} {unit}. Calories: {scaled_amt} × {cal_per_unit} kcal = {total_cal} kcal."
    
    final_text = (
        f"✅ The recipe has been scaled from {orig_serv} to {targ_serv} servings.\n"
        f"- Ingredient: {scaled_amt} {unit} of {ing_name} (originally {orig_amt} {unit}).\n"
        f"- Calorie Density: {cal_per_unit} kcal per {unit}.\n"
        f"- Total Estimated Calories: {total_cal} kcal.\n"
        f"Formula: {formula_str}\n"
        f"Note: This is a mathematical culinary estimate based on provided calorie density."
    )
    
    trace.append({
        "step": len(trace) + 1,
        "agent": "Response Synthesizer",
        "action": "compose_final_answer",
        "status": "success",
        "formula": formula_str
    })
    
    return {
        "active_agent": "synthesizer",
        "final_response": final_text,
        "execution_trace": trace
    }
