"""
Recipe Scaling Agent
====================
1. Name: Recipe Scaling Agent
2. Goal: Scale recipe ingredient quantities accurately based on original and target serving ratios.
3. Tools: [scale_recipe, scale_recipe_multi]
4. Inputs: Original servings, target servings, ingredient amounts and units.
   Outputs: Structured scaling_result dictionary with scaled quantities and scale factor.
5. Guardrails:
   - Validates that original servings > 0 and target servings > 0.
   - Rejects negative quantities.
   - Halts and requests user input if target servings or ingredient amounts are missing.
"""
import json
import re
from typing import Dict, Any
from langchain_core.messages import AIMessage
from ta2.state import AgentState
from ta2.tools import scale_recipe, scale_recipe_multi

def parse_recipe_from_text(text: str) -> Dict[str, Any]:
    """Deterministic extraction of servings and ingredient amounts from natural language."""
    servings_orig = None
    servings_targ = None
    amount = None
    ingredient = "ingredient"
    calories = None
    
    # 1. Target Servings: 'scale to 8', 'scale it to serve 8', 'for 8 people'
    targ_match = re.search(r"scale\s+(?:it\s+)?to\s+(?:serve\s+)?(\d+)", text, re.IGNORECASE)
    if targ_match:
        servings_targ = int(targ_match.group(1))
    else:
        targ_match2 = re.search(r"for\s+(\d+)\s+(?:people|servings)", text, re.IGNORECASE)
        if targ_match2:
            servings_targ = int(targ_match2.group(1))

    # 2. Original Servings: 'recipe serves 4', 'originally for 4', 'makes 4 servings'
    orig_match = re.search(r"(?:recipe\s+)?(?:serves|yields|makes)\s+(\d+)", text, re.IGNORECASE)
    if orig_match:
        matched_val = int(orig_match.group(1))
        # If it was actually part of 'scale to serve X', don't assign to original
        if not (targ_match and matched_val == servings_targ):
            servings_orig = matched_val
    if not servings_orig:
        orig_match2 = re.search(r"(\d+)\s+servings?\s+original", text, re.IGNORECASE)
        if orig_match2:
            servings_orig = int(orig_match2.group(1))

    # Ingredient amount & name
    ing_match = re.search(r"uses?\s+([\d\.]+)\s*([a-zA-Z]+)?\s+of\s+([a-zA-Z\s]+)", text, re.IGNORECASE)
    if ing_match:
        amount = float(ing_match.group(1))
        unit = ing_match.group(2) or "units"
        ingredient = ing_match.group(3).strip().split(".")[0].strip()
    else:
        ing_match2 = re.search(r"([\d\.]+)\s*(cups?|grams?|tablespoons?|tbsp|tsp|oz|lbs?)\s+of\s+([a-zA-Z\s]+)", text, re.IGNORECASE)
        if ing_match2:
            amount = float(ing_match2.group(1))
            unit = ing_match2.group(2)
            ingredient = ing_match2.group(3).strip().split(".")[0].strip()
        else:
            unit = "units"

    # Calorie density if present
    cal_match = re.search(r"(\d+)\s+calories", text, re.IGNORECASE)
    if cal_match:
        calories = float(cal_match.group(1))

    return {
        "servings_original": servings_orig,
        "servings_target": servings_targ,
        "ingredient_amount": amount,
        "ingredient_name": ingredient,
        "unit": unit,
        "calories_per_unit": calories
    }

def recipe_scaling_node(state: AgentState) -> Dict[str, Any]:
    """Node executing recipe scaling with deterministic validation and multi-turn state merging."""
    parsed = dict(state.get("parsed_request") or {})
    
    # Merge fields from all messages in the conversation thread
    if state.get("messages"):
        for msg in state["messages"]:
            extracted = parse_recipe_from_text(msg.content)
            for k, v in extracted.items():
                if v is not None:
                    parsed[k] = v
    
    # Check if long-term memory provides default servings if target is missing
    user_prefs = state.get("user_preferences") or {}
    if not parsed.get("servings_target") and user_prefs.get("default_servings") and state.get("memory_enabled", True):
        parsed["servings_target"] = user_prefs["default_servings"]

    servings_orig = parsed.get("servings_original")
    servings_targ = parsed.get("servings_target")
    amount = parsed.get("ingredient_amount")
    
    # Validation
    if servings_orig is None or servings_targ is None or amount is None:
        missing = []
        if servings_orig is None: missing.append("original servings")
        if servings_targ is None: missing.append("target servings")
        if amount is None: missing.append("ingredient amount")
        
        msg = f"I cannot scale the recipe because the following information is missing: {', '.join(missing)}. Please provide these details."
        return {
            "active_agent": "recipe_agent",
            "parsed_request": parsed,
            "scaling_result": {"status": "error", "error_type": "MissingInformation", "message": msg},
            "final_response": msg,
            "execution_trace": state.get("execution_trace", []) + [{
                "step": len(state.get("execution_trace", [])) + 1,
                "agent": "Recipe Scaling Agent",
                "action": "validate_inputs",
                "status": "missing_info",
                "details": f"Missing: {missing}"
            }]
        }

    # Execute tool
    tool_raw = scale_recipe.invoke({
        "servings_original": servings_orig,
        "servings_target": servings_targ,
        "ingredient_amount": amount,
        "ingredient_name": parsed.get("ingredient_name", "ingredient"),
        "unit": parsed.get("unit", "units")
    })
    
    result = json.loads(tool_raw)
    trace_entry = {
        "step": len(state.get("execution_trace", [])) + 1,
        "agent": "Recipe Scaling Agent",
        "action": "scale_recipe",
        "status": result.get("status"),
        "arguments": {
            "servings_original": servings_orig,
            "servings_target": servings_targ,
            "ingredient_amount": amount
        },
        "result": result
    }
    
    return {
        "active_agent": "recipe_agent",
        "parsed_request": parsed,
        "scaling_result": result,
        "execution_trace": state.get("execution_trace", []) + [trace_entry]
    }
