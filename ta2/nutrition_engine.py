"""
Nutrition Intelligence Engine
=============================
Computes comprehensive macronutrient estimates, caloric distributions,
dietary ratios, and transparent culinary approximation disclaimers.
"""
from typing import Dict, Any, List, Optional

# Typical standard caloric & macro densities per common unit
COMMON_NUTRITION_DB = {
    "all-purpose flour": {"cal_per_cup": 455.0, "protein": 12.9, "carbs": 95.4, "fat": 1.2, "fiber": 3.4, "unit": "cups"},
    "flour": {"cal_per_cup": 455.0, "protein": 12.9, "carbs": 95.4, "fat": 1.2, "fiber": 3.4, "unit": "cups"},
    "granulated sugar": {"cal_per_cup": 774.0, "protein": 0.0, "carbs": 200.0, "fat": 0.0, "fiber": 0.0, "unit": "cups"},
    "sugar": {"cal_per_cup": 774.0, "protein": 0.0, "carbs": 200.0, "fat": 0.0, "fiber": 0.0, "unit": "cups"},
    "brown sugar": {"cal_per_cup": 820.0, "protein": 0.3, "carbs": 214.0, "fat": 0.0, "fiber": 0.0, "unit": "cups"},
    "olive oil": {"cal_per_tbsp": 119.0, "protein": 0.0, "carbs": 0.0, "fat": 13.5, "fiber": 0.0, "unit": "tbsp"},
    "butter": {"cal_per_tbsp": 102.0, "protein": 0.1, "carbs": 0.0, "fat": 11.5, "fiber": 0.0, "unit": "tbsp"},
    "paneer": {"cal_per_100g": 296.0, "protein": 18.0, "carbs": 4.5, "fat": 23.0, "fiber": 0.0, "unit": "grams"},
    "chicken breast": {"cal_per_100g": 165.0, "protein": 31.0, "carbs": 0.0, "fat": 3.6, "fiber": 0.0, "unit": "grams"},
    "basmati rice": {"cal_per_cup": 680.0, "protein": 13.0, "carbs": 150.0, "fat": 1.0, "fiber": 2.0, "unit": "cups"},
    "quinoa": {"cal_per_cup": 630.0, "protein": 24.0, "carbs": 109.0, "fat": 10.0, "fiber": 12.0, "unit": "cups"},
    "chickpeas": {"cal_per_cup": 269.0, "protein": 14.5, "carbs": 45.0, "fat": 4.2, "fiber": 12.5, "unit": "cups"},
    "salmon": {"cal_per_fillet": 350.0, "protein": 38.0, "carbs": 0.0, "fat": 20.0, "fiber": 0.0, "unit": "fillets"},
    "egg": {"cal_per_unit": 72.0, "protein": 6.3, "carbs": 0.4, "fat": 4.8, "fiber": 0.0, "unit": "units"},
    "milk (whole)": {"cal_per_cup": 149.0, "protein": 7.7, "carbs": 11.7, "fat": 8.0, "fiber": 0.0, "unit": "cups"},
    "greek yogurt": {"cal_per_cup": 130.0, "protein": 22.0, "carbs": 8.0, "fat": 0.5, "fiber": 0.0, "unit": "cups"}
}

