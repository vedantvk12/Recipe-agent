"""
Real-Time Multi-Agent Streaming Engine (SSE)
============================================
Executes LangGraph StateGraph nodes and streams real-time state transitions,
agent execution timings, tool outputs, and approval gate requests over SSE.
"""
import time
import json
import uuid
from typing import Dict, Any, Optional, AsyncGenerator
from langchain_core.messages import HumanMessage
from ta2.graph import ta2_agent_graph
from ta2.memory.long_term import default_long_term_store
from ta2.config import DEFAULT_USER_ID, DEFAULT_SESSION_ID, TRACES_DIR

AGENT_DISPLAY_NAMES = {
    "supervisor": "Supervisor Router",
    "critic": "Culinary Critic & Guard Agent",
    "recipe_agent": "Recipe Scaling Agent",
    "nutrition_agent": "Nutrition Estimation Agent",
    "synthesizer": "Response Synthesizer",
    "approval": "Human Approval Gate"
}

async def stream_ta2_agent_execution(
    question: str,
    thread_id: str = DEFAULT_SESSION_ID,
    user_id: str = DEFAULT_USER_ID,
    memory_enabled: bool = True,
    approval_decision: Optional[str] = None
) -> AsyncGenerator[str, None]:
    """
    Streams LangGraph node execution events formatted for Server-Sent Events (SSE).
    Never fakes or simulates timers; yields real LangGraph node transitions.
    """
    start_total_time = time.time()
    config = {"configurable": {"thread_id": thread_id}}

    # 1. Yield Initial Workflow Event
    init_event = {
        "event": "workflow_start",
        "data": {
            "thread_id": thread_id,
            "user_id": user_id,
            "question": question,
            "timestamp": time.time()
        }
    }
    yield f"data: {json.dumps(init_event)}\n\n"

    # 2. Supervisor Initial Routing Event
    sup_event = {
        "event": "agent_state_update",
        "data": {
            "agent": "Supervisor Router",
            "agent_key": "supervisor",
            "status": "running",
            "operation": "Evaluating input safety and determining execution route",
            "timestamp": time.time(),
            "details": f"Routing turn in thread {thread_id}"
        }
    }
    yield f"data: {json.dumps(sup_event)}\n\n"

    # 3. Retrieve user preferences
    user_prefs = {}
    if memory_enabled:
        user_prefs = default_long_term_store.get_namespace(user_id, "recipe_preferences")
        profile = default_long_term_store.get_namespace(user_id, "profile")
        user_prefs.update(profile)

    initial_state = {
        "messages": [HumanMessage(content=question)],
        "thread_id": thread_id,
        "user_id": user_id,
        "user_preferences": user_prefs,
        "memory_enabled": memory_enabled,
        "active_agent": "start",
        "hop_count": 0,
        "approval_status": approval_decision
    }

    full_trace = []
    final_state = {}
    
    try:
        # LangGraph updates stream
        for step_chunk in ta2_agent_graph.stream(initial_state, config=config, stream_mode="updates"):
            for node_name, node_update in step_chunk.items():
                node_duration_ms = round((time.time() - start_total_time) * 1000, 1)
                display_name = AGENT_DISPLAY_NAMES.get(node_name, node_name)
                
                # Check traces generated in this step
                step_trace = node_update.get("execution_trace", [])
                if step_trace:
                    full_trace = step_trace
                    latest_step = step_trace[-1]
                else:
                    latest_step = {}

                # Determine agent status
                is_safe = node_update.get("is_safe", True)
                pending_appr = node_update.get("pending_approval")
                
                status = "completed"
                if is_safe is False:
                    status = "failed"
                elif pending_appr:
                    status = "needs_approval"

                summary = latest_step.get("details") or latest_step.get("action") or f"Executed node {node_name}"
                
                event_data = {
                    "event": "agent_state_update",
                    "data": {
                        "agent": display_name,
                        "agent_key": node_name,
                        "status": status,
                        "operation": latest_step.get("action", f"Run {node_name}"),
                        "output_summary": summary,
                        "duration_ms": node_duration_ms,
                        "details": summary,
                        "arguments": latest_step.get("arguments"),
                        "result": latest_step.get("result") or latest_step.get("formula"),
                        "ticket_id": latest_step.get("ticket_id"),
                        "timestamp": time.time()
                    }
                }
                yield f"data: {json.dumps(event_data)}\n\n"

                # If pending approval, yield human approval gate event
                if pending_appr:
                    approval_event = {
                        "event": "approval_required",
                        "data": {
                            "agent": "Human Approval Gate",
                            "agent_key": "approval",
                            "status": "waiting",
                            "ticket": pending_appr,
                            "timestamp": time.time()
                        }
                    }
                    yield f"data: {json.dumps(approval_event)}\n\n"

                # Update accumulated state
                final_state.update(node_update)

        # 4. Final completion
        total_latency_ms = round((time.time() - start_total_time) * 1000, 1)
        final_answer = final_state.get("final_response") or "Recipe workflow completed."
        
        # Save trace to disk
        trace_record = {
            "run_id": uuid.uuid4().hex[:10],
            "thread_id": thread_id,
            "user_id": user_id,
            "question": question,
            "final_answer": final_answer,
            "scaling_result": final_state.get("scaling_result"),
            "nutrition_result": final_state.get("nutrition_result"),
            "pending_approval": final_state.get("pending_approval"),
            "trace": full_trace
        }
        trace_file = TRACES_DIR / f"trace_{thread_id}.json"
        with open(trace_file, "w", encoding="utf-8") as f:
            json.dump(trace_record, f, indent=2)

        complete_event = {
            "event": "workflow_complete",
            "data": {
                "success": final_state.get("is_safe", True) is not False,
                "final_answer": final_answer,
                "scaling_result": final_state.get("scaling_result"),
                "nutrition_result": final_state.get("nutrition_result"),
                "pending_approval": final_state.get("pending_approval"),
                "thread_id": thread_id,
                "user_id": user_id,
                "trace": full_trace,
                "total_latency_ms": total_latency_ms
            }
        }
        yield f"data: {json.dumps(complete_event)}\n\n"

    except Exception as e:
        error_event = {
            "event": "workflow_error",
            "data": {
                "error": str(e),
                "agent": "Supervisor Router",
                "status": "failed",
                "recovery_suggestion": "Check input parameters, ensure Ollama is accessible, or verify ingredient formatting."
            }
        }
        yield f"data: {json.dumps(error_event)}\n\n"
