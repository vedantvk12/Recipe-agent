"""
Root FastAPI Application
Delegates directly to the robust TA2 Multi-Agent API while maintaining backward compatibility.
"""
from ta2.api import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
