import { motion } from 'framer-motion'
import type { TraceStep } from '../api/client'
import { CheckCircle2, Wrench, Flame, ArrowDown } from 'lucide-react'

export default function AgentTrace({ trace }: { trace: TraceStep[] }) {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-semibold text-white px-2"> Autonomous Agent Execution</h2>

      <div className="flex flex-col items-center max-w-2xl mx-auto w-full">
        {trace.map((step, index) => (
          <div key={index} className="w-full flex flex-col items-center">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              className="w-full bg-surface border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-primary/50 group-hover:bg-primary transition-colors" />

              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-white/5 p-2 rounded-lg">
                    {step.tool === 'scale_recipe' ? <Wrench className="w-5 h-5 text-blue-400" /> : <Flame className="w-5 h-5 text-orange-400" />}
                  </div>
                  <div>
                    <span className="text-xs text-textMuted uppercase tracking-wider font-semibold">Step {step.step}</span>
                    <h3 className="text-lg font-medium text-white">{step.tool}</h3>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-green-400 bg-green-500/10 px-2.5 py-1 rounded-md">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Tool Executed
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#0a0a0b]/50 rounded-xl p-4 border border-white/5">
                  <h4 className="text-xs text-textMuted uppercase tracking-wider mb-3">Arguments</h4>
                  <ul className="space-y-2">
                    {Object.entries(step.arguments || {}).map(([k, v]) => (
                      <li key={k} className="flex justify-between text-sm">
                        <span className="text-white/60 capitalize">{k.replace(/_/g, ' ')}</span>
                        <span className="text-white font-medium">{String(v)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                  <h4 className="text-xs text-primary/70 uppercase tracking-wider mb-3">Result</h4>
                  <ul className="space-y-2">
                    {Object.entries(step.result || {}).map(([k, v]) => {
                      if (k === 'status') return null;
                      return (
                        <li key={k} className="flex flex-col text-sm">
                          <span className="text-primary/60 capitalize mb-1">{k.replace(/_/g, ' ')}</span>
                          <span className="text-xl text-primary font-semibold">{String(v)}</span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </div>
            </motion.div>

            {index < trace.length - 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.2 + 0.1 }}
                className="py-4 text-white/20"
              >
                <ArrowDown className="w-6 h-6 animate-bounce" />
              </motion.div>
            )}

          </div>
        ))}
      </div>
    </div>
  )
}
