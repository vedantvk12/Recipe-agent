"""
Saved Recipes Database & Persistent Store
=========================================
Stores and manages saved user recipes in SQLite with full search, tags,
nutritional macros, and favorite toggling.
"""
import sqlite3
import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional
from ta2.config import DATA_DIR

RECIPES_DB_PATH = str(DATA_DIR / "recipes.sqlite")

CURATED_DEFAULT_RECIPES = [
    {
        "id": "rec_paneer_tikka_001",
        "user_id": "chef_elena",
        "title": "High-Protein Indian Paneer Tikka Bowl",
        "description": "Marinated grilled paneer cubes served over spiced basmati rice with cucumber raita, grilled bell peppers, and fresh cilantro.",
        "cuisine": "Indian",
        "meal_type": "Dinner",
        "servings": 2,
        "prep_time": "15 mins",
        "cook_time": "15 mins",
        "difficulty": "Easy",
        "calories": 540.0,
        "protein_g": 32.0,
        "carbs_g": 48.0,
        "fat_g": 24.0,
        "fiber_g": 6.5,
        "sugar_g": 5.0,
        "sodium_mg": 680.0,
        "is_favorite": True,
        "ingredients": [
            {"name": "Paneer", "amount": 250.0, "unit": "grams", "notes": "cut into 1-inch cubes"},
            {"name": "Greek Yogurt (plain)", "amount": 0.5, "unit": "cups", "notes": "marinade base"},
            {"name": "Basmati Rice", "amount": 1.0, "unit": "cups", "notes": "uncooked, rinsed"},
            {"name": "Bell Pepper (Red/Green)", "amount": 1.0, "unit": "units", "notes": "sliced"},
            {"name": "Red Onion", "amount": 1.0, "unit": "units", "notes": "diced"},
            {"name": "Garam Masala", "amount": 1.0, "unit": "tsp", "notes": "ground spice"},
            {"name": "Kashmiri Chili Powder", "amount": 0.75, "unit": "tsp", "notes": "mild heat and color"},
            {"name": "Olive Oil", "amount": 1.0, "unit": "tbsp", "notes": "for searing"}
        ],
        "instructions": [
            "Whisk Greek yogurt, garam masala, chili powder, salt, and half the olive oil in a medium bowl.",
            "Add paneer cubes and sliced bell peppers; gently toss to coat thoroughly. Marinate for 10 minutes.",
            "Cook basmati rice according to package directions with a pinch of salt until fluffy.",
            "Heat remaining olive oil in a heavy cast-iron skillet over medium-high heat.",
            "Sear paneer cubes and peppers for 3-4 minutes per side until golden brown edges form.",
            "Assemble bowls: distribute warm basmati rice, top with seared paneer and peppers, garnish with fresh cilantro."
        ],
        "tags": ["High-Protein", "Vegetarian", "Quick", "Dinner"]
    },
    {
        "id": "rec_mediterranean_quinoa_002",
        "user_id": "chef_elena",
        "title": "Mediterranean Quinoa & Chickpea Power Salad",
        "description": "Zesty, nutrient-dense Mediterranean bowl packed with crispy chickpeas, fluffy quinoa, kalamata olives, cherry tomatoes, and lemon-herb vinaigrette.",
        "cuisine": "Mediterranean",
        "meal_type": "Lunch",
        "servings": 4,
        "prep_time": "15 mins",
        "cook_time": "15 mins",
        "difficulty": "Easy",
        "calories": 420.0,
        "protein_g": 16.5,
        "carbs_g": 58.0,
        "fat_g": 15.0,
        "fiber_g": 11.0,
        "sugar_g": 6.0,
        "sodium_mg": 520.0,
        "is_favorite": True,
        "ingredients": [
            {"name": "Quinoa", "amount": 1.5, "unit": "cups", "notes": "rinsed well"},
            {"name": "Chickpeas (canned)", "amount": 1.0, "unit": "cans", "notes": "drained and rinsed"},
            {"name": "Cherry Tomatoes", "amount": 1.5, "unit": "cups", "notes": "halved"},
            {"name": "English Cucumber", "amount": 1.0, "unit": "units", "notes": "diced"},
            {"name": "Kalamata Olives", "amount": 0.5, "unit": "cups", "notes": "pitted and sliced"},
            {"name": "Extra Virgin Olive Oil", "amount": 3.0, "unit": "tbsp", "notes": "dressing"},
            {"name": "Fresh Lemon Juice", "amount": 2.0, "unit": "tbsp", "notes": "freshly squeezed"},
            {"name": "Dried Oregano", "amount": 1.0, "unit": "tsp", "notes": "herb seasoning"}
        ],
        "instructions": [
            "Simmer rinsed quinoa in 3 cups of water with a pinch of salt for 15 minutes until water is absorbed; fluff with fork and cool.",
            "In a small jar, shake olive oil, lemon juice, dried oregano, salt, and freshly cracked black pepper.",
            "In a large bowl, combine cooled quinoa, drained chickpeas, halved cherry tomatoes, diced cucumber, and olives.",
            "Pour dressing over salad and toss gently to combine. Chill for 15 minutes before serving to let flavors marry."
        ],
        "tags": ["Vegan", "Gluten-Free", "Meal-Prep", "Fiber-Rich"]
    },
    {
        "id": "rec_garlic_salmon_003",
        "user_id": "chef_marcus",
        "title": "Pan-Seared Garlic Herb Butter Salmon",
        "description": "Crisp skin wild salmon fillets basted in clarified garlic butter with fresh dill and asparagus spears.",
        "cuisine": "American",
        "meal_type": "Dinner",
        "servings": 2,
        "prep_time": "10 mins",
        "cook_time": "12 mins",
        "difficulty": "Intermediate",
        "calories": 485.0,
        "protein_g": 41.0,
        "carbs_g": 5.0,
        "fat_g": 32.0,
        "fiber_g": 2.5,
        "sugar_g": 1.5,
        "sodium_mg": 410.0,
        "is_favorite": False,
        "ingredients": [
            {"name": "Salmon Fillets", "amount": 2.0, "unit": "fillets", "notes": "approx 6 oz each, skin-on"},
            {"name": "Butter (unsalted)", "amount": 2.0, "unit": "tbsp", "notes": "for basting"},
            {"name": "Garlic Cloves", "amount": 3.0, "unit": "cloves", "notes": "minced"},
            {"name": "Fresh Dill", "amount": 1.0, "unit": "tbsp", "notes": "chopped"},
            {"name": "Fresh Asparagus", "amount": 1.0, "unit": "bunches", "notes": "woody ends trimmed"},
            {"name": "Lemon", "amount": 0.5, "unit": "units", "notes": "sliced for serving"}
        ],
        "instructions": [
            "Pat salmon fillets completely dry with paper towels; season both sides generously with kosher salt and black pepper.",
            "Heat 1 tbsp oil in a stainless or non-stick pan over medium-high heat until shimmering.",
            "Place salmon skin-side down. Press gently for 10 seconds to ensure skin stays flat. Sear for 5-6 minutes undisturbed.",
            "Flip salmon, add butter, minced garlic, and asparagus to the pan. Spoon foamy melted butter over salmon repeatedly for 2-3 minutes.",
            "Remove salmon and asparagus when internal temperature reaches 125°F-130°F. Garnish with fresh dill and lemon wedges."
        ],
        "tags": ["Keto", "High-Protein", "Low-Carb", "Omega-3"]
    }
]

