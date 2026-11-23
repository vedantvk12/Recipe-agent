import json
from typing import List, Dict, Any, Optional
from langchain_core.tools import tool
from pydantic import BaseModel, Field

# --- Schema Definitions ---

class ScaleRecipeInput(BaseModel):
    servings_original: int = Field(description="Original number of servings in recipe. Must be > 0. Example: 4.")
    servings_target: int = Field(description="Desired target number of servings. Must be > 0. Example: 8.")
    ingredient_amount: float = Field(description="Original ingredient quantity to scale. Example: 2.0.")
    ingredient_name: Optional[str] = Field(default="ingredient", description="Name of the ingredient (optional).")
    unit: Optional[str] = Field(default="units", description="Measurement unit (optional).")

class IngredientItem(BaseModel):
    name: str = Field(description="Name of the ingredient, e.g. flour, sugar.")
    amount: float = Field(description="Original amount to scale. Must be >= 0.")
    unit: Optional[str] = Field(default="units", description="Unit of measurement, e.g. cups, grams.")

class MultiScaleRecipeInput(BaseModel):
    servings_original: int = Field(description="Original number of servings. Must be > 0.")
    servings_target: int = Field(description="Target number of servings. Must be > 0.")
    ingredients: List[IngredientItem] = Field(description="List of ingredients to scale.")

class EstimateCaloriesInput(BaseModel):
    ingredient_amount: float = Field(description="Amount of ingredient for calorie calculation (usually scaled_amount). Example: 4.0.")
    calories_per_unit: float = Field(description="Number of calories in one unit. REQUIRED. Example: 455.")
    ingredient_name: Optional[str] = Field(default="ingredient", description="Name of the ingredient.")

class IngredientCalorieItem(BaseModel):
    name: str = Field(description="Ingredient name.")
    scaled_amount: float = Field(description="Scaled amount. Must be >= 0.")
    calories_per_unit: float = Field(description="Calories per unit. Must be >= 0.")
    unit: Optional[str] = Field(default="units", description="Measurement unit.")

class MultiEstimateCaloriesInput(BaseModel):
    ingredients: List[IngredientCalorieItem] = Field(description="List of scaled ingredients with calorie densities.")

# --- Tool Implementations ---

@tool("scale_recipe", args_schema=ScaleRecipeInput)
def scale_recipe(
    servings_original: int,
    servings_target: int,
    ingredient_amount: float,
    ingredient_name: str = "ingredient",
    unit: str = "units"
) -> str:
    """Use this tool ONLY for scaling an ingredient quantity."""
    if servings_original <= 0:
        return json.dumps({
            "status": "error",
            "error_type": "ValidationError",
            "message": "Original servings must be greater than zero."
        })
    
    if servings_target <= 0:
        return json.dumps({
            "status": "error",
            "error_type": "ValidationError",
            "message": "Target servings must be greater than zero."
        })
        
    if ingredient_amount < 0:
        return json.dumps({
            "status": "error",
            "error_type": "ValidationError",
            "message": "Ingredient amount cannot be negative."
        })
        
    scaled_amount = round((ingredient_amount / servings_original) * servings_target, 4)
    return json.dumps({
        "status": "success",
        "ingredient_name": ingredient_name,
        "original_amount": ingredient_amount,
        "scaled_amount": scaled_amount,
        "unit": unit,
        "scale_factor": round(servings_target / servings_original, 4)
    })

@tool("estimate_calories", args_schema=EstimateCaloriesInput)
def estimate_calories(
    ingredient_amount: float,
    calories_per_unit: float,
    ingredient_name: str = "ingredient"
) -> str:
    """Use this tool ONLY for calculating calories."""
    if ingredient_amount < 0:
        return json.dumps({
            "status": "error",
            "error_type": "ValidationError",
            "message": "Ingredient amount cannot be negative."
        })
        
    if calories_per_unit < 0:
        return json.dumps({
            "status": "error",
            "error_type": "ValidationError",
            "message": "Calories per unit cannot be negative."
        })
        
    total_calories = round(ingredient_amount * calories_per_unit, 2)
    return json.dumps({
        "status": "success",
        "ingredient_name": ingredient_name,
        "amount": ingredient_amount,
        "calories_per_unit": calories_per_unit,
        "estimated_calories": total_calories,
        "is_verified": False,
        "estimation_note": "Mathematical estimate based on supplied calorie density."
    })