def estimate_comprehensive_nutrition(
    ingredients: List[Dict[str, Any]],
    servings: int = 1
) -> Dict[str, Any]:
    """
    Computes estimated macronutrients and caloric breakdown for a recipe,
    providing per-serving and total batch values with transparent scientific disclaimers.
    """
    servings = max(1, servings)
    total_calories = 0.0
    total_protein = 0.0
    total_carbs = 0.0
    total_fat = 0.0
    total_fiber = 0.0
    total_sugar = 0.0
    total_sodium = 0.0

    ingredient_breakdown = []

    for item in ingredients:
        name = item.get("name", "").strip().lower()
        amount = float(item.get("scaled_amount") or item.get("amount") or 0.0)
        unit = item.get("unit", "units").lower()
        cal_density = item.get("calories_per_unit")

        # Check explicit calories_per_unit first
        item_calories = 0.0
        item_protein = 0.0
        item_carbs = 0.0
        item_fat = 0.0
        item_fiber = 0.0

        if cal_density is not None and cal_density > 0:
            item_calories = round(amount * cal_density, 1)
            # Default estimated macro distribution based on item type
            if "flour" in name or "sugar" in name or "rice" in name:
                item_carbs = round((item_calories * 0.85) / 4.0, 1)
                item_protein = round((item_calories * 0.10) / 4.0, 1)
                item_fat = round((item_calories * 0.05) / 9.0, 1)
            elif "oil" in name or "butter" in name:
                item_fat = round(item_calories / 9.0, 1)
            else:
                item_carbs = round((item_calories * 0.50) / 4.0, 1)
                item_protein = round((item_calories * 0.25) / 4.0, 1)
                item_fat = round((item_calories * 0.25) / 9.0, 1)
        else:
            # Fallback to nutritional heuristics lookup
            matched = None
            for key, val in COMMON_NUTRITION_DB.items():
                if key in name:
                    matched = val
                    break
            
            if matched:
                if "cal_per_cup" in matched:
                    factor = amount
                    item_calories = round(matched["cal_per_cup"] * factor, 1)
                    item_protein = round(matched["protein"] * factor, 1)
                    item_carbs = round(matched["carbs"] * factor, 1)
                    item_fat = round(matched["fat"] * factor, 1)
                    item_fiber = round(matched["fiber"] * factor, 1)
                elif "cal_per_100g" in matched:
                    factor = amount / 100.0 if "g" in unit else amount
                    item_calories = round(matched["cal_per_100g"] * factor, 1)
                    item_protein = round(matched["protein"] * factor, 1)
                    item_carbs = round(matched["carbs"] * factor, 1)
                    item_fat = round(matched["fat"] * factor, 1)
                elif "cal_per_tbsp" in matched:
                    factor = amount
                    item_calories = round(matched["cal_per_tbsp"] * factor, 1)
                    item_fat = round(matched["fat"] * factor, 1)
                else:
                    item_calories = 50.0 * amount
            else:
                # Conservative fallback heuristic for unidentified vegetable/seasoning
                item_calories = round(35.0 * amount, 1)
                item_carbs = round(6.0 * amount, 1)
                item_fiber = round(2.0 * amount, 1)

        total_calories += item_calories
        total_protein += item_protein
        total_carbs += item_carbs
        total_fat += item_fat
        total_fiber += item_fiber

        ingredient_breakdown.append({
            "name": item.get("name", "Ingredient"),
            "amount": amount,
            "unit": unit,
            "calories": round(item_calories, 1),
            "protein_g": round(item_protein, 1),
            "carbs_g": round(item_carbs, 1),
            "fat_g": round(item_fat, 1),
            "fiber_g": round(item_fiber, 1)
        })

    # Caloric distribution percentages (4 kcal/g protein, 4 kcal/g carb, 9 kcal/g fat)
    protein_cals = total_protein * 4.0
    carbs_cals = total_carbs * 4.0
    fat_cals = total_fat * 9.0
    macro_total = max(1.0, protein_cals + carbs_cals + fat_cals)

    pct_protein = round((protein_cals / macro_total) * 100, 1)
    pct_carbs = round((carbs_cals / macro_total) * 100, 1)
    pct_fat = round((fat_cals / macro_total) * 100, 1)

    return {
        "is_estimate": True,
        "disclaimer": "Nutritional figures are mathematical approximations derived from culinary density averages and USDA food tables, not laboratory chemical assay.",
        "servings": servings,
        "total_recipe": {
            "calories": round(total_calories, 1),
            "protein_g": round(total_protein, 1),
            "carbs_g": round(total_carbs, 1),
            "fat_g": round(total_fat, 1),
            "fiber_g": round(total_fiber, 1),
            "sugar_g": round(total_sugar, 1),
            "sodium_mg": round(total_sodium, 1)
        },
        "per_serving": {
            "calories": round(total_calories / servings, 1),
            "protein_g": round(total_protein / servings, 1),
            "carbs_g": round(total_carbs / servings, 1),
            "fat_g": round(total_fat / servings, 1),
            "fiber_g": round(total_fiber / servings, 1),
            "sugar_g": round(total_sugar / servings, 1),
            "sodium_mg": round(total_sodium / servings, 1)
        },
        "macro_distribution": {
            "protein_percentage": pct_protein,
            "carbs_percentage": pct_carbs,
            "fat_percentage": pct_fat
        },
        "ingredient_breakdown": ingredient_breakdown
    }
