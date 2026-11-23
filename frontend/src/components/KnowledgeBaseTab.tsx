import { useState, useEffect } from 'react';
import {
  Search,
  Database,
  FileText,
  Loader2,
  RefreshCw,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';
import { apiClient } from '../api/client';
import type { RAGQueryResult } from '../api/client';

export default function KnowledgeBaseTab() {
  const [docStats, setDocStats] = useState<{ documents_count: number; total_chunks: number; sources: string[] } | null>(null);
  const [query, setQuery] = useState('How many calories are in 1 cup of all-purpose flour and how many grams does it weigh?');
  const [k, setK] = useState<number>(3);
  const [loading, setLoading] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [result, setResult] = useState<RAGQueryResult | null>(null);
  const [kComparison, setKComparison] = useState<{ k1: RAGQueryResult | null; k3: RAGQueryResult | null } | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const stats = await apiClient.getRAGDocuments();
      setDocStats(stats);
    } catch (e) {
      console.error(e);
    }
  };

  const handleQuery = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await apiClient.queryRAG(query, k);
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRunComparison = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const [res1, res3] = await Promise.all([
        apiClient.queryRAG(query, 1),
        apiClient.queryRAG(query, 3),
      ]);
      setKComparison({ k1: res1, k3: res3 });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleReingest = async () => {
    setIngesting(true);
    try {
      await apiClient.reingestRAG();
      await loadStats();
    } catch (e) {
      console.error(e);
    } finally {
      setIngesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-textMain tracking-tight">Local Knowledge Base & Chroma RAG</h2>
          <p className="text-xs text-textMuted mt-0.5">
            Strictly grounded local retrieval using nomic-embed-text embeddings and Chroma vector store (No internet or paid APIs).
          </p>
        </div>
        <button
          onClick={handleReingest}
          disabled={ingesting}
          className="px-3 py-1.5 rounded-xl bg-surfaceHighlight hover:bg-surfaceHighlight/80 text-textMain text-xs font-semibold border border-surfaceBorder flex items-center gap-2 transition-all shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${ingesting ? 'animate-spin' : ''}`} />
          {ingesting ? 'Re-indexing...' : 'Re-index Documents'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-surface border border-surfaceBorder">
          <div className="flex items-center justify-between text-textMuted mb-2">
            <span className="text-xs font-semibold uppercase">Project Documents</span>
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <div className="text-xl font-bold text-textMain">{docStats?.documents_count ?? 4} Documents</div>
          <p className="text-[11px] text-textMuted mt-1">Grounded local markdown guides</p>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-surfaceBorder">
          <div className="flex items-center justify-between text-textMuted mb-2">
            <span className="text-xs font-semibold uppercase">Embedded Chunks</span>
            <Database className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-textMain">{docStats?.total_chunks ?? 24} Chunks</div>
          <p className="text-[11px] text-textMuted mt-1">Chunk size 400 with 50-token overlap</p>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-surfaceBorder">
          <div className="flex items-center justify-between text-textMuted mb-2">
            <span className="text-xs font-semibold uppercase">Hallucination Guard</span>
            <ShieldAlert className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-textMain">Explicit Abstention</div>
          <p className="text-[11px] text-textMuted mt-1">Answers "I don't know" when missing evidence</p>
        </div>
      </div>

      {/* Query & Test Playground */}
      <div className="p-6 rounded-2xl bg-surface border border-surfaceBorder space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-textMuted font-medium">Quick Queries:</span>
          <button
            onClick={() => setQuery('How many calories are in 1 cup of all-purpose flour and how many grams does it weigh?')}
            className="px-2.5 py-1 text-xs rounded-lg bg-surfaceHighlight hover:bg-surfaceHighlight/80 text-textMuted hover:text-textMain border border-surfaceBorder"
          >
            Flour Conversion & Calories
          </button>
          <button
            onClick={() => setQuery('What are the minimum internal food safety temperatures for poultry?')}
            className="px-2.5 py-1 text-xs rounded-lg bg-surfaceHighlight hover:bg-surfaceHighlight/80 text-textMuted hover:text-textMain border border-surfaceBorder"
          >
            Poultry Safe Temperatures
          </button>
          <button
            onClick={() => setQuery('What is the boiling point of liquid nitrogen in deep space?')}
            className="px-2.5 py-1 text-xs rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30"
          >
            Unanswerable Question Test
          </button>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a culinary knowledge question..."
              className="w-full p-3 pl-10 rounded-xl bg-background border border-surfaceBorder text-textMain text-sm focus:outline-none focus:border-primary/50"
            />
            <Search className="w-4 h-4 text-textMuted absolute left-3.5 top-3.5" />
          </div>

          <div className="flex items-center gap-2 px-3 bg-surfaceHighlight border border-surfaceBorder rounded-xl text-xs">
            <span className="text-textMuted font-semibold">k:</span>
            <select
              value={k}
              onChange={(e) => setK(Number(e.target.value))}
              className="bg-transparent text-textMain font-bold cursor-pointer focus:outline-none"
            >
              <option value={1} className="bg-surface">1</option>
              <option value={3} className="bg-surface">3</option>
              <option value={5} className="bg-surface">5</option>
            </select>
          </div>

          <button
            onClick={handleQuery}
            disabled={loading}
            className="px-4 py-3 bg-primary hover:bg-primaryHover text-slate-900 font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-sm shrink-0"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Retrieve & Answer
          </button>

          <button
            onClick={handleRunComparison}
            disabled={loading}
            className="px-4 py-3 bg-surfaceHighlight hover:bg-surfaceHighlight/80 text-textMain font-semibold text-xs rounded-xl border border-surfaceBorder transition-all shrink-0"
          >
            Compare k=1 vs k=3
          </button>
        </div>
      </div>

      {/* k=1 vs k=3 Comparison View */}
      {kComparison && (
        <div className="p-6 rounded-2xl bg-surface border border-surfaceBorder space-y-4">
          <h3 className="text-sm font-bold text-textMain flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" /> Empirical Retrieval Comparison: k=1 vs k=3
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-surfaceHighlight/40 border border-surfaceBorder space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                <span>Configuration k=1 (Strict 1 Chunk)</span>
                <span className="font-mono">{kComparison.k1?.chunks.length} Chunk Retrieved</span>
              </div>
              <div className="text-xs text-textMain/90 p-3 rounded-lg bg-background border border-surfaceBorder">
                {kComparison.k1?.answer}
              </div>
              <div className="text-[11px] text-textMuted">
                Source: {kComparison.k1?.sources.join(', ') || 'None'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surfaceHighlight/40 border border-surfaceBorder space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-indigo-400">
                <span>Configuration k=3 (Top 3 Chunks)</span>
                <span className="font-mono">{kComparison.k3?.chunks.length} Chunks Retrieved</span>
              </div>
              <div className="text-xs text-textMain/90 p-3 rounded-lg bg-background border border-surfaceBorder">
                {kComparison.k3?.answer}
              </div>
              <div className="text-[11px] text-textMuted">
                Sources: {kComparison.k3?.sources.join(', ') || 'None'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Single Query Result & Grounded Chunks */}
      {result && (
        <div className="p-6 rounded-2xl bg-surface border border-surfaceBorder space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-textMain flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Grounded Assistant Response
            </h3>
            <div className="flex items-center gap-2">
              {result.sources.map((s, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-primary/10 text-primary border border-primary/20">
                  [{s}]
                </span>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-background border border-surfaceBorder text-xs text-textMain leading-relaxed whitespace-pre-wrap font-sans">
            {result.answer}
          </div>

          {/* Retrieved Excerpts */}
          <div className="space-y-2 pt-2">
            <span className="text-xs font-semibold text-textMuted uppercase tracking-wider block">
              Retrieved Source Excerpts ({result.chunks.length} Chunks)
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {result.chunks.map((chunk, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-surfaceHighlight/30 border border-surfaceBorder text-[11px]">
                  <div className="flex items-center justify-between font-mono text-[10px] text-textMuted mb-1.5 pb-1 border-b border-surfaceBorder/40">
                    <span className="text-primary font-bold">[{chunk.source}]</span>
                    <span>Chunk #{chunk.chunk_id}</span>
                  </div>
                  <p className="text-textMain/80 leading-normal line-clamp-4">{chunk.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
