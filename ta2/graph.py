from langgraph.graph import StateGraph, START, END
from ta2.state import AgentState
from ta2.agents.critic_agent import critic_guard_node
from ta2.agents.recipe_agent import recipe_scaling_node
from ta2.agents.nutrition_agent import nutrition_estimation_node
from ta2.supervisor import supervisor_router, response_synthesizer_node
from ta2.memory.short_term import get_short_term_checkpointer

def create_ta2_graph(use_checkpointer: bool = True):
    """Constructs and compiles the TA2 Multi-Agent LangGraph StateGraph."""
    workflow = StateGraph(AgentState)
    
    # 1. Add Agent Nodes
    workflow.add_node("critic", critic_guard_node)
    workflow.add_node("recipe_agent", recipe_scaling_node)
    workflow.add_node("nutrition_agent", nutrition_estimation_node)
    workflow.add_node("synthesizer", response_synthesizer_node)
    
    # 2. Add Conditional Routing Edges
    workflow.add_conditional_edges(
        START,
        supervisor_router,
        {
            "critic": "critic",
            "recipe_agent": "recipe_agent",
            "nutrition_agent": "nutrition_agent",
            "synthesizer": "synthesizer",
            "__end__": END
        }
    )
    
    workflow.add_conditional_edges(
        "critic",
        supervisor_router,
        {
            "recipe_agent": "recipe_agent",
            "nutrition_agent": "nutrition_agent",
            "synthesizer": "synthesizer",
            "__end__": END
        }
    )
    
    workflow.add_conditional_edges(
        "recipe_agent",
        supervisor_router,
        {
            "nutrition_agent": "nutrition_agent",
            "synthesizer": "synthesizer",
            "__end__": END
        }
    )
    
    workflow.add_conditional_edges(
        "nutrition_agent",
        supervisor_router,
        {
            "synthesizer": "synthesizer",
            "__end__": END
        }
    )
    
    workflow.add_edge("synthesizer", END)
    
    # 3. Attach SQLite checkpointer
    if use_checkpointer:
        checkpointer = get_short_term_checkpointer()
        return workflow.compile(checkpointer=checkpointer)
    else:
        return workflow.compile()

# Global compiled graph
ta2_agent_graph = create_ta2_graph()
