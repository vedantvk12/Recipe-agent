import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
from ta2.agent import run_ta2_agent

def main():
    print("--- Running TA2 Multi-Agent Execution Test ---")
    question = (
        "A recipe serves 4 people and uses 2 cups of flour. "
        "Scale it to serve 8 people. "
        "Each cup of flour contains 455 calories. "
        "Calculate the calories for the scaled amount."
    )
    res = run_ta2_agent(question, thread_id="test_session_1")
    print("Success:", res["success"])
    print("Final Answer:\n", res["final_answer"])
    print("\nExecution Trace:")
    for step in res["trace"]:
        agent = step.get("agent", "Unknown")
        action = step.get("action", "")
        status = step.get("status", "")
        print(f"  Step {step['step']}: [{agent}] -> {action} ({status})")

if __name__ == "__main__":
    main()
