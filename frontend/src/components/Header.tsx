// Header Component

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🍳</span>
          <div className="flex flex-col">
            <span className="font-semibold text-lg leading-tight text-white tracking-tight">RecipeAI</span>
            <span className="text-[10px] text-textMuted uppercase tracking-wider font-medium">Autonomous Scaling Agent</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="hidden md:inline-block text-xs text-textMuted">Powered by LangGraph + Ollama</span>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs font-medium text-green-400">Agent Online</span>
          </div>
        </div>
      </div>
    </header>
  )
}
