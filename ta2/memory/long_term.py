import sqlite3
import json
from datetime import datetime
from typing import Dict, Any, Optional, List
from ta2.config import SQLITE_LONG_TERM_PATH

class LongTermMemoryStore:
    def __init__(self, db_path: str = SQLITE_LONG_TERM_PATH):
        self.db_path = db_path
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._get_connection() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS long_term_store (
                    user_id TEXT NOT NULL,
                    namespace TEXT NOT NULL,
                    key TEXT NOT NULL,
                    value TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    PRIMARY KEY (user_id, namespace, key)
                );
            """)
            conn.commit()

    def put(self, user_id: str, namespace: str, key: str, value: Any) -> None:
        """Store or update a value under a specific namespace for a user."""
        serialized = json.dumps(value)
        now = datetime.utcnow().isoformat()
        with self._get_connection() as conn:
            conn.execute("""
                INSERT INTO long_term_store (user_id, namespace, key, value, updated_at)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(user_id, namespace, key) DO UPDATE SET
                    value = excluded.value,
                    updated_at = excluded.updated_at;
            """, (user_id, namespace, key, serialized, now))
            conn.commit()

    def get(self, user_id: str, namespace: str, key: str) -> Optional[Any]:
        """Retrieve a specific key's value."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT value FROM long_term_store
                WHERE user_id = ? AND namespace = ? AND key = ?
            """, (user_id, namespace, key))
            row = cursor.fetchone()
            if row:
                try:
                    return json.loads(row["value"])
                except Exception:
                    return row["value"]
            return None

    def get_namespace(self, user_id: str, namespace: str) -> Dict[str, Any]:
        """Retrieve all key-values under a user's namespace."""
        results = {}
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT key, value FROM long_term_store
                WHERE user_id = ? AND namespace = ?
            """, (user_id, namespace))
            for row in cursor.fetchall():
                try:
                    results[row["key"]] = json.loads(row["value"])
                except Exception:
                    results[row["key"]] = row["value"]
        return results

    def get_all_user_memories(self, user_id: str) -> Dict[str, Dict[str, Any]]:
        """Retrieve all namespaces and preferences for a user."""
        all_memories: Dict[str, Dict[str, Any]] = {}
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT namespace, key, value, updated_at FROM long_term_store
                WHERE user_id = ?
                ORDER BY namespace, key
            """, (user_id,))
            for row in cursor.fetchall():
                ns = row["namespace"]
                if ns not in all_memories:
                    all_memories[ns] = {}
                try:
                    all_memories[ns][row["key"]] = json.loads(row["value"])
                except Exception:
                    all_memories[ns][row["key"]] = row["value"]
        return all_memories

    def delete(self, user_id: str, namespace: str, key: str) -> bool:
        """Delete a single key."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                DELETE FROM long_term_store
                WHERE user_id = ? AND namespace = ? AND key = ?
            """, (user_id, namespace, key))
            conn.commit()
            return cursor.rowcount > 0

    def clear_user(self, user_id: str) -> int:
        """Clear all memories for a user."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM long_term_store WHERE user_id = ?", (user_id,))
            conn.commit()
            return cursor.rowcount

# Default global instance
default_long_term_store = LongTermMemoryStore()
