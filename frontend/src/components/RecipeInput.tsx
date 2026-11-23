import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type RecipeInputProps = {
  onRun: (question: string) => void
  loading: boolean
}

export default function RecipeInput({ onRun, loading }: RecipeInputProps) {
  const [question, setQuestion] = useState('')

  const example1 = "A recipe serves 4 people and uses 2 cups of flour.\nScale it to serve 8 people.\nEach cup contains 455 calories.\nCalculate the calories for the scaled amount."
  const example2 = "A recipe serves 3 people and uses 5 cups of rice.\nScale the recipe to serve 9 people.\nEach cup of rice contains 200 calories.\nCalculate the total calories for the scaled amount."

  return (
    <div className="bg-surface border border-white/5 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />

      <div className="flex flex-col gap-6 relative z-10">
        <div>
          <h2 className="text-2xl font-semibold text-white mb-2">Ask Your Recipe Agent</h2>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setQuestion(example1)}
              className="text-xs px-3 py-1.5 rounded-full bg-surfaceHighlight hover:bg-white/10 transition-colors border border-white/5 text-textMuted hover:text-white"
            >
              Flour Scaling
            </button>
            <button
              onClick={() => setQuestion(example2)}
              className="text-xs px-3 py-1.5 rounded-full bg-surfaceHighlight hover:bg-white/10 transition-colors border border-white/5 text-textMuted hover:text-white"
            >
              Rice Scaling
            </button>
          </div>
        </div>

        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Example:\n\nA recipe serves 4 people and uses 2 cups of flour.\nScale it to serve 8 people.\nEach cup of flour contains 455 calories.\nCalculate the calories for the scaled amount."
          className="w-full h-40 bg-[#0a0a0b]/50 border border-white/10 rounded-2xl p-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none transition-all"
        />

        <div className="flex justify-end">
          <button
            onClick={() => onRun(question)}
            disabled={loading}
            className="group relative px-6 py-3 bg-primary hover:bg-primaryHover disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all shadow-[0_0_20px_-5px_rgba(79,70,229,0.5)] overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Agent Reasoning...
                </>
              ) : (
                <>
                  Run AI Agent
                </>
              )}
            </span>
          </button>
        </div>

        {/* Loading overlay details */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex flex-col gap-2"
            >
              <div className="flex items-center gap-2 text-primary font-medium">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Executing autonomous workflow...</span>
              </div>
              <div className="pl-6 flex flex-col gap-1 text-sm text-textMuted">
                <span className="flex items-center gap-2">✓ Analyzing recipe request</span>
                <span className="flex items-center gap-2 text-white/40 animate-pulse">Selecting tools...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}
