import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_core.messages import HumanMessage, AIMessage, ToolMessage
from agent import get_agent
import main

app = FastAPI(title="Recipe Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RecipeRequest(BaseModel):
    question: str

@app.post("/api/recipe")
def run_recipe_agent(req: RecipeRequest):
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")
    
    try:
        agent = get_agent()
        inputs = {"messages": [HumanMessage(content=req.question)]}
        
        # Invoke agent
        final_state = agent.invoke(inputs)
        messages = final_state["messages"]
        
        trace = []
        final_answer = ""
        step = 1
        
        for msg in messages:
            if isinstance(msg, AIMessage) and msg.tool_calls:
                for tool_call in msg.tool_calls:
                    tool_name = tool_call['name']
                    arguments = tool_call['args']
                    
                    # Find matching ToolMessage
                    tool_result_raw = None
                    for t_msg in messages:
                        if isinstance(t_msg, ToolMessage) and t_msg.tool_call_id == tool_call['id']:
                            tool_result_raw = t_msg.content
                            break
                            
                    result_obj = {}
                    if tool_result_raw:
                        try:
                            result_obj = json.loads(tool_result_raw)
                        except json.JSONDecodeError:
                            result_obj = {"status": "success", "message": tool_result_raw}
                            
                    trace.append({
                        "step": step,
                        "tool": tool_name,
                        "arguments": arguments,
                        "result": result_obj
                    })
                    step += 1
            elif isinstance(msg, AIMessage) and not msg.tool_calls:
                # Store the last AIMessage content as the final answer
                if msg == messages[-1]:
                    final_answer = msg.content
                    
        return {
            "success": True,
            "final_answer": final_answer,
            "trace": trace
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/validate")
def run_validation_tests():
    import io
    import contextlib
    f = io.StringIO()
    with contextlib.redirect_stdout(f):
        main.test_validation()
    
    output = f.getvalue()
    return {"success": True, "output": output}
