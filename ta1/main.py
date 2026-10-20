import sys
import json
from langchain_core.messages import HumanMessage, AIMessage, ToolMessage
from agent import get_agent
from tools import scale_recipe

def format_trace_and_save(events, user_question, filename="trace_output.txt"):
    trace = []
    trace.append("====================================================")
    trace.append("AUTONOMOUS AGENT TRACE")
    trace.append("====================================================")
    trace.append("\nUSER QUESTION:\n")
    trace.append(user_question)
    trace.append("\n----------------------------------------------------\n")

    step = 1
    
    # Process events to extract AIMessage with tool calls and ToolMessage
    for event in events:
        if "agent" in event:
            msg = event["agent"]["messages"][0]
            if isinstance(msg, AIMessage) and msg.tool_calls:
                trace.append(f"STEP {step}\n")
                if msg.content:
                    trace.append(f"AGENT DECISION:\n{msg.content}\n")
                
                for tool_call in msg.tool_calls:
                    trace.append("ACTUAL TOOL CALL:")
                    trace.append(tool_call['name'])
                    trace.append("\nARGUMENTS:")
                    for key, val in tool_call['args'].items():
                        trace.append(f"{key} = {val}")
                    trace.append("")
                
        elif "tools" in event:
            msg = event["tools"]["messages"][0]
            if isinstance(msg, ToolMessage):
                trace.append("TOOL RESULT:")
                try:
                    # format json nicely
                    parsed = json.loads(msg.content)
                    trace.append(json.dumps(parsed, indent=4))
                except:
                    trace.append(msg.content)
                trace.append("\n----------------------------------------------------\n")
                step += 1
                
    # Get final answer
    if events:
        last_event = events[-1]
        if "agent" in last_event:
            final_msg = last_event["agent"]["messages"][0]
            if isinstance(final_msg, AIMessage) and not final_msg.tool_calls:
                trace.append("FINAL AGENT RESPONSE:\n")
                trace.append(final_msg.content)
                trace.append("\n====================================================\n")
    
    trace_str = "\n".join(trace)
    print(trace_str)
    
    with open(filename, "w", encoding="utf-8") as f:
        f.write(trace_str)

def run_demo():
    print("\nRunning Autonomous Demo...")
    agent = get_agent()
    question = (
        "A recipe serves 4 people and uses 2 cups of flour.\n"
        "Scale it to serve 8 people.\n"
        "Each cup of flour contains 455 calories.\n"
        "Calculate the calories for the scaled amount."
    )
    
    inputs = {"messages": [HumanMessage(content=question)]}
    events = []
    
    # Run agent and collect events
    for event in agent.stream(inputs, stream_mode="values"):
        # We use stream_mode="updates" normally for step by step, let's use that
        pass
        
    events_updates = list(agent.stream(inputs, stream_mode="updates"))
    format_trace_and_save(events_updates, question)

def run_custom():
    agent = get_agent()
    print("\nEnter your question (Press Enter on an empty line to finish):\n> ", end="")
    lines = []
    while True:
        try:
            line = input()
            if not line.strip():
                break
            lines.append(line)
        except EOFError:
            break
            
    question = "\n".join(lines)
    if not question.strip():
        print("Question cannot be empty.")
        return
    
    inputs = {"messages": [HumanMessage(content=question)]}
    events_updates = list(agent.stream(inputs, stream_mode="updates"))
    format_trace_and_save(events_updates, question, filename="custom_trace_output.txt")


def test_validation():
    print("\n--- Running Validation Tests ---")
    
    print("\nTest 1: Original Servings = 0")
    result = scale_recipe.invoke({"servings_original": 0, "servings_target": 8, "ingredient_amount": 2})
    print(f"Result: {result}")
    
    print("\nTest 2: Negative Original Servings")
    result = scale_recipe.invoke({"servings_original": -4, "servings_target": 8, "ingredient_amount": 2})
    print(f"Result: {result}")

    print("\nTest 3: Target Servings = 0")
    result = scale_recipe.invoke({"servings_original": 4, "servings_target": 0, "ingredient_amount": 2})
    print(f"Result: {result}")

    print("\nTest 4: Negative Ingredient Amount")
    result = scale_recipe.invoke({"servings_original": 4, "servings_target": 8, "ingredient_amount": -2})
    print(f"Result: {result}")
    
    print("\nValidation tests completed successfully (no crashes).")

def main():
    while True:
        print("\n=================================================")
        print("RECIPE SCALER & NUTRITION ESTIMATOR AI AGENT")
        print("=================================================")
        print("1. Run Autonomous Demo")
        print("2. Run Validation Tests")
        print("3. Ask Custom Question")
        print("4. Exit")
        
        choice = input("\nSelect an option (1-4): ")
        
        if choice == '1':
            run_demo()
        elif choice == '2':
            test_validation()
        elif choice == '3':
            run_custom()
        elif choice == '4':
            print("Exiting...")
            sys.exit(0)
        else:
            print("Invalid choice. Please select 1-4.")

if __name__ == "__main__":
    main()
