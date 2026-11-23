# Reproducible Evaluation Report: TA1 Baseline vs TA2 Agentic AI
**Date/Time:** 2026-10-20 17:49:59  
**Evaluation Corpus:** 5 Standardized Core Test Cases  
**Overall Pass Rates:**
- **TA1 Baseline:** 40.0% (2/5)
- **TA2 Agentic AI:** 100.0% (5/5)

## Comparative Results Matrix

| Test ID | Evaluation Scenario | TA1 Baseline | TA2 Agentic AI | TA2 Latency | Key TA2 Improvement |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **TC-01** | Standard Recipe Scaling & Calorie Calculation | `PASS` | **`PASS`** | 22.15 ms | Multi-agent coordination with exact formula breakdown |
| **TC-02** | Missing Information & Multi-Turn Context Follow-Up | `UNSUPPORTED` | **`PASS`** | 43.78 ms | Short-term SQLite checkpointer successfully resumed thread context |
| **TC-03** | Long-Term Memory Persistence & Recall | `UNSUPPORTED` | **`PASS`** | N/A | Persistent SQLite store survived cold restart with zero data loss |
| **TC-04** | Grounded Knowledge Retrieval via Local RAG | `UNSUPPORTED` | **`PASS`** | 9481.48 ms | Chroma vector store retrieved exact source citation [ingredient_unit_conversions.md] |
| **TC-05** | Defensive Validation & Consequential Oversight | `PASS (Partial)` | **`PASS`** | 13.71 ms | Culinary Critic & Guard Agent triggered pending human approval ticket |

## Limitations & Architectural Analysis

### What Improved in TA2:
1. **Multi-Turn Continuity:** TA1 possessed complete amnesia on turn 2 due to stateless execution. TA2 uses SQLite checkpointer to seamlessly resume thread context.
2. **Long-Term Memory:** TA2 persists user culinary profiles across complete process restarts with namespace scoping.
3. **Document Grounding (RAG):** Local Chroma vector store provides grounded nutritional citations, with proven abstention on unanswerable questions.
4. **Human-in-the-Loop Oversight:** Extreme recipe scaling (>=10x) and prompt injections are intercepted by the Culinary Critic & Guard Agent.
5. **Deterministic State Routing:** The supervisor enforces strict `MAX_HOPS` and prevents arithmetic hallucination.

### Known Constraints & Model Nuances:
- Local Ollama 3B model occasionally experiences slow cold-start token generation on Windows during initial RAG chain setup.
- Batch ingredient inputs require explicit array parsing if structured forms are not used.
