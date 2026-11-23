import sqlite3
from typing import Optional, List, Dict, Any
from langgraph.checkpoint.sqlite import SqliteSaver
from ta2.config import SQLITE_CHECKPOINT_PATH

_checkpointer_instance: Optional[SqliteSaver] = None

def get_short_term_checkpointer(db_path: str = SQLITE_CHECKPOINT_PATH) -> SqliteSaver:
    """Returns a singleton SqliteSaver checkpointer for LangGraph graph persistence."""
    global _checkpointer_instance
    if _checkpointer_instance is None:
        # Establish connection with WAL mode enabled for concurrent reads/writes
        conn = sqlite3.connect(db_path, check_same_thread=False)
        conn.execute("PRAGMA journal_mode=WAL;")
        _checkpointer_instance = SqliteSaver(conn)
        _checkpointer_instance.setup()
    return _checkpointer_instance

def get_thread_state_summary(thread_id: str, db_path: str = SQLITE_CHECKPOINT_PATH) -> Dict[str, Any]:
    """Retrieve saved state summary for a specific thread_id."""
    checkpointer = get_short_term_checkpointer(db_path)
    config = {"configurable": {"thread_id": thread_id}}
    tuple_state = checkpointer.get_tuple(config)
    if not tuple_state or not tuple_state.checkpoint:
        return {"exists": False, "thread_id": thread_id, "messages_count": 0}
    
    channel_values = tuple_state.checkpoint.get("channel_values", {})
    messages = channel_values.get("messages", [])
    return {
        "exists": True,
        "thread_id": thread_id,
        "checkpoint_id": tuple_state.checkpoint.get("id"),
        "messages_count": len(messages),
        "last_message": messages[-1].content if messages else None
    }

def list_all_threads(db_path: str = SQLITE_CHECKPOINT_PATH) -> List[str]:
    """List unique thread_ids stored in the checkpoint SQLite database."""
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT DISTINCT thread_id FROM checkpoints")
        rows = cursor.fetchall()
        conn.close()
        return [row[0] for row in rows if row[0]]
    except Exception:
        return []
