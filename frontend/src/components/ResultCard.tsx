import { motion } from 'framer-motion'
import type { TraceStep } from '../api/client'

export default function ResultCard({ answer, trace }: { answer: string, trace: TraceStep[] }) {
  let scaledAmount: number | null = null
  let totalCalories: number | null = null
  let caloriesPerUnit: number | null = null

  trace.forEach(t => {
    const res = typeof t.result === 'object' && t.result !== null ? (t.result as Record<string, any>) : null
    if (t.tool === 'scale_recipe' && res?.scaled_amount) {
      scaledAmount = res.scaled_amount
    }
    if (t.tool === 'estimate_calories') {
      if (res?.estimated_calories) {
        totalCalories = res.estimated_calories
      }
      if (t.arguments?.calories_per_unit) {
        caloriesPerUnit = t.arguments.calories_per_unit
      }
    }
  })

  const hasDetailedMetrics = scaledAmount !== null && caloriesPerUnit !== null && totalCalories !== null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-surfaceHighlight border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden mt-6"
    >
      <div className="absolute top-0 right-0 p-32 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10">
        <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
          Final Result
        </h2>

        {hasDetailedMetrics ? (
          <div className="flex flex-col gap-6">
            <div className="bg-[#0a0a0b]/80 border border-white/5 rounded-2xl p-6 shadow-inner">
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center text-lg">
                  <span className="text-textMuted font-medium">Scaled Amount</span>
                  <span className="text-white font-semibold">{scaledAmount}</span>
                </div>
                <div className="h-[1px] w-full bg-white/5" />
                <div className="flex justify-between items-center text-lg">
                  <span className="text-textMuted font-medium">Calories Per Unit</span>
                  <span className="text-white font-semibold">{caloriesPerUnit} kcal</span>
                </div>
              </div>
            </div>

            <div className="bg-[#0a0a0b]/60 border border-white/5 rounded-2xl p-8 text-center shadow-inner">
              <h4 className="text-textMuted text-sm uppercase tracking-[0.2em] font-semibold mb-6">Formula</h4>
              <div className="text-3xl font-mono text-white/90 font-medium">
                {scaledAmount} × {caloriesPerUnit} = <span className="text-primary font-bold">{totalCalories} kcal</span>
              </div>
            </div>

            <div className="bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30 rounded-2xl p-6 flex items-center justify-center gap-4 shadow-[0_0_30px_rgba(var(--color-primary),0.1)]">
              <div className="bg-primary text-background rounded-full p-1 border-2 border-primary/50">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-white">Estimated Calories: {totalCalories} kcal</span>
            </div>

            <div className="mt-4 bg-white/5 border border-white/10 rounded-2xl p-6 text-base text-white/70 leading-relaxed">
              <div className="text-sm text-textMuted font-semibold mb-2 uppercase tracking-wider">Agent Response</div>
              {answer}
            </div>
          </div>
        ) : (
          <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 text-lg text-white/90 leading-relaxed font-medium">
            {answer}
          </div>
        )}
      </div>
    </motion.div>
  )
}
