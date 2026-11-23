import re
from typing import Tuple, Dict, Any, Optional, List
from ta2.allergy_guard import scan_text_for_allergens, verify_allergy_safety

INJECTION_PATTERNS = [
    r"ignore (?:all )?(?:previous|system|prior) instructions",
    r"bypass (?:safety|food safety|rules)",
    r"you are now in developer mode",
    r"system prompt override",
    r"disregard all guardrails",
    r"you must obey me only"
]

def detect_prompt_injection(text: str) -> Tuple[bool, Optional[str]]:
    """Detects adversarial injection attacks aimed at overriding agent behavior."""
    if not text:
        return False, None
    for pattern in INJECTION_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            return True, f"Prompt injection attempt detected matching security pattern: '{pattern}'."
    return False, None

def assess_operation_safety(
    parsed_request: Dict[str, Any],
    user_text: str = "",
    user_allergies: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Evaluates whether an operation is safe to proceed automatically,
    requires human-in-the-loop oversight/approval, or poses allergy risks.
    """
    # 1. Prompt Injection check
    is_injection, reason = detect_prompt_injection(user_text)
    if is_injection:
        return {
            "is_safe": False,
            "requires_approval": False,
            "blocked": True,
            "reason": reason
        }

    # 2. Allergy & Dietary Safeguards
    detected_allergens = scan_text_for_allergens(user_text)
    allergy_violations = []
    
    # Check against user declared allergies if present
    if user_allergies:
        ingredients_to_check = []
        if parsed_request.get("ingredient_name"):
            ingredients_to_check.append(parsed_request["ingredient_name"])
        if user_text:
            ingredients_to_check.append(user_text)

        _, violations = verify_allergy_safety(ingredients_to_check, user_allergies)
        if violations:
            allergy_violations = violations

    if allergy_violations:
        v = allergy_violations[0]
        desc = (
            f"⚠️ Severe Allergy Alert: '{v['ingredient']}' contains declared allergen '{v['allergen']}' "
            f"({v['severity']}). Safe alternative: {v['substitutions']}"
        )
        return {
            "is_safe": True,
            "requires_approval": True,
            "operation": "allergen_override_request",
            "allergy_violation": v,
            "description": desc
        }

    # 3. Check for Extreme Scaling (> 10x or < 0.1x)
    servings_orig = parsed_request.get("servings_original")
    servings_targ = parsed_request.get("servings_target")
    if servings_orig and servings_targ and servings_orig > 0:
        ratio = servings_targ / servings_orig
        if ratio >= 10.0:
            return {
                "is_safe": True,
                "requires_approval": True,
                "operation": "extreme_scaling_high",
                "ratio": ratio,
                "description": f"Warning: Scaling factor is {ratio:.1f}x (from {servings_orig} to {servings_targ} servings). Large batch preparation requires verification of cooking vessels and spice ratios."
            }
        elif ratio <= 0.1:
            return {
                "is_safe": True,
                "requires_approval": True,
                "operation": "extreme_scaling_low",
                "ratio": ratio,
                "description": f"Warning: Scaling down to {ratio:.2f}x (from {servings_orig} to {servings_targ} servings). Micro-quantities may be difficult to measure accurately without laboratory scales."
            }

    # 4. Check for Long-Term Memory write intent
    if "save as my preference" in user_text.lower() or "remember my preference" in user_text.lower():
        return {
            "is_safe": True,
            "requires_approval": True,
            "operation": "save_persistent_preference",
            "description": "User requested writing personal preferences to persistent long-term storage."
        }

    return {
        "is_safe": True,
        "requires_approval": False,
        "blocked": False,
        "detected_allergens": detected_allergens
    }
