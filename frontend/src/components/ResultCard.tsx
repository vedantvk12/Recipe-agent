import { motion } from 'framer-motion'
import type { TraceStep } from '../App'

export default function ResultCard({ answer, trace }: { answer: string, trace: TraceStep[] }) {
  // Extract values if possible
  let scaledAmount = null
  let totalCalories = null

  trace.forEach(t => {
    if (t.tool === 'scale_recipe' && t.result.scaled_amount) {
      scaledAmount = t.result.scaled_amount
    }
    if (t.tool === 'estimate_calories' && t.result.estimated_calories) {
      totalCalories = t.result.estimated_calories
    }
  })

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-surfaceHighlight border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden mt-6"
    >
      <div className="absolute top-0 right-0 p-32 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10">
        <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
          Final Result
        </h2>

        {/* Extracted Metrics */}
        {(scaledAmount !== null || totalCalories !== null) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            {scaledAmount !== null && (
              <div className="bg-[#0a0a0b]/80 border border-white/5 rounded-2xl p-6">
                <h4 className="text-textMuted text-sm font-medium mb-2 flex items-center gap-2">
                  <span className="text-xl"></span> Scaled Amount
                </h4>
                <p className="text-3xl font-bold text-white">{scaledAmount} <span className="text-lg text-white/50 font-normal">Units</span></p>
              </div>
            )}
            {totalCalories !== null && (
              <div className="bg-[#0a0a0b]/80 border border-white/5 rounded-2xl p-6">
                <h4 className="text-textMuted text-sm font-medium mb-2 flex items-center gap-2">
                  <span className="text-xl">🔥</span> Total Calories
                </h4>
                <p className="text-3xl font-bold text-white">{totalCalories} <span className="text-lg text-white/50 font-normal">kcal</span></p>
              </div>
            )}
          </div>
        )}

        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 text-lg text-white/90 leading-relaxed font-medium">
          {answer}
        </div>
      </div>
    </motion.div>
  )
}