class RecipeStore:
    def __init__(self, db_path: str = RECIPES_DB_PATH):
        self.db_path = db_path
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._get_connection() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS saved_recipes (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    title TEXT NOT NULL,
                    description TEXT,
                    cuisine TEXT,
                    meal_type TEXT,
                    servings INTEGER NOT NULL,
                    prep_time TEXT,
                    cook_time TEXT,
                    difficulty TEXT,
                    calories REAL,
                    protein_g REAL,
                    carbs_g REAL,
                    fat_g REAL,
                    fiber_g REAL,
                    sugar_g REAL,
                    sodium_mg REAL,
                    ingredients TEXT NOT NULL,
                    instructions TEXT NOT NULL,
                    tags TEXT,
                    is_favorite INTEGER DEFAULT 0,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );
            """)
            conn.commit()

        # Seed defaults if empty
        self._seed_defaults_if_empty()

    def _seed_defaults_if_empty(self):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) as cnt FROM saved_recipes")
            count = cursor.fetchone()["cnt"]
            if count == 0:
                for r in CURATED_DEFAULT_RECIPES:
                    self.save_recipe(r)

    def save_recipe(self, recipe: Dict[str, Any]) -> Dict[str, Any]:
        """Insert or update a recipe in the store."""
        recipe_id = recipe.get("id") or f"rec_{uuid.uuid4().hex[:12]}"
        user_id = recipe.get("user_id", "default_chef")
        title = recipe.get("title", "Untitled Recipe")
        description = recipe.get("description", "")
        cuisine = recipe.get("cuisine", "General")
        meal_type = recipe.get("meal_type", "Main")
        servings = int(recipe.get("servings", 4))
        prep_time = recipe.get("prep_time", "15 mins")
        cook_time = recipe.get("cook_time", "20 mins")
        difficulty = recipe.get("difficulty", "Medium")
        
        calories = float(recipe.get("calories") or 0.0)
        protein_g = float(recipe.get("protein_g") or 0.0)
        carbs_g = float(recipe.get("carbs_g") or 0.0)
        fat_g = float(recipe.get("fat_g") or 0.0)
        fiber_g = float(recipe.get("fiber_g") or 0.0)
        sugar_g = float(recipe.get("sugar_g") or 0.0)
        sodium_mg = float(recipe.get("sodium_mg") or 0.0)
        
        ingredients_json = json.dumps(recipe.get("ingredients", []))
        instructions_json = json.dumps(recipe.get("instructions", []))
        tags_json = json.dumps(recipe.get("tags", []))
        is_favorite = 1 if recipe.get("is_favorite") else 0
        now = datetime.utcnow().isoformat()

        with self._get_connection() as conn:
            conn.execute("""
                INSERT INTO saved_recipes (
                    id, user_id, title, description, cuisine, meal_type,
                    servings, prep_time, cook_time, difficulty,
                    calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg,
                    ingredients, instructions, tags, is_favorite, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    title = excluded.title,
                    description = excluded.description,
                    cuisine = excluded.cuisine,
                    meal_type = excluded.meal_type,
                    servings = excluded.servings,
                    prep_time = excluded.prep_time,
                    cook_time = excluded.cook_time,
                    difficulty = excluded.difficulty,
                    calories = excluded.calories,
                    protein_g = excluded.protein_g,
                    carbs_g = excluded.carbs_g,
                    fat_g = excluded.fat_g,
                    fiber_g = excluded.fiber_g,
                    sugar_g = excluded.sugar_g,
                    sodium_mg = excluded.sodium_mg,
                    ingredients = excluded.ingredients,
                    instructions = excluded.instructions,
                    tags = excluded.tags,
                    is_favorite = excluded.is_favorite,
                    updated_at = excluded.updated_at;
            """, (
                recipe_id, user_id, title, description, cuisine, meal_type,
                servings, prep_time, cook_time, difficulty,
                calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg,
                ingredients_json, instructions_json, tags_json, is_favorite, now, now
            ))
            conn.commit()

        recipe["id"] = recipe_id
        return recipe

    def list_recipes(
        self,
        user_id: Optional[str] = None,
        query: Optional[str] = None,
        cuisine: Optional[str] = None,
        favorites_only: bool = False
    ) -> List[Dict[str, Any]]:
        """List recipes with optional filters."""
        sql = "SELECT * FROM saved_recipes WHERE 1=1"
        params: List[Any] = []

        if user_id:
            sql += " AND (user_id = ? OR user_id = 'chef_elena' OR user_id = 'default_chef')"
            params.append(user_id)
        if cuisine and cuisine != "all":
            sql += " AND LOWER(cuisine) = LOWER(?)"
            params.append(cuisine)
        if favorites_only:
            sql += " AND is_favorite = 1"
        if query:
            sql += " AND (LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(tags) LIKE ?)"
            term = f"%{query.lower()}%"
            params.extend([term, term, term])

        sql += " ORDER BY is_favorite DESC, created_at DESC"

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(sql, params)
            rows = cursor.fetchall()
            return [self._row_to_dict(r) for r in rows]

    def get_recipe(self, recipe_id: str) -> Optional[Dict[str, Any]]:
        """Fetch single recipe by ID."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM saved_recipes WHERE id = ?", (recipe_id,))
            row = cursor.fetchone()
            return self._row_to_dict(row) if row else None

    def delete_recipe(self, recipe_id: str) -> bool:
        """Delete recipe by ID."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM saved_recipes WHERE id = ?", (recipe_id,))
            conn.commit()
            return cursor.rowcount > 0

    def toggle_favorite(self, recipe_id: str) -> Optional[bool]:
        """Toggle favorite flag and return new status."""
        rec = self.get_recipe(recipe_id)
        if not rec:
            return None
        new_fav = not rec.get("is_favorite", False)
        with self._get_connection() as conn:
            conn.execute(
                "UPDATE saved_recipes SET is_favorite = ? WHERE id = ?",
                (1 if new_fav else 0, recipe_id)
            )
            conn.commit()
        return new_fav

    def _row_to_dict(self, row: sqlite3.Row) -> Dict[str, Any]:
        d = dict(row)
        d["is_favorite"] = bool(d.get("is_favorite", 0))
        try:
            d["ingredients"] = json.loads(d.get("ingredients") or "[]")
        except Exception:
            d["ingredients"] = []
        try:
            d["instructions"] = json.loads(d.get("instructions") or "[]")
        except Exception:
            d["instructions"] = []
        try:
            d["tags"] = json.loads(d.get("tags") or "[]")
        except Exception:
            d["tags"] = []
        return d

# Global default store instance
default_recipe_store = RecipeStore()