@tool("scale_recipe_multi", args_schema=MultiScaleRecipeInput)
def scale_recipe_multi(
    servings_original: int,
    servings_target: int,
    ingredients: List[Dict[str, Any]]
) -> str:
    """Scale multiple ingredients simultaneously."""
    if servings_original <= 0:
        return json.dumps({
            "status": "error",
            "error_type": "ValidationError",
            "message": "Original servings must be greater than zero."
        })
    if servings_target <= 0:
        return json.dumps({
            "status": "error",
            "error_type": "ValidationError",
            "message": "Target servings must be greater than zero."
        })
    if not ingredients:
        return json.dumps({
            "status": "error",
            "error_type": "ValidationError",
            "message": "Ingredients list cannot be empty."
        })

    ratio = servings_target / servings_original
    scaled_items = []
    for item in ingredients:
        name = item.get("name", "Unknown")
        amt = float(item.get("amount", 0.0))
        unit = item.get("unit", "units")
        if amt < 0:
            return json.dumps({
                "status": "error",
                "error_type": "ValidationError",
                "message": f"Negative quantity found for ingredient '{name}'."
            })
        scaled_items.append({
            "name": name,
            "original_amount": amt,
            "scaled_amount": round(amt * ratio, 4),
            "unit": unit
        })

    return json.dumps({
        "status": "success",
        "scale_factor": round(ratio, 4),
        "servings_original": servings_original,
        "servings_target": servings_target,
        "scaled_ingredients": scaled_items
    })

@tool("estimate_calories_multi", args_schema=MultiEstimateCaloriesInput)
def estimate_calories_multi(ingredients: List[Dict[str, Any]]) -> str:
    """Calculate calories for multiple scaled ingredients."""
    if not ingredients:
        return json.dumps({
            "status": "error",
            "error_type": "ValidationError",
            "message": "Ingredients list cannot be empty."
        })

    total_calories = 0.0
    detailed_breakdown = []
    for item in ingredients:
        name = item.get("name", "Unknown")
        amt = float(item.get("scaled_amount", 0.0))
        cpu = float(item.get("calories_per_unit", 0.0))
        unit = item.get("unit", "units")
        if amt < 0 or cpu < 0:
            return json.dumps({
                "status": "error",
                "error_type": "ValidationError",
                "message": f"Negative value for ingredient '{name}'."
            })
        cals = round(amt * cpu, 2)
        total_calories += cals
        detailed_breakdown.append({
            "name": name,
            "scaled_amount": amt,
            "calories_per_unit": cpu,
            "unit": unit,
            "calories": cals
        })

    return json.dumps({
        "status": "success",
        "total_calories": round(total_calories, 2),
        "ingredients": detailed_breakdown,
        "estimation_note": "Mathematical estimate based on supplied calorie density."
    })

class InjectedFailureInput(BaseModel):
    fail_mode: str = Field(description="Simulate failure mode: 'timeout', 'divide_by_zero', 'malformed_data'")

@tool("injected_failing_tool", args_schema=InjectedFailureInput)
def injected_failing_tool(fail_mode: str = "timeout") -> str:
    """Deliberately simulates a tool failure for supervisor recovery testing."""
    if fail_mode == "timeout":
        return json.dumps({
            "status": "error",
            "error_type": "DependencyTimeoutError",
            "message": "Simulated tool timeout: External calculation dependency did not respond within 5000ms."
        })
    elif fail_mode == "divide_by_zero":
        return json.dumps({
            "status": "error",
            "error_type": "ArithmeticError",
            "message": "Simulated math error: Division by zero encountered during yield ratio evaluation."
        })
    else:
        return "CRITICAL ERROR: Malformed non-JSON corrupt return"
