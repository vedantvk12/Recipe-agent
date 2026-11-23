import { useState } from 'react';
import {
  GitBranch,
  ShieldCheck,
  Scale,
  Flame,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  UserCheck,
  XCircle,
  Clock
} from 'lucide-react';
import type { TraceStep } from '../api/client';
import { apiClient } from '../api/client';

interface TraceExplorerTabProps {
  trace: TraceStep[];
  threadId: string;
  onRefreshApprovals: () => void;
}

export default function TraceExplorerTab({ trace, threadId, onRefreshApprovals }: TraceExplorerTabProps) {
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({});

  const toggleExpand = (step: number) => {
    setExpandedSteps((prev) => ({ ...prev, [step]: !prev[step] }));
  };

  const handleResolve = async (ticketId: string, decision: 'approved' | 'rejected') => {
    await apiClient.resolveApproval(ticketId, decision);
    onRefreshApprovals();
  };

  const getAgentIcon = (agentName?: string) => {
    if (!agentName) return <GitBranch className="w-4 h-4 text-primary" />;
    if (agentName.includes('Critic')) return <ShieldCheck className="w-4 h-4 text-indigo-400" />;
    if (agentName.includes('Recipe') || agentName.includes('Scaling')) return <Scale className="w-4 h-4 text-blue-400" />;
    if (agentName.includes('Nutrition')) return <Flame className="w-4 h-4 text-orange-400" />;
    return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'success':
      case 'passed':
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" /> {status}
          </span>
        );
      case 'pending_approval':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse">
            <Clock className="w-3 h-3" /> Needs Human Approval
          </span>
        );
      case 'missing_info':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <AlertTriangle className="w-3 h-3" /> Intercepted (Missing Info)
          </span>
        );
      case 'blocked':
      case 'rejected':
      case 'error':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3 h-3" /> {status}
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surfaceHighlight text-textMuted border border-surfaceBorder">
            {status || 'executed'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-textMain tracking-tight">Agent Execution & Trace Explorer</h2>
          <p className="text-xs text-textMuted mt-0.5">
            Observable timeline of Supervisor routing decisions, agent handoffs, tool payloads, and safety checkpoints.
          </p>
        </div>
        <div className="text-xs font-mono text-textMuted px-3 py-1 bg-surface border border-surfaceBorder rounded-lg">
          Active Thread: <span className="text-emerald-400 font-bold">{threadId}</span>
        </div>
      </div>

      {trace.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-surface border border-surfaceBorder">
          <GitBranch className="w-10 h-10 text-textMuted mx-auto mb-3 opacity-40" />
          <h3 className="text-sm font-semibold text-textMain">No Trace Events Recorded Yet</h3>
          <p className="text-xs text-textMuted mt-1 max-w-sm mx-auto">
            Execute a recipe in Recipe Studio or trigger an evaluation run to view detailed step-by-step agent decisions.
          </p>
        </div>
      ) : (
        <div className="relative pl-6 space-y-4 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-surfaceBorder">
          {trace.map((step) => {
            const isExpanded = expandedSteps[step.step];
            const hasPayload = step.arguments || step.result || step.details;
            return (
              <div key={step.step} className="relative">
                {/* Dot */}
                <div className="absolute -left-6 top-4 w-6 h-6 rounded-full bg-surface border-2 border-primary flex items-center justify-center -translate-x-1/2">
                  <span className="text-[10px] font-bold text-primary">{step.step}</span>
                </div>

                {/* Card */}
                <div className="p-4 rounded-xl bg-surface border border-surfaceBorder transition-all hover:border-surfaceBorder/80">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-surfaceHighlight/60 border border-surfaceBorder">
                        {getAgentIcon(step.agent)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-textMain">{step.agent || 'Agent Step'}</h4>
                          <span className="text-[10px] text-textMuted font-mono">({step.action})</span>
                        </div>
                        {step.details && (
                          <p className="text-xs text-textMuted mt-0.5">{step.details}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {getStatusBadge(step.status)}
                      {hasPayload && (
                        <button
                          onClick={() => toggleExpand(step.step)}
                          className="p-1 text-textMuted hover:text-textMain"
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Pending Approval Ticket Interactive Actions */}
                  {step.status === 'pending_approval' && step.ticket_id && (
                    <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                      <div className="text-xs text-amber-200">
                        Authorization needed for Ticket: <span className="font-mono font-bold">{step.ticket_id}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleResolve(step.ticket_id!, 'approved')}
                          className="px-2.5 py-1 rounded bg-emerald-500 hover:bg-emerald-600 text-slate-900 text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                        >
                          <UserCheck className="w-3 h-3" /> Approve
                        </button>
                        <button
                          onClick={() => handleResolve(step.ticket_id!, 'rejected')}
                          className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold border border-rose-500/30 transition-all flex items-center gap-1"
                        >
                          <XCircle className="w-3 h-3" /> Reject
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Expanded JSON Inspector */}
                  {isExpanded && (
                    <div className="mt-4 pt-3 border-t border-surfaceBorder/60 grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] font-mono">
                      {step.arguments && (
                        <div className="p-3 rounded-lg bg-background border border-surfaceBorder">
                          <span className="text-textMuted font-bold block mb-1">TOOL ARGUMENTS:</span>
                          <pre className="text-textMain/80 whitespace-pre-wrap overflow-x-auto">
                            {JSON.stringify(step.arguments, null, 2)}
                          </pre>
                        </div>
                      )}
                      {step.result && (
                        <div className="p-3 rounded-lg bg-background border border-surfaceBorder">
                          <span className="text-textMuted font-bold block mb-1">STRUCTURED RESULT:</span>
                          <pre className="text-emerald-400/90 whitespace-pre-wrap overflow-x-auto">
                            {JSON.stringify(step.result, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
