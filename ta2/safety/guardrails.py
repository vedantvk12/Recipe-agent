import re
from typing import Tuple, Dict, Any, Optional

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

def assess_operation_safety(parsed_request: Dict[str, Any], user_text: str = "") -> Dict[str, Any]:
    """
    Evaluates whether an operation is safe to proceed automatically,
    or requires human-in-the-loop oversight/approval.
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

    # 2. Check for Extreme Scaling (> 10x or < 0.1x)
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

    # 3. Check for Long-Term Memory write intent
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
        "blocked": False
    }
