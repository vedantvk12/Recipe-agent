import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
from ta2.agent import run_ta2_agent

def test_multi_turn_conversation():
    print("=== Testing Short-Term Memory Multi-Turn Thread Continuity ===")
    thread_id = "test_thread_continuity_42"
    
    # Turn 1: Incomplete prompt
    print("\n[Turn 1]: 'A recipe serves 4 people and uses 2 cups of flour.'")
    res1 = run_ta2_agent("A recipe serves 4 people and uses 2 cups of flour.", thread_id=thread_id)
    print("Turn 1 Response:\n", res1["final_answer"])
    
    # Turn 2: Follow-up providing missing pieces
    print("\n[Turn 2]: 'Scale it to serve 8 people. Each cup has 455 calories.'")
    res2 = run_ta2_agent("Scale it to serve 8 people. Each cup has 455 calories.", thread_id=thread_id)
    print("Turn 2 Response:\n", res2["final_answer"])
    
    print("\nTurn 2 Trace Steps:")
    for step in res2["trace"]:
        print(f"  Step {step['step']}: [{step.get('agent')}] -> {step.get('action')} ({step.get('status')})")
        
    # Check separate thread isolation
    print("\n[Turn 3 - Separate Thread]: 'What is the recipe?' (on new_isolated_thread)")
    res3 = run_ta2_agent("What is the recipe?", thread_id="new_isolated_thread")
    print("Separate Thread Response:\n", res3["final_answer"])

if __name__ == "__main__":
    test_multi_turn_conversation()
