import os
from pathlib import Path

# Base Paths
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

TRACES_DIR = BASE_DIR / "traces"
TRACES_DIR.mkdir(parents=True, exist_ok=True)

RAG_DOCS_DIR = BASE_DIR / "rag" / "documents"
RAG_DOCS_DIR.mkdir(parents=True, exist_ok=True)

CHROMA_PERSIST_DIR = str(DATA_DIR / "chroma_db")

# Database Paths
SQLITE_CHECKPOINT_PATH = str(DATA_DIR / "checkpoints.sqlite")
SQLITE_LONG_TERM_PATH = str(DATA_DIR / "long_term_memory.sqlite")

# Models (strictly local Ollama)
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
LLM_MODEL = os.getenv("LLM_MODEL", "qwen2.5:3b")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "nomic-embed-text")

# Orchestration & Guardrails
MAX_HOPS = 6
DEFAULT_USER_ID = "default_chef"
DEFAULT_SESSION_ID = "session_main"
