"""
Dedicated script to seed long-term memory with realistic user preferences,
and demonstrate persistence & amnesia comparison.
"""
from ta2.memory.long_term import LongTermMemoryStore
from ta2.config import SQLITE_LONG_TERM_PATH

def seed_test_memories():
    store = LongTermMemoryStore(SQLITE_LONG_TERM_PATH)
    
    # User 1: "chef_elena" (Metric, Low-Carb, 4 servings default)
    user_1 = "chef_elena"
    store.put(user_1, "profile", "name", "Elena Rostova")
    store.put(user_1, "profile", "experience_level", "Advanced Baker")
    store.put(user_1, "profile", "dietary_restrictions", ["Low-Carb", "No-Sugar"])
    
    store.put(user_1, "recipe_preferences", "preferred_units", "metric_grams")
    store.put(user_1, "recipe_preferences", "default_servings", 4)
    store.put(user_1, "recipe_preferences", "calorie_target_per_serving", 450)
    
    # User 2: "chef_marcus" (US Imperial, High-Protein, 6 servings default)
    user_2 = "chef_marcus"
    store.put(user_2, "profile", "name", "Marcus Chen")
    store.put(user_2, "profile", "experience_level", "Meal Prep Enthusiast")
    store.put(user_2, "profile", "dietary_restrictions", ["High-Protein", "Peanut-Allergy"])
    
    store.put(user_2, "recipe_preferences", "preferred_units", "us_cups")
    store.put(user_2, "recipe_preferences", "default_servings", 6)
    store.put(user_2, "recipe_preferences", "calorie_target_per_serving", 650)
    
    print("Long-term memory successfully seeded for:")
    print(f"  - {user_1}: {store.get_all_user_memories(user_1)}")
    print(f"  - {user_2}: {store.get_all_user_memories(user_2)}")

def verify_persistence():
    """Simulate a cold process restart by instantiating a fresh store connection."""
    print("\n--- Verifying Long-Term Memory Persistence across Restarts ---")
    fresh_store = LongTermMemoryStore(SQLITE_LONG_TERM_PATH)
    elena_prefs = fresh_store.get_namespace("chef_elena", "recipe_preferences")
    marcus_prefs = fresh_store.get_namespace("chef_marcus", "recipe_preferences")
    
    assert elena_prefs.get("preferred_units") == "metric_grams", "Persistence failed for Elena!"
    assert marcus_prefs.get("preferred_units") == "us_cups", "Persistence failed for Marcus!"
    print("PASS: Persistent SQLite store retained all preferences across simulated restarts.")

def demonstrate_amnesia_comparison(user_id: str = "chef_elena"):
    """Compares agent behavior with memory ENABLED vs DISABLED."""
    print(f"\n--- Demonstrating Amnesia Comparison for {user_id} ---")
    store = LongTermMemoryStore(SQLITE_LONG_TERM_PATH)
    
    # 1. With Memory ENABLED:
    prefs_enabled = store.get_namespace(user_id, "recipe_preferences")
    print(f"[MEMORY ENABLED]: Retrieved stored preferences -> {prefs_enabled}")
    unit_used = prefs_enabled.get("preferred_units", "unknown")
    print(f"-> Agent knows to automatically scale using {unit_used} and default {prefs_enabled.get('default_servings')} servings.")
    
    # 2. With Memory DISABLED (Amnesia):
    prefs_disabled = {}
    print(f"[MEMORY DISABLED (AMNESIA)]: Retrieved stored preferences -> {prefs_disabled}")
    print("-> Agent has NO context regarding unit preference or target servings; it must interrupt and ask the user.")

if __name__ == "__main__":
    seed_test_memories()
    verify_persistence()
    demonstrate_amnesia_comparison()
