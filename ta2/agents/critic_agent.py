"""
Culinary Critic & Guard Agent
=============================
1. Name: Culinary Critic & Guard Agent
2. Goal: Review recipe requests and intermediate agent states for security, safety, and operational boundaries.
3. Tools: None (Deterministic guardrail rules)
4. Inputs: AgentState (messages, parsed_request, scaling_result)
   Outputs: Updated AgentState with safety_notes, is_safe, and pending_approval ticket if required.
5. Guardrails:
   - Blocks prompt injection immediately.
   - Triggers human-in-the-loop approval ticket for extreme scale factors (>= 10x or <= 0.1x).
   - Gates writing preferences into persistent memory.
"""
from typing import Dict, Any
from ta2.state import AgentState
from ta2.safety.guardrails import assess_operation_safety
from ta2.safety.approval import create_approval_request

def critic_guard_node(state: AgentState) -> Dict[str, Any]:
    """Node reviewing safety and evaluating human-in-the-loop requirements."""
    messages = state.get("messages", [])
    user_text = messages[-1].content if messages else ""
    thread_id = state.get("thread_id", "default_thread")
    
    parsed = dict(state.get("parsed_request") or {})
    if not parsed and user_text:
        from ta2.agents.recipe_agent import parse_recipe_from_text
        parsed = parse_recipe_from_text(user_text)
    
    # Assess safety
    assessment = assess_operation_safety(parsed, user_text)
    trace = state.get("execution_trace", [])
    
    if assessment.get("blocked"):
        reason = assessment.get("reason", "Operation blocked by security policy.")
        trace.append({
            "step": len(trace) + 1,
            "agent": "Culinary Critic & Guard Agent",
            "action": "security_check",
            "status": "blocked",
            "details": reason
        })
        return {
            "active_agent": "critic_agent",
            "is_safe": False,
            "parsed_request": parsed,
            "safety_notes": reason,
            "final_response": f"🚨 Security Alert: {reason}",
            "execution_trace": trace
        }
        
    if assessment.get("requires_approval"):
        # Check if already approved in state
        approval_status = state.get("approval_status")
        if approval_status == "approved":
            trace.append({
                "step": len(trace) + 1,
                "agent": "Culinary Critic & Guard Agent",
                "action": "human_approval_check",
                "status": "approved",
                "details": "Consequential operation explicitly approved by human supervisor."
            })
            return {
                "active_agent": "critic_agent",
                "is_safe": True,
                "parsed_request": parsed,
                "pending_approval": None,
                "execution_trace": trace
            }
        elif approval_status == "rejected":
            trace.append({
                "step": len(trace) + 1,
                "agent": "Culinary Critic & Guard Agent",
                "action": "human_approval_check",
                "status": "rejected",
                "details": "Operation cancelled due to human supervisor rejection."
            })
            return {
                "active_agent": "critic_agent",
                "is_safe": False,
                "parsed_request": parsed,
                "pending_approval": None,
                "final_response": "Operation cancelled: Consequential scaling request was rejected by human supervisor.",
                "execution_trace": trace
            }
        else:
            # Create a pending approval ticket
            ticket = create_approval_request(
                thread_id=thread_id,
                operation=assessment.get("operation", "unknown_operation"),
                description=assessment.get("description", "Requires human authorization."),
                payload=parsed
            )
            trace.append({
                "step": len(trace) + 1,
                "agent": "Culinary Critic & Guard Agent",
                "action": "request_human_approval",
                "status": "pending_approval",
                "ticket_id": ticket["approval_id"],
                "details": ticket["description"]
            })
            return {
                "active_agent": "critic_agent",
                "is_safe": True,
                "parsed_request": parsed,
                "pending_approval": ticket,
                "approval_status": "pending",
                "final_response": f"⚠️ Human Approval Required: {ticket['description']} (Ticket: {ticket['approval_id']})",
                "execution_trace": trace
            }

    # Safe to proceed normally
    trace.append({
        "step": len(trace) + 1,
        "agent": "Culinary Critic & Guard Agent",
        "action": "security_check",
        "status": "passed",
        "details": "Input and parameters verified within standard operating thresholds."
    })
    return {
        "active_agent": "critic_agent",
        "is_safe": True,
        "parsed_request": parsed,
        "execution_trace": trace
    }
