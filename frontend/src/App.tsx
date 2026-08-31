import { useState } from 'react'
import Header from './components/Header'
import RecipeInput from './components/RecipeInput'
import AgentTrace from './components/AgentTrace'
import ResultCard from './components/ResultCard'

export type TraceStep = {
  step: number
  tool: string
  arguments: Record<string, any>
  result: Record<string, any>
}

export type ApiResponse = {
  success: boolean
  final_answer: string
  trace: TraceStep[]
}

function App() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [response, setResponse] = useState<ApiResponse | null>(null)

  const handleRunAgent = async (question: string) => {
    if (!question.trim()) {
      setError("Please enter a recipe request.")
      return
    }

    setLoading(true)
    setError(null)
    setResponse(null)

    try {
      const res = await fetch('http://localhost:8000/api/recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      })

      if (!res.ok) {
        throw new Error("Unable to connect to the Python AI Agent. Please make sure FastAPI and Ollama are running.")
      }

      const data = await res.json()
      if (data.success) {
        setResponse(data)
      } else {
        setError(data.detail || "Unknown error occurred.")
      }
    } catch (err: any) {
      setError("Unable to connect to the Python AI Agent.\n\nPlease make sure:\n1. FastAPI is running.\n2. Ollama is running.\n3. qwen2.5:3b is installed.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-textMain pb-12 font-sans selection:bg-primary/30">
      <Header />

      <main className="max-w-5xl mx-auto px-4 pt-10 flex flex-col gap-8">
        {/* Hero Section */}
        <section className="text-center flex flex-col items-center gap-4 py-8">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
            🍳 Recipe Scaler & Nutrition Estimator
          </h1>
          <p className="text-textMuted max-w-2xl text-lg">
            An Autonomous AI Agent that scales recipes and estimates nutrition using intelligent multi-tool reasoning.
          </p>
          <div className="flex gap-3 mt-4 flex-wrap justify-center">
            <span className="px-3 py-1 bg-surfaceHighlight rounded-full text-sm font-medium border border-white/5 flex items-center gap-1.5"><span className="text-xl"></span> LangGraph Agent</span>
            <span className="px-3 py-1 bg-surfaceHighlight rounded-full text-sm font-medium border border-white/5 flex items-center gap-1.5"><span className="text-xl"></span> Two Tools</span>
            <span className="px-3 py-1 bg-surfaceHighlight rounded-full text-sm font-medium border border-white/5 flex items-center gap-1.5"><span className="text-xl"></span> Autonomous Reasoning</span>
          </div>
        </section>

        {/* Input Section */}
        <RecipeInput onRun={handleRunAgent} loading={loading} />

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-6 rounded-2xl flex flex-col gap-2">
            <h3 className="font-semibold text-lg flex items-center gap-2">⚠️ Error</h3>
            <pre className="whitespace-pre-wrap font-sans opacity-90">{error}</pre>
          </div>
        )}

        {/* Trace Section */}
        {response && response.trace && response.trace.length > 0 && (
          <AgentTrace trace={response.trace} />
        )}

        {/* Final Result */}
        {response && response.final_answer && (
          <ResultCard answer={response.final_answer} trace={response.trace} />
        )}

      </main>
    </div>
  )
}

export default App
