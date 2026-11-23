import os
from pathlib import Path
from typing import List, Dict, Any
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_ollama import OllamaEmbeddings
from langchain_chroma import Chroma

from ta2.config import (
    RAG_DOCS_DIR,
    CHROMA_PERSIST_DIR,
    EMBEDDING_MODEL,
    OLLAMA_BASE_URL,
)

def load_documents_from_dir(docs_dir: Path) -> List[Document]:
    """Load all markdown and text documents from the target directory."""
    documents = []
    for file_path in docs_dir.glob("*.md"):
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            doc = Document(
                page_content=content,
                metadata={
                    "source": file_path.name,
                    "file_path": str(file_path),
                    "title": file_path.stem.replace("_", " ").title()
                }
            )
            documents.append(doc)
    return documents

def get_embeddings_model() -> OllamaEmbeddings:
    """Instantiate the local nomic-embed-text embedding model."""
    return OllamaEmbeddings(
        model=EMBEDDING_MODEL,
        base_url=OLLAMA_BASE_URL
    )

def ingest_knowledge_base(docs_dir: Path = RAG_DOCS_DIR, persist_dir: str = CHROMA_PERSIST_DIR) -> Dict[str, Any]:
    """Ingest documents, chunk them, embed with nomic-embed-text, and store in persistent Chroma."""
    docs = load_documents_from_dir(docs_dir)
    if not docs:
        raise ValueError(f"No documents found in {docs_dir}")

    # Chunking: ensure at least 8 meaningful chunks
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=400,
        chunk_overlap=50,
        separators=["\n## ", "\n\n", "\n", " "]
    )
    
    chunked_docs = splitter.split_documents(docs)
    for i, chunk in enumerate(chunked_docs):
        chunk.metadata["chunk_id"] = i + 1

    embeddings = get_embeddings_model()
    
    # Store in Chroma with persistent directory
    vector_store = Chroma.from_documents(
        documents=chunked_docs,
        embedding=embeddings,
        persist_directory=persist_dir,
        collection_name="recipe_agent_knowledge"
    )

    stats = {
        "status": "success",
        "documents_loaded": len(docs),
        "total_chunks": len(chunked_docs),
        "persist_directory": persist_dir,
        "embedding_model": EMBEDDING_MODEL,
        "sources": list(set(d.metadata["source"] for d in docs))
    }
    
    print("\n--- Ingestion Completed Successfully ---")
    print(f"Loaded Documents : {stats['documents_loaded']}")
    print(f"Total Chunks     : {stats['total_chunks']}")
    print(f"Chroma Directory : {stats['persist_directory']}")
    print(f"Sources Indexed  : {', '.join(stats['sources'])}")
    
    return stats

if __name__ == "__main__":
    ingest_knowledge_base()
