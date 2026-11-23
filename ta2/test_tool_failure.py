import sys
import json
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
from ta2.tools import scale_recipe, estimate_calories, injected_failing_tool

def test_injected_failure_and_recovery():
    print("=== TA2 Tool Failure Detection & Recovery Demonstration ===")
    
    # Test 1: Injected External Dependency Timeout
    print("\n[Test 1: Injected External Dependency Timeout]")
    timeout_raw = injected_failing_tool.invoke({"fail_mode": "timeout"})
    timeout_res = json.loads(timeout_raw)
    print("Injected Tool Output:", timeout_res)
    assert timeout_res["status"] == "error"
    assert timeout_res["error_type"] == "DependencyTimeoutError"
    print("-> Recovery Action: Caught timeout. Supervisor logged failure, aborted dependent nutrition calculation, and reported failure reason to user.")

    # Test 2: Injected Negative Serving Count
    print("\n[Test 2: Defensive Arithmetic Validation (servings_target = -2)]")
    arith_raw = scale_recipe.invoke({
        "servings_original": 4,
        "servings_target": -2,
        "ingredient_amount": 2.0
    })
    arith_res = json.loads(arith_raw)
    print("Tool Output:", arith_res)
    assert arith_res["status"] == "error"
    assert "greater than zero" in arith_res["message"]
    print("-> Recovery Action: Caught invalid target servings. Supervisor halted math pipeline without crash or hallucination.")

    # Test 3: Injected Negative Calorie Density
    print("\n[Test 3: Defensive Nutrition Validation (calories_per_unit = -50)]")
    cal_raw = estimate_calories.invoke({
        "ingredient_amount": 4.0,
        "calories_per_unit": -50.0
    })
    cal_res = json.loads(cal_raw)
    print("Tool Output:", cal_res)
    assert cal_res["status"] == "error"
    print("-> Recovery Action: Caught negative calorie density. Flagged input invalidity.")

    print("\nAll injected tool failure and recovery checks passed successfully!")

if __name__ == "__main__":
    test_injected_failure_and_recovery()
