import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from ta2.agent import run_ta2_agent
from ta2.evaluation.evaluate import run_evaluation_suite
from ta2.rag.retriever import run_retrieval_comparison_and_abstention_demo
from ta2.memory.seed_memory import seed_test_memories, verify_persistence, demonstrate_amnesia_comparison
from ta2.test_safety_approval import test_safety_and_approval_flow
from ta2.test_tool_failure import test_injected_failure_and_recovery
from ta1.main import test_validation as ta1_validation

def run_ta2_demo():
    print("\n--- Running TA2 Multi-Agent Autonomous Demo ---")
    question = (
        "A recipe serves 4 people and uses 2 cups of flour. "
        "Scale it to serve 8 people. "
        "Each cup contains 455 calories. "
        "Calculate the calories for the scaled amount."
    )
    res = run_ta2_agent(question, thread_id="cli_demo_session")
    print("\nAgent Response:\n", res["final_answer"])
    print("\nExecution Trace:")
    for step in res["trace"]:
        print(f"  Step {step['step']}: [{step.get('agent')}] -> {step.get('action')} ({step.get('status')})")

def run_custom_query():
    print("\nEnter your custom recipe question:\n> ", end="")
    try:
        q = input().strip()
        if not q:
            print("Question cannot be empty.")
            return
        res = run_ta2_agent(q, thread_id="cli_custom_session")
        print("\nAgent Response:\n", res["final_answer"])
        print("\nTrace:")
        for step in res["trace"]:
            print(f"  Step {step['step']}: [{step.get('agent')}] -> {step.get('action')} ({step.get('status')})")
    except EOFError:
        return

def main():
    while True:
        print("\n=======================================================")
        print("RECIPE SCALER & NUTRITION ESTIMATOR — TA2 AGENTIC AI")
        print("=======================================================")
        print("1. Run TA2 Multi-Agent Autonomous Demo")
        print("2. Run TA1-vs-TA2 Evaluation Suite (5 Shared Cases)")
        print("3. Run Local RAG Demo (k=1 vs k=3 & Abstention)")
        print("4. Run Long-Term Memory Persistence & Amnesia Demo")
        print("5. Run Human Oversight & Safety Approval Demo")
        print("6. Run Tool Failure & Recovery Demo")
        print("7. Run Baseline TA1 Validation Tests")
        print("8. Ask Custom Question")
        print("9. Exit")
        
        try:
            choice = input("\nSelect an option (1-9): ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nExiting...")
            sys.exit(0)
            
        if choice == '1':
            run_ta2_demo()
        elif choice == '2':
            run_evaluation_suite()
        elif choice == '3':
            run_retrieval_comparison_and_abstention_demo()
        elif choice == '4':
            seed_test_memories()
            verify_persistence()
            demonstrate_amnesia_comparison()
        elif choice == '5':
            test_safety_and_approval_flow()
        elif choice == '6':
            test_injected_failure_and_recovery()
        elif choice == '7':
            ta1_validation()
        elif choice == '8':
            run_custom_query()
        elif choice == '9':
            print("Exiting...")
            sys.exit(0)
        else:
            print("Invalid choice. Please select 1-9.")

if __name__ == "__main__":
    main()
