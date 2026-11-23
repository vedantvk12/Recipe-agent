import json
import uuid
from typing import Dict, Any, Optional
from langchain_core.messages import HumanMessage
from ta2.graph import ta2_agent_graph
from ta2.memory.long_term import default_long_term_store
from ta2.config import DEFAULT_USER_ID, DEFAULT_SESSION_ID, TRACES_DIR

def run_ta2_agent(
    question: str,
    thread_id: str = DEFAULT_SESSION_ID,
    user_id: str = DEFAULT_USER_ID,
    memory_enabled: bool = True,
    approval_decision: Optional[str] = None
) -> Dict[str, Any]:
    """
    Main invocation entrypoint for the TA2 Multi-Agent system.
    Supports short-term memory (via thread_id), long-term SQLite memory,
    human approval resuming, and structured trace collection.
    """
    config = {"configurable": {"thread_id": thread_id}}
    
    # 1. Fetch user preferences if long-term memory is enabled
    user_prefs = {}
    if memory_enabled:
        user_prefs = default_long_term_store.get_namespace(user_id, "recipe_preferences")
        profile = default_long_term_store.get_namespace(user_id, "profile")
        user_prefs.update(profile)

    # 2. Build initial state update
    initial_state = {
        "messages": [HumanMessage(content=question)],
        "thread_id": thread_id,
        "user_id": user_id,
        "user_preferences": user_prefs,
        "memory_enabled": memory_enabled,
        "active_agent": "start",
        "hop_count": 0
    }
    
    if approval_decision:
        initial_state["approval_status"] = approval_decision

    # 3. Invoke graph with SQLite checkpoint persistence
    final_state = ta2_agent_graph.invoke(initial_state, config=config)
    
    trace = final_state.get("execution_trace", [])
    final_answer = final_state.get("final_response") or "Workflow executed."
    pending_appr = final_state.get("pending_approval")
    
    # 4. Save trace to traces directory
    trace_record = {
        "run_id": uuid.uuid4().hex[:10],
        "thread_id": thread_id,
        "user_id": user_id,
        "question": question,
        "final_answer": final_answer,
        "scaling_result": final_state.get("scaling_result"),
        "nutrition_result": final_state.get("nutrition_result"),
        "pending_approval": pending_appr,
        "trace": trace
    }
    
    trace_file = TRACES_DIR / f"trace_{thread_id}.json"
    with open(trace_file, "w", encoding="utf-8") as f:
        json.dump(trace_record, f, indent=2)

    return {
        "success": True if not final_state.get("is_safe") is False else False,
        "final_answer": final_answer,
        "scaling_result": final_state.get("scaling_result"),
        "nutrition_result": final_state.get("nutrition_result"),
        "pending_approval": pending_appr,
        "thread_id": thread_id,
        "user_id": user_id,
        "trace": trace
    }
