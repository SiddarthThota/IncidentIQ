import { Search, CornerDownRight, CheckCircle2, AlertCircle, Activity } from 'lucide-react'
import type { InvestigationFollowUpQuery, InvestigationOpenQuestion, InvestigationEvidence } from '../../types/investigation'

interface FollowUpSectionProps {
  iterationCount: number
  followUpQueries: InvestigationFollowUpQuery[]
  openQuestions: InvestigationOpenQuestion[]
  evidence: InvestigationEvidence[]
  isProviderLimited?: boolean
  onSelectDocument?: (documentId: string, sourceLabel?: string) => void
}

export function FollowUpSection({
  iterationCount,
  followUpQueries,
  openQuestions,
  evidence,
  isProviderLimited,
}: FollowUpSectionProps) {
  // If provider failed during follow-up
  if (isProviderLimited && followUpQueries.length === 0 && iterationCount <= 1) {
    return (
      <div className="rounded-xl border border-warning/30 bg-warning/5 p-5 space-y-3 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-warning/10 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />
        <div className="flex items-center gap-2 text-warning relative z-10">
          <AlertCircle className="w-5 h-5" />
          <h3 className="text-sm font-bold uppercase tracking-widest">Autonomous Follow-up Paused</h3>
        </div>
        <p className="text-xs text-warning/80 leading-relaxed font-mono relative z-10">
          Investigation stopped because the reasoning provider was temporarily unavailable.
          Prior evidence from initial search rounds has been strictly preserved.
        </p>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'EXECUTED':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.15)]'
      case 'PENDING':
        return 'text-warning bg-warning/10 border-warning/20 shadow-[0_0_8px_rgba(245,158,11,0.15)]'
      case 'FAILED':
        return 'text-destructive bg-destructive/10 border-destructive/20 shadow-[0_0_8px_rgba(244,63,94,0.15)]'
      case 'NO_RESULTS':
        return 'text-muted-foreground bg-muted border-border'
      default:
        return 'text-muted-foreground bg-muted border-border'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md py-2 z-10">
        <div>
          <h2 className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Autonomous Follow-up
          </h2>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground px-2 py-0.5 rounded-full bg-background border border-border font-bold">
          {iterationCount || 1} ITERATIONS
        </span>
      </div>

      <div className="space-y-4 relative before:absolute before:left-3 before:top-4 before:bottom-4 before:w-px before:bg-gradient-to-b before:from-primary/50 before:via-border before:to-transparent">
        {/* Iteration 1: Initial Retrieval */}
        <div className="pl-8 relative">
          <div className="absolute left-[-1px] top-1.5 w-6 h-6 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center shadow-[0_0_10px_rgba(168,85,247,0.3)]">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          </div>
          <div className="rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm p-4 shadow-sm space-y-3 group hover:border-primary/40 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[9px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 tracking-widest uppercase">
                  Iteration 1
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-500 flex items-center gap-1 font-bold uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" /> Initial Search
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Decomposed original query into normalized intent. Queried vector and metadata index to retrieve initial seed documents.
            </p>

            <div className="flex flex-col gap-1.5 pt-3 border-t border-border/40 text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
              <div className="flex justify-between items-center bg-background/50 p-1.5 rounded border border-border/30">
                <span>Evidence Gathered:</span>
                <span className="font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">{evidence.length} CHUNKS</span>
              </div>
              {openQuestions.length > 0 && (
                <div className="flex justify-between items-center bg-background/50 p-1.5 rounded border border-border/30">
                  <span>Open Questions:</span>
                  <span className="font-mono text-accent bg-accent/10 px-1.5 py-0.5 rounded border border-accent/20">{openQuestions.length} ITEMS</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Subsequent Iterations */}
        {followUpQueries.length > 0 ? (
          followUpQueries.map((query, idx) => {
            return (
              <div
                key={query.id || idx}
                className="pl-8 relative"
              >
                <div className="absolute left-[-1px] top-1.5 w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                </div>
                <div className="rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm p-4 shadow-sm space-y-4 group hover:border-border transition-colors">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[9px] font-bold px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground border border-border tracking-widest uppercase">
                        Iteration {query.iteration || 2}
                      </span>
                      <span
                        className={`font-mono text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-widest ${getStatusBadge(
                          query.status
                        )}`}
                      >
                        {query.status}
                      </span>
                    </div>

                    {query.priority && (
                      <span className="font-mono text-[9px] font-bold px-2 py-0.5 rounded bg-background border border-border text-muted-foreground uppercase tracking-widest">
                        PRIORITY: {query.priority}
                      </span>
                    )}
                  </div>

                  {/* Query executed */}
                  <div className="space-y-1.5 relative z-10">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Generated Search Query
                    </span>
                    <div className="p-3 rounded-lg bg-background/60 border border-border/50 font-mono text-[11px] text-foreground flex items-center gap-2 shadow-inner">
                      <Search className="w-4 h-4 text-primary shrink-0 opacity-70" />
                      <span className="opacity-90">"{query.query_text}"</span>
                    </div>
                  </div>

                  {/* Reason / Hypothesis */}
                  {query.reason && (
                    <div className="text-[11px] text-muted-foreground bg-background/40 p-3 rounded-lg border border-border/30 relative z-10 leading-relaxed font-mono">
                      <span className="font-bold text-foreground/80 uppercase tracking-widest text-[9px] block mb-1">HYPOTHESIS</span>
                      {query.reason}
                    </div>
                  )}

                  {/* Discovered evidence links */}
                  {query.retrieved_result_ids && query.retrieved_result_ids.length > 0 && (
                    <div className="pt-3 border-t border-border/40 flex flex-wrap items-center gap-2 text-[10px] uppercase font-bold tracking-widest">
                      <CornerDownRight className="w-3.5 h-3.5 text-primary" />
                      <span className="text-muted-foreground">Retrieved IDs:</span>
                      <div className="flex flex-wrap gap-1">
                        {query.retrieved_result_ids.map((resId, rIdx) => (
                          <span
                            key={rIdx}
                            className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground border border-border"
                          >
                            {String(resId).slice(0, 8)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        ) : (
          <div className="pl-8 relative">
             <div className="absolute left-[3px] top-3 w-4 h-4 rounded-full bg-background border border-border flex items-center justify-center">
                <span className="w-1 h-1 rounded-full bg-border" />
             </div>
            <div className="rounded-xl border border-dashed border-border/60 bg-background/30 p-4 text-center text-xs text-muted-foreground font-mono">
              Initial search yielded sufficient evidence. No follow-up queries required.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}