from ta2.agent import run_ta2_agent
from ta2.memory.short_term import get_short_term_checkpointer

r1 = run_ta2_agent("A recipe serves 4 people and uses 2 cups of flour.", thread_id="debug_thread_1")
print("R1 final_answer:", r1["final_answer"])
print("R1 trace:", r1["trace"])

checkpointer = get_short_term_checkpointer()
state1 = checkpointer.get_tuple({"configurable": {"thread_id": "debug_thread_1"}})
print("\nCheckpointer state after R1:")
print("channel_values:", state1.checkpoint["channel_values"])

r2 = run_ta2_agent("Scale it to serve 8 people. Each cup has 455 calories.", thread_id="debug_thread_1")
print("\nR2 final_answer:", r2["final_answer"])
print("R2 trace:", r2["trace"])
