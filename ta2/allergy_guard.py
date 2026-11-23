"""
Allergy & Dietary Guardrails
============================
Detects allergens in user requests or recipes, cross-references user allergy
blacklists, and recommends safe culinary alternatives.
"""
from typing import Dict, Any, List, Tuple, Optional

ALLERGEN_CATEGORIES = {
    "peanuts": {
        "keywords": ["peanut", "peanuts", "peanut butter", "groundnut", "peanut oil"],
        "severity": "CRITICAL",
        "substitutions": "Sunflower seed butter, pumpkin seed butter, tahini, or soy-nut butter."
    },
    "tree_nuts": {
        "keywords": ["almond", "walnut", "cashew", "pecan", "pistachio", "hazelnut", "macadamia", "pine nut", "praline", "marzipan"],
        "severity": "CRITICAL",
        "substitutions": "Toasted sunflower seeds, roasted pumpkin seeds, or rolled oats for crunch."
    },
    "dairy": {
        "keywords": ["milk", "cheese", "butter", "cream", "paneer", "yogurt", "ghee", "casein", "whey", "parmesan", "mozzarella"],
        "severity": "HIGH",
        "substitutions": "Oat milk, coconut cream, olive oil for butter, tofu for paneer, nutritional yeast for cheese flavor."
    },
    "gluten": {
        "keywords": ["flour", "wheat", "barley", "rye", "breadcrumbs", "pasta", "semolina", "couscous", "spelt", "soy sauce"],
        "severity": "HIGH",
        "substitutions": "Gluten-free 1-to-1 baking blend, almond flour, tamari (gluten-free soy sauce), quinoa, or rice noodles."
    },
    "eggs": {
        "keywords": ["egg", "eggs", "egg white", "egg yolk", "mayonnaise", "meringue"],
        "severity": "HIGH",
        "substitutions": "Flax egg (1 tbsp ground flax + 2.5 tbsp water), chia egg, applesauce, or aquafaba for whipping."
    },
    "soy": {
        "keywords": ["soy", "soya", "tofu", "soy sauce", "edamame", "miso", "tempeh"],
        "severity": "HIGH",
        "substitutions": "Coconut aminos for soy sauce, chickpea tofu for soy tofu."
    },
    "shellfish": {
        "keywords": ["shrimp", "prawn", "crab", "lobster", "crawfish", "clam", "mussel", "oyster", "scallop"],
        "severity": "CRITICAL",
        "substitutions": "King oyster mushrooms for scallops, hearts of palm for crab cakes."
    },
    "fish": {
        "keywords": ["salmon", "tuna", "cod", "halibut", "anchovy", "fish sauce", "worcestershire"],
        "severity": "HIGH",
        "substitutions": "Marinated tofu, heart of palm, or seaweed sheets for oceanic flavor."
    },
    "sesame": {
        "keywords": ["sesame", "sesame oil", "tahini", "halva"],
        "severity": "HIGH",
        "substitutions": "Sunflower oil, toasted perilla oil, pumpkin seed butter."
    }
}

def scan_text_for_allergens(text: str) -> List[Dict[str, Any]]:
    """Identifies all declared allergens or allergen ingredients in text."""
    lower_text = text.lower()
    detected = []
    
    for allergen, meta in ALLERGEN_CATEGORIES.items():
        matched_kw = []
        for kw in meta["keywords"]:
            # Match whole words where possible
            if f" {kw} " in f" {lower_text} " or f" {kw}s " in f" {lower_text} ":
                matched_kw.append(kw)
        if matched_kw:
            detected.append({
                "allergen": allergen,
                "severity": meta["severity"],
                "matched_terms": matched_kw,
                "substitutions": meta["substitutions"]
            })
            
    return detected

def verify_allergy_safety(
    ingredients: List[str],
    user_declared_allergies: List[str]
) -> Tuple[bool, List[Dict[str, Any]]]:
    """
    Checks ingredients against declared user allergies.
    Returns (is_safe, list_of_violations).
    """
    if not user_declared_allergies:
        return True, []

    violations = []
    norm_allergies = [a.lower().strip() for a in user_declared_allergies]

    for ing in ingredients:
        ing_lower = ing.lower()
        for allergen, meta in ALLERGEN_CATEGORIES.items():
            # Check if this allergen category is in user's allergy list
            user_has_allergy = any(a in allergen or allergen in a for a in norm_allergies)
            if not user_has_allergy:
                # Also check direct keywords in user allergies
                user_has_allergy = any(kw in norm_allergies for kw in meta["keywords"])

            if user_has_allergy:
                # Check if ingredient contains allergen keyword
                for kw in meta["keywords"]:
                    if kw in ing_lower:
                        violations.append({
                            "ingredient": ing,
                            "allergen": allergen,
                            "severity": meta["severity"],
                            "matched_keyword": kw,
                            "substitutions": meta["substitutions"]
                        })
                        break

    is_safe = (len(violations) == 0)
    return is_safe, violations
