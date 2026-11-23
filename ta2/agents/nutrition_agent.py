"""
Nutrition Estimation Agent
==========================
1. Name: Nutrition Estimation Agent
2. Goal: Compute estimated total calories based strictly on verified scaled amounts and valid calorie densities.
3. Tools: [estimate_calories, estimate_calories_multi]
4. Inputs: Scaled ingredient amount from recipe_agent, calories_per_unit from request or RAG.
   Outputs: Structured nutrition_result with total estimated calories and disclaimers.
5. Guardrails:
   - Never executes if scaling_result is invalid or missing.
   - Rejects negative calorie densities.
   - Explicitly flags calculated totals as mathematical approximations, not clinical dietary facts.
   - Never hallucinates calorie density if omitted by both the user and the local RAG corpus.
"""
import json
from typing import Dict, Any
from ta2.state import AgentState
from ta2.tools import estimate_calories

def nutrition_estimation_node(state: AgentState) -> Dict[str, Any]:
    """Node executing nutrition estimation with strict verification."""
    scaling_res = state.get("scaling_result")
    
    # Guard 1: Verify scaling succeeded
    if not scaling_res or scaling_res.get("status") != "success":
        err_msg = "Nutrition agent cannot execute because recipe scaling was not completed or failed."
        return {
            "active_agent": "nutrition_agent",
            "nutrition_result": {"status": "error", "error_type": "DependencyError", "message": err_msg},
            "final_response": err_msg,
            "execution_trace": state.get("execution_trace", []) + [{
                "step": len(state.get("execution_trace", [])) + 1,
                "agent": "Nutrition Estimation Agent",
                "action": "check_prerequisite",
                "status": "failed",
                "details": "Prerequisite scaling result missing or invalid"
            }]
        }
        
    scaled_amount = scaling_res.get("scaled_amount")
    parsed = state.get("parsed_request") or {}
    calories_per_unit = parsed.get("calories_per_unit")
    
    # If calories_per_unit is missing in request, check if RAG context provided it
    if calories_per_unit is None and state.get("rag_context"):
        # Look for calorie numbers in rag_context
        for chunk in state["rag_context"]:
            text = chunk.get("content", "")
            # e.g., "Contains approximately 455 kcal per cup"
            import re
            m = re.search(r"(\d+)\s*kcal", text, re.IGNORECASE)
            if m:
                calories_per_unit = float(m.group(1))
                break

    # Guard 2: Missing calorie density
    if calories_per_unit is None:
        msg = "Calorie density (calories per unit) was not provided and could not be retrieved from local documentation. Please provide calories per unit."
        return {
            "active_agent": "nutrition_agent",
            "nutrition_result": {"status": "error", "error_type": "MissingInformation", "message": msg},
            "final_response": msg,
            "execution_trace": state.get("execution_trace", []) + [{
                "step": len(state.get("execution_trace", [])) + 1,
                "agent": "Nutrition Estimation Agent",
                "action": "validate_calories",
                "status": "missing_density",
                "details": "Missing calories_per_unit"
            }]
        }

    # Execute estimate_calories tool
    tool_raw = estimate_calories.invoke({
        "ingredient_amount": scaled_amount,
        "calories_per_unit": calories_per_unit,
        "ingredient_name": scaling_res.get("ingredient_name", "ingredient")
    })
    
    result = json.loads(tool_raw)
    trace_entry = {
        "step": len(state.get("execution_trace", [])) + 1,
        "agent": "Nutrition Estimation Agent",
        "action": "estimate_calories",
        "status": result.get("status"),
        "arguments": {
            "ingredient_amount": scaled_amount,
            "calories_per_unit": calories_per_unit
        },
        "result": result
    }
    
    return {
        "active_agent": "nutrition_agent",
        "nutrition_result": result,
        "execution_trace": state.get("execution_trace", []) + [trace_entry]
    }
