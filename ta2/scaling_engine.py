"""
Intelligent Recipe Scaling Engine
=================================
Performs advanced multi-ingredient scaling, fractional unit conversions,
and culinary non-linear adjustments according to gastronomic rules.
"""
import math
from fractions import Fraction
from typing import Dict, Any, List, Optional, Tuple

# Common culinary fractional representations
def to_fractional_str(amount: float, unit: str = "units") -> str:
    """Converts a floating-point quantity into culinary fractional string (e.g., '1 1/2 cups')."""
    if amount <= 0:
        return "0"
    
    # Check if nearly integer
    rounded = round(amount, 3)
    whole = int(math.floor(rounded))
    remainder = rounded - whole

    # Common culinary fractions
    fraction_map = [
        (0.000, 0.060, ""),
        (0.125, 0.060, "1/8"),
        (0.166, 0.050, "1/6"),
        (0.250, 0.060, "1/4"),
        (0.333, 0.055, "1/3"),
        (0.375, 0.040, "3/8"),
        (0.500, 0.060, "1/2"),
        (0.625, 0.040, "5/8"),
        (0.666, 0.055, "2/3"),
        (0.750, 0.060, "3/4"),
        (0.875, 0.060, "7/8"),
        (1.000, 0.060, "1")
    ]

    best_frac = ""
    for target, tol, label in fraction_map:
        if abs(remainder - target) <= tol:
            best_frac = label
            break

    if best_frac == "1":
        whole += 1
        best_frac = ""

    if whole == 0:
        return best_frac if best_frac else f"{rounded:.2f}".rstrip("0").rstrip(".")
    if not best_frac:
        return str(whole) if remainder < 0.05 else f"{rounded:.2f}".rstrip("0").rstrip(".")
    return f"{whole} {best_frac}".strip()

# Non-linear culinary scaling rules:
# Leaveners, salt, pungent spices, extracts, and thickening agents do NOT scale linearly
# when batch factor > 2.0x or < 0.5x
NON_LINEAR_INGREDIENTS = {
    "baking powder": {"type": "leavener", "exponent": 0.75, "warning": "Leavening agents don't scale linearly. Too much causes over-rise and structural collapse."},
    "baking soda": {"type": "leavener", "exponent": 0.75, "warning": "Excess baking soda leaves a metallic, soapy aftertaste and alters pH."},
    "active dry yeast": {"type": "leavener", "exponent": 0.70, "warning": "Yeast multiplies exponentially; large batches require slower, cooler fermentation rather than proportional yeast."},
    "instant yeast": {"type": "leavener", "exponent": 0.70, "warning": "Yeast multiplies exponentially; reduce proportional scaling for large dough batches."},
    "kosher salt": {"type": "seasoning", "exponent": 0.85, "warning": "Salt perception intensifies with volume; scale to taste to avoid oversaturation."},
    "table salt": {"type": "seasoning", "exponent": 0.85, "warning": "Salt perception intensifies with volume; start with ~80% of linear scale."},
    "salt": {"type": "seasoning", "exponent": 0.85, "warning": "Salt perception intensifies with volume; recommend starting conservative."},
    "cayenne pepper": {"type": "pungent_spice", "exponent": 0.80, "warning": "Capsaicin concentrates in larger batches; scale conservatively."},
    "chili powder": {"type": "pungent_spice", "exponent": 0.85, "warning": "Spiciness can overwhelm large volume cooking."},
    "red pepper flakes": {"type": "pungent_spice", "exponent": 0.80, "warning": "Heat infuses stronger over longer cook times required by larger batches."},
    "vanilla extract": {"type": "extract", "exponent": 0.85, "warning": "Flavor extracts can overpower large batter volumes."},
    "cornstarch": {"type": "thickener", "exponent": 0.85, "warning": "Slurry thickens non-linearly depending on surface evaporation area."}
}

def detect_culinary_adjustment(name: str, original_amount: float, scale_factor: float) -> Tuple[float, Optional[str], bool]:
    """Calculates culinary-adjusted scaled quantity and provides scientific advice."""
    name_clean = name.lower().strip()
    
    # Check for non-linear ingredient match
    matched_rule = None
    for pattern, rule in NON_LINEAR_INGREDIENTS.items():
        if pattern in name_clean:
            matched_rule = rule
            break

    if not matched_rule or scale_factor == 1.0:
        linear_val = round(original_amount * scale_factor, 3)
        return linear_val, None, False

    # Apply non-linear power rule if scale factor > 2.0 or < 0.5
    if scale_factor > 2.0:
        exponent = matched_rule["exponent"]
        # Formula: original * (scale_factor ** exponent)
        adjusted_val = round(original_amount * (scale_factor ** exponent), 3)
        linear_val = round(original_amount * scale_factor, 3)
        delta_pct = round((1 - (adjusted_val / linear_val)) * 100, 1) if linear_val else 0
        note = f"Culinary Rule: {matched_rule['warning']} Scaled to {adjusted_val} ({delta_pct}% reduction vs linear {linear_val})."
        return adjusted_val, note, True
    elif scale_factor < 0.5:
        # For micro batches, slightly boost leavener to ensure rise
        adjusted_val = round(original_amount * (scale_factor ** 0.85), 3)
        note = f"Culinary Rule: Small batch adjustment for {name}. Minimal viable threshold applied."
        return adjusted_val, note, True

    linear_val = round(original_amount * scale_factor, 3)
    return linear_val, None, False

