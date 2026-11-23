from typing import List, Dict, Any, Optional, Annotated
from typing_extensions import TypedDict
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages

class AgentState(TypedDict, total=False):
    # Core message history
    messages: Annotated[List[BaseMessage], add_messages]
    
    # Session & User identification
    thread_id: str
    user_id: str
    
    # Memory and preferences
    user_preferences: Dict[str, Any]
    memory_enabled: bool
    
    # Structured workflow data
    parsed_request: Dict[str, Any]
    scaling_result: Optional[Dict[str, Any]]
    nutrition_result: Optional[Dict[str, Any]]
    rag_context: Optional[List[Dict[str, Any]]]
    
    # Safety and Human-in-the-loop approval
    pending_approval: Optional[Dict[str, Any]]
    approval_status: Optional[str]  # None | "pending" | "approved" | "rejected"
    is_safe: bool
    safety_notes: Optional[str]
    
    # Supervisor and loop limits
    hop_count: int
    active_agent: str
    next_step: str
    final_response: Optional[str]
    
    # Trace timeline for UI and evaluation
    execution_trace: List[Dict[str, Any]]
