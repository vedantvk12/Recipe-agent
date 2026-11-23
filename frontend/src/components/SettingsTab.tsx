import { useState } from 'react';
import {
  Cpu,
  Database,
  Layers,
  RefreshCw,
  Terminal
} from 'lucide-react';
import type { HealthStatus } from '../api/client';

interface SettingsTabProps {
  health: HealthStatus | null;
  onRefreshHealth: () => void;
}

export default function SettingsTab({ health, onRefreshHealth }: SettingsTabProps) {
  const [validating, setValidating] = useState(false);
  const [valOutput, setValOutput] = useState<string | null>(null);

  const runValidation = async () => {
    setValidating(true);
    try {
      const res = await fetch('http://localhost:8000/api/validate');
      const data = await res.json();
      setValOutput(data.output);
    } catch (e: any) {
      setValOutput(`Validation call failed: ${e.message}`);
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-textMain tracking-tight">System Settings & Health Status</h2>
          <p className="text-xs text-textMuted mt-0.5">
            Diagnostics for local Ollama, embedding engines, SQLite databases, and persistent vector store.
          </p>
        </div>
        <button
          onClick={onRefreshHealth}
          className="px-3 py-1.5 rounded-xl bg-surfaceHighlight hover:bg-surfaceHighlight/80 text-textMain text-xs font-semibold border border-surfaceBorder flex items-center gap-2 transition-all shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Check Diagnostics
        </button>
      </div>

      {/* Component Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Local LLM Engine */}
        <div className="p-5 rounded-2xl bg-surface border border-surfaceBorder space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-textMain flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" /> Local Reasoning Model
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Active
            </span>
          </div>
          <div className="text-xs font-mono text-textMuted">
            Model: <span className="text-textMain font-bold">{health?.llm_model || 'qwen2.5:3b'}</span>
          </div>
          <div className="text-xs font-mono text-textMuted">
            Ollama Endpoint: <span className="text-textMain">{health?.ollama_url || 'http://localhost:11434'}</span>
          </div>
          <p className="text-[11px] text-textMuted pt-1">
            Running 100% locally on your machine with zero internet dependencies or paid API keys.
          </p>
        </div>

        {/* Local Embedding Engine */}
        <div className="p-5 rounded-2xl bg-surface border border-surfaceBorder space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-textMain flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" /> Vector Database & Embeddings
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Chroma Persistent
            </span>
          </div>
          <div className="text-xs font-mono text-textMuted">
            Model: <span className="text-textMain font-bold">{health?.embedding_model || 'nomic-embed-text'}</span> (768 dims)
          </div>
          <div className="text-xs font-mono text-textMuted">
            Indexed Chunks: <span className="text-textMain font-bold">{health?.chroma_chunks_count ?? 24} Chunks</span>
          </div>
          <p className="text-[11px] text-textMuted pt-1">
            Persisted locally in <code className="text-primary font-mono">ta2/data/chroma_db</code>.
          </p>
        </div>

        {/* SQLite Checkpointer */}
        <div className="p-5 rounded-2xl bg-surface border border-surfaceBorder space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-textMain flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" /> Short-Term Checkpoint Store
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              SQLite WAL
            </span>
          </div>
          <div className="text-xs font-mono text-textMuted">
            Database: <span className="text-textMain font-bold">ta2/data/checkpoints.sqlite</span>
          </div>
          <p className="text-[11px] text-textMuted pt-1">
            Persists LangGraph thread state for conversational continuity across turns.
          </p>
        </div>

        {/* SQLite Long-Term Store */}
        <div className="p-5 rounded-2xl bg-surface border border-surfaceBorder space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-textMain flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" /> Long-Term User Profile Store
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Persistent
            </span>
          </div>
          <div className="text-xs font-mono text-textMuted">
            Database: <span className="text-textMain font-bold">ta2/data/long_term_memory.sqlite</span>
          </div>
          <p className="text-[11px] text-textMuted pt-1">
            Stores user namespaces (`profile`, `recipe_preferences`) surviving server restarts.
          </p>
        </div>
      </div>

      {/* Baseline Diagnostic Test */}
      <div className="p-6 rounded-2xl bg-surface border border-surfaceBorder space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-textMain flex items-center gap-2">
              <Terminal className="w-4 h-4 text-primary" /> Run Baseline Defensive Validation Tests
            </h3>
            <p className="text-xs text-textMuted mt-0.5">
              Executes edge-case mathematical tests (division by zero, negative amounts) in memory.
            </p>
          </div>
          <button
            onClick={runValidation}
            disabled={validating}
            className="px-3.5 py-1.5 rounded-xl bg-surfaceHighlight hover:bg-surfaceHighlight/80 text-textMain text-xs font-semibold border border-surfaceBorder flex items-center gap-2 transition-all shadow-sm"
          >
            {validating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Terminal className="w-3.5 h-3.5" />}
            Run Validation
          </button>
        </div>

        {valOutput && (
          <div className="p-4 rounded-xl bg-background border border-surfaceBorder font-mono text-xs text-textMain/90 whitespace-pre-wrap">
            {valOutput}
          </div>
        )}
      </div>
    </div>
  );
}
