import uuid
from datetime import datetime
from typing import Dict, Any, Optional, List

# Store for active approvals
_approvals: Dict[str, Dict[str, Any]] = {}

def create_approval_request(
    thread_id: str,
    operation: str,
    description: str,
    payload: Dict[str, Any]
) -> Dict[str, Any]:
    """Create a pending human approval ticket."""
    approval_id = f"appr_{uuid.uuid4().hex[:8]}"
    ticket = {
        "approval_id": approval_id,
        "thread_id": thread_id,
        "operation": operation,
        "description": description,
        "payload": payload,
        "status": "pending",
        "created_at": datetime.utcnow().isoformat(),
        "resolved_at": None,
        "decision": None
    }
    _approvals[approval_id] = ticket
    return ticket

def get_approval(approval_id: str) -> Optional[Dict[str, Any]]:
    return _approvals.get(approval_id)

def get_pending_approvals(thread_id: Optional[str] = None) -> List[Dict[str, Any]]:
    pending = [a for a in _approvals.values() if a["status"] == "pending"]
    if thread_id:
        pending = [a for a in pending if a["thread_id"] == thread_id]
    return pending

def resolve_approval(approval_id: str, decision: str) -> Dict[str, Any]:
    """Resolve a pending ticket with 'approved' or 'rejected'."""
    if approval_id not in _approvals:
        return {"status": "error", "message": f"Approval ticket '{approval_id}' not found."}
    
    ticket = _approvals[approval_id]
    if ticket["status"] != "pending":
        return {"status": "error", "message": f"Ticket '{approval_id}' is already {ticket['status']}."}
    
    if decision not in ("approved", "rejected"):
        return {"status": "error", "message": "Decision must be either 'approved' or 'rejected'."}

    ticket["status"] = decision
    ticket["decision"] = decision
    ticket["resolved_at"] = datetime.utcnow().isoformat()
    return {"status": "success", "ticket": ticket}
