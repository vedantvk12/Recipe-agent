from typing import List, Dict, Any, Tuple
from langchain_chroma import Chroma
from langchain_core.prompts import ChatPromptTemplate
from langchain_ollama import ChatOllama

from ta2.config import (
    CHROMA_PERSIST_DIR,
    LLM_MODEL,
    OLLAMA_BASE_URL,
)
from ta2.rag.ingest import get_embeddings_model

def get_chroma_vector_store() -> Chroma:
    """Load existing Chroma vector store from persistent directory."""
    embeddings = get_embeddings_model()
    return Chroma(
        persist_directory=CHROMA_PERSIST_DIR,
        embedding_function=embeddings,
        collection_name="recipe_agent_knowledge"
    )

def retrieve_relevant_chunks(query: str, k: int = 3) -> List[Dict[str, Any]]:
    """Retrieve top-k relevant document chunks with sources and metadata."""
    vector_store = get_chroma_vector_store()
    results = vector_store.similarity_search_with_relevance_scores(query, k=k)
    
    extracted = []
    for doc, score in results:
        extracted.append({
            "source": doc.metadata.get("source", "unknown"),
            "title": doc.metadata.get("title", ""),
            "chunk_id": doc.metadata.get("chunk_id", 0),
            "content": doc.page_content,
            "relevance_score": round(float(score), 4)
        })
    return extracted

RAG_PROMPT_TEMPLATE = """You are a grounded Culinary & Nutritional Knowledge Assistant.
Answer the user's question using ONLY the provided context excerpts from project documents.

STRICT RULES:
1. Cite the source document name(s) (e.g. [ingredient_unit_conversions.md]) for every fact.
2. If the context does not contain enough information to answer the question, you MUST say exactly:
"I don't know based on the available documents."
3. DO NOT invent citations, nutritional facts, or general knowledge outside the context.

CONTEXT:
{context}

QUESTION:
{question}

GROUNDED ANSWER:"""

def answer_with_rag(query: str, k: int = 3) -> Dict[str, Any]:
    """Retrieve context and generate grounded answer or honest abstention."""
    chunks = retrieve_relevant_chunks(query, k=k)
    
    if not chunks:
        return {
            "query": query,
            "k": k,
            "answer": "I don't know based on the available documents.",
            "sources": [],
            "chunks": []
        }
    
    # Format context with explicit source tags
    context_parts = []
    sources = set()
    for c in chunks:
        sources.add(c["source"])
        context_parts.append(f"--- Source: [{c['source']}] (Chunk #{c['chunk_id']}) ---\n{c['content']}")
    
    context_str = "\n\n".join(context_parts)
    
    llm = ChatOllama(model=LLM_MODEL, temperature=0, base_url=OLLAMA_BASE_URL)
    prompt = ChatPromptTemplate.from_template(RAG_PROMPT_TEMPLATE)
    chain = prompt | llm
    
    response = chain.invoke({"context": context_str, "question": query})
    answer_text = response.content.strip()
    
    return {
        "query": query,
        "k": k,
        "answer": answer_text,
        "sources": list(sources),
        "chunks": chunks
    }

def run_retrieval_comparison_and_abstention_demo():
    """
    Demonstrates:
    1. Retrieval comparison with k=1 vs k=3
    2. Grounded answer with source citations
    3. Unanswerable question demonstrating explicit abstention
    """
    print("\n=======================================================")
    print("RAG DEMONSTRATION: k=1 vs k=3 COMPARISON & ABSTENTION")
    print("=======================================================")
    
    query = "How many calories are in 1 cup of all-purpose flour and how many grams does it weigh?"
    print(f"\n[Test Query]: {query}")
    
    # 1. k=1
    res_k1 = answer_with_rag(query, k=1)
    print(f"\n--- Result with k=1 ---")
    print(f"Sources retrieved : {res_k1['sources']}")
    print(f"Chunks count      : {len(res_k1['chunks'])}")
    print(f"Answer:\n{res_k1['answer']}")
    
    # 2. k=3
    res_k3 = answer_with_rag(query, k=3)
    print(f"\n--- Result with k=3 ---")
    print(f"Sources retrieved : {res_k3['sources']}")
    print(f"Chunks count      : {len(res_k3['chunks'])}")
    print(f"Answer:\n{res_k3['answer']}")
    
    # 3. Unanswerable question
    unanswerable = "What is the boiling point of liquid nitrogen in deep space?"
    print(f"\n[Unanswerable Query]: {unanswerable}")
    res_unanswerable = answer_with_rag(unanswerable, k=3)
    print(f"Answer:\n{res_unanswerable['answer']}")
    
    return {
        "k1": res_k1,
        "k3": res_k3,
        "unanswerable": res_unanswerable
    }

if __name__ == "__main__":
    run_retrieval_comparison_and_abstention_demo()
