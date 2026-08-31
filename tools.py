import json
from langchain_core.tools import tool
from pydantic import BaseModel, Field

class ScaleRecipeInput(BaseModel):
    servings_original: int = Field(description="Original number of servings in the recipe. Must be greater than zero. Example: 4.")
    servings_target: int = Field(description="Desired target number of servings. Must be greater than zero. Example: 8.")
    ingredient_amount: float = Field(description="Original ingredient quantity to scale. Example: 2.0.")

@tool("scale_recipe", args_schema=ScaleRecipeInput)
def scale_recipe(servings_original: int, servings_target: int, ingredient_amount: float) -> str:
    """Use this tool ONLY for scaling an ingredient quantity.

    Required arguments:

    1. servings_original:
       The number of servings in the original recipe.

    2. servings_target:
       The desired number of servings.

    3. ingredient_amount:
       The original amount of the ingredient.

    DO NOT pass calories_per_unit to this tool.

    DO NOT call this tool for calorie calculations.

    Example:

    scale_recipe(
        servings_original=4,
        servings_target=8,
        ingredient_amount=2
    )
    """
    if servings_original <= 0:
        return json.dumps({
            "status": "error",
            "message": "Original servings must be greater than zero."
        })
    
    if servings_target <= 0:
        return json.dumps({
            "status": "error",
            "message": "Target servings must be greater than zero."
        })
        
    if ingredient_amount < 0:
        return json.dumps({
            "status": "error",
            "message": "Ingredient amount cannot be negative."
        })
        
    scaled_amount = (ingredient_amount / servings_original) * servings_target
    return json.dumps({
        "status": "success",
        "scaled_amount": scaled_amount
    })


class EstimateCaloriesInput(BaseModel):
    ingredient_amount: float = Field(description="Amount of ingredient for calorie calculation. Use the scaled_amount returned by scale_recipe when scaling was performed. Example: 4.0.")
    calories_per_unit: float = Field(description="Number of calories in one unit of the ingredient. REQUIRED. Example: 455.")

@tool("estimate_calories", args_schema=EstimateCaloriesInput)
def estimate_calories(ingredient_amount: float, calories_per_unit: float) -> str:
    """Use this tool ONLY for calculating calories.

    Required arguments:

    1. ingredient_amount:
       The amount of the ingredient to calculate calories for.

    2. calories_per_unit:
       The calories contained in one unit of the ingredient.

    Both arguments are REQUIRED.

    DO NOT call this tool without calories_per_unit.

    Example:

    estimate_calories(
        ingredient_amount=4.0,
        calories_per_unit=455
    )
    """
    if ingredient_amount < 0:
        return json.dumps({
            "status": "error",
            "message": "Ingredient amount cannot be negative."
        })
        
    if calories_per_unit < 0:
        return json.dumps({
            "status": "error",
            "message": "Calories per unit cannot be negative."
        })
        
    total_calories = ingredient_amount * calories_per_unit
    return json.dumps({
        "status": "success",
        "estimated_calories": total_calories
    })
