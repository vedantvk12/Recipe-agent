# Recipe Scaler & Nutrition Estimator — TA2 Agentic AI System

An autonomous multi-agent AI system built on **LangGraph**, local **Ollama** (`qwen2.5:3b` and `nomic-embed-text`), persistent **SQLite checkpointing & long-term memory**, local **Chroma RAG**, and **Human-in-the-Loop safety guardrails**.

---

## 1. System Architecture

```mermaid
flowchart TD
    User([User / Browser]) <--> UI[React 19 Dashboard]
    UI <-->|REST API| API[FastAPI Backend - port 8000]
    
    subgraph Multi-Agent Orchestration [LangGraph StateGraph]
        Supervisor[Supervisor Router (MAX_HOPS=6)]
        Critic[1. Culinary Critic & Guard Agent]
        RecipeAgent[2. Recipe Scaling Agent]
        NutritionAgent[3. Nutrition Estimation Agent]
        Synthesizer[4. Response Synthesizer]
        
        Supervisor --> Critic
        Critic -->|Safety Passed| RecipeAgent
        Critic -->|Consequential Scaling / Memory Write| Approval[Human Approval Gate]
        RecipeAgent -->|Validated Scaled Quantities| NutritionAgent
        NutritionAgent -->|Calculated Energy| Synthesizer
    end
    
    API <--> Multi-Agent Orchestration
    
    subgraph Persistent Storage
        Checkpointer[(SQLite WAL Checkpointer)] <--> Multi-Agent Orchestration
        LongTermStore[(SQLite Profile Store)] <--> Multi-Agent Orchestration
        ChromaDB[(Chroma Vector DB)] <--> RAG[Local RAG Engine]
    end
    
    subgraph Local Ollama Engine
        Qwen[qwen2.5:3b - Temperature 0]
        Nomic[nomic-embed-text - 768 dims]
    end
    
    Critic & Synthesizer <--> Qwen
    RAG <--> Nomic
```

---

## 2. Prerequisites (Windows)

1. **Install Ollama** from [https://ollama.com](https://ollama.com).
2. **Pull the local models** (100% offline, zero API keys required):
   ```bash
   ollama pull qwen2.5:3b
   ollama pull nomic-embed-text
   ```
3. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
4. **Install Frontend dependencies**:
   ```bash
   cd frontend
   npm install
   cd ..
   ```

---

## 3. How to Run the Project

### Option A: Full-Stack Web Application (Recommended)

Open two terminals:

#### Terminal 1 — Start FastAPI Backend:
```powershell
uvicorn api:app --reload --host 127.0.0.1 --port 8000
```
*API Swagger Documentation is available at: [http://localhost:8000/docs](http://localhost:8000/docs)*

#### Terminal 2 — Start React Web Dashboard:
```powershell
cd frontend
npm run dev
```
*Web Dashboard is available at: [http://localhost:5173](http://localhost:5173)*

---

### Option B: Interactive Terminal CLI Runner

Run the full interactive terminal interface with autonomous demo, RAG comparison, memory persistence, safety approval, and baseline validation options:

```powershell
python main.py
```

Menu options:
1. Run TA2 Multi-Agent Autonomous Demo
2. Run TA1-vs-TA2 Evaluation Suite (5 Shared Cases)
3. Run Local RAG Demo (k=1 vs k=3 & Abstention)
4. Run Long-Term Memory Persistence & Amnesia Demo
5. Run Human Oversight & Safety Approval Demo
6. Run Tool Failure & Recovery Demo
7. Run Baseline TA1 Validation Tests
8. Ask Custom Question
9. Exit

---

## 4. Verification & Testing Commands

To run individual automated test suites:

- **Run TA1 vs TA2 Evaluation Benchmark:**
  ```powershell
  python -m ta2.evaluation.evaluate
  ```
- **Test Multi-Turn Thread Continuity (Short-Term SQLite Checkpointer):**
  ```powershell
  python -m ta2.test_conversation
  ```
- **Test Long-Term Memory Persistence & Amnesia Comparison:**
  ```powershell
  python -m ta2.memory.seed_memory
  ```
- **Test Local Chroma RAG (k=1 vs k=3 Comparison & Unanswerable Question Abstention):**
  ```powershell
  python -m ta2.rag.retriever
  ```
- **Test Safety Guardrails & Human Approval Decision Paths:**
  ```powershell
  python -m ta2.test_safety_approval
  ```
- **Test Injected Tool Failure & Defensive Recovery:**
  ```powershell
  python -m ta2.test_tool_failure
  ```
- **Build Frontend TypeScript Bundle:**
  ```powershell
  cd frontend && npm run build
  ```

---

## 5. Frozen TA1 Baseline

The original TA1 baseline is preserved and frozen in:
[`d:/AGENT/recipe-agent/ta1/`](file:///d:/AGENT/recipe-agent/ta1/)