# Unit conversion helpers
UNIT_CONVERSIONS = {
    # Volume to ml
    "tsp": 4.92892,
    "teaspoon": 4.92892,
    "teaspoons": 4.92892,
    "tbsp": 14.7868,
    "tablespoon": 14.7868,
    "tablespoons": 14.7868,
    "cup": 236.588,
    "cups": 236.588,
    "fl oz": 29.5735,
    "pint": 473.176,
    "pints": 473.176,
    "quart": 946.353,
    "quarts": 946.353,
    "liter": 1000.0,
    "liters": 1000.0,
    "ml": 1.0,
    "milliliters": 1.0,
    # Weight to grams
    "g": 1.0,
    "gram": 1.0,
    "grams": 1.0,
    "kg": 1000.0,
    "kilogram": 1000.0,
    "kilograms": 1000.0,
    "oz": 28.3495,
    "ounce": 28.3495,
    "ounces": 28.3495,
    "lb": 453.592,
    "lbs": 453.592,
    "pound": 453.592,
    "pounds": 453.592,
}

def convert_unit(amount: float, from_unit: str, to_unit: str) -> Optional[float]:
    """Converts between compatible culinary measurement units."""
    f_unit = from_unit.lower().strip()
    t_unit = to_unit.lower().strip()
    if f_unit == t_unit:
        return amount
    if f_unit in UNIT_CONVERSIONS and t_unit in UNIT_CONVERSIONS:
        # Check volume compatibility vs weight compatibility
        vol_keys = ["tsp", "teaspoon", "teaspoons", "tbsp", "tablespoon", "tablespoons", "cup", "cups", "fl oz", "pint", "pints", "quart", "quarts", "liter", "liters", "ml", "milliliters"]
        wt_keys = ["g", "gram", "grams", "kg", "kilogram", "kilograms", "oz", "ounce", "ounces", "lb", "lbs", "pound", "pounds"]
        
        is_vol = (f_unit in vol_keys and t_unit in vol_keys)
        is_wt = (f_unit in wt_keys and t_unit in wt_keys)
        
        if is_vol or is_wt:
            base_val = amount * UNIT_CONVERSIONS[f_unit]
            converted = base_val / UNIT_CONVERSIONS[t_unit]
            return round(converted, 3)
    return None

def scale_recipe_advanced(
    servings_original: int,
    servings_target: int,
    ingredients: List[Dict[str, Any]],
    target_unit_system: Optional[str] = None # 'metric' or 'imperial'
) -> Dict[str, Any]:
    """
    Advanced scaling with culinary non-linear adjustments, fractional quantity formatting,
    and side-by-side comparison matrix.
    """
    if servings_original <= 0 or servings_target <= 0:
        raise ValueError("Original and target servings must be positive integers.")

    scale_factor = round(servings_target / servings_original, 4)
    scaled_items = []
    culinary_warnings = []

    for item in ingredients:
        name = item.get("name", "Ingredient")
        orig_amt = float(item.get("amount", 0.0))
        unit = item.get("unit", "units")
        cal_density = item.get("calories_per_unit")

        # Culinary non-linear adjustment
        final_amt, warning, is_nonlinear = detect_culinary_adjustment(name, orig_amt, scale_factor)
        if warning:
            culinary_warnings.append(warning)

        # Fraction format
        orig_frac = to_fractional_str(orig_amt, unit)
        scaled_frac = to_fractional_str(final_amt, unit)

        scaled_items.append({
            "name": name,
            "original_amount": orig_amt,
            "original_fraction": orig_frac,
            "scaled_amount": final_amt,
            "scaled_fraction": scaled_frac,
            "unit": unit,
            "is_nonlinear_adjusted": is_nonlinear,
            "culinary_note": warning,
            "calories_per_unit": cal_density,
            "total_ingredient_calories": round(final_amt * cal_density, 1) if cal_density else None
        })

    # Cooking vessel & thermal advice
    equipment_advice = []
    if scale_factor >= 3.0:
        equipment_advice.append("Pan Crowding: Increase pan surface area or sear meat and vegetables in separate batches to avoid boiling instead of browning.")
        equipment_advice.append("Liquid Evaporation: Liquid does not evaporate 3x faster in a standard pot. Reduce added broths/water by ~15-20% and simmer gently.")
    elif scale_factor <= 0.33:
        equipment_advice.append("Evaporation Caution: Small batches lose moisture much faster in large pans. Use a smaller saucepan to prevent scorching.")

    return {
        "servings_original": servings_original,
        "servings_target": servings_target,
        "scale_factor": scale_factor,
        "ingredients": scaled_items,
        "culinary_warnings": culinary_warnings,
        "equipment_advice": equipment_advice,
        "is_extreme_scale": scale_factor >= 10.0 or scale_factor <= 0.1
    }
