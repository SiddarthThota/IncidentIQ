import { Search, CornerDownRight, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react'
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
      <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-6 space-y-3">
        <div className="flex items-center gap-2 text-blue-400">
          <AlertCircle className="w-5 h-5" />
          <h3 className="text-base font-semibold">Autonomous Follow-up Investigation</h3>
        </div>
        <p className="text-xs text-blue-200/90 leading-relaxed">
          Investigation stopped because the reasoning provider was temporarily unavailable.
          Prior evidence from initial search rounds has been strictly preserved.
        </p>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'EXECUTED':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
      case 'PENDING':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
      case 'FAILED':
        return 'text-destructive bg-destructive/10 border-destructive/20'
      case 'NO_RESULTS':
        return 'text-muted-foreground bg-muted border-border'
      default:
        return 'text-muted-foreground bg-muted border-border'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground tracking-tight flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Autonomous Iterative Follow-Up Investigation
          </h2>
          <p className="text-xs text-muted-foreground">
            Dynamic follow-up search loop triggered by unresolved open questions and discovered leads
          </p>
        </div>
        <span className="text-xs font-mono text-muted-foreground px-2 py-0.5 rounded bg-muted border border-border">
          {iterationCount || 1} Iterations Completed
        </span>
      </div>

      <div className="space-y-6">
        {/* Iteration 1: Initial Retrieval */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                Iteration 1
              </span>
              <h3 className="text-xs font-semibold text-foreground">
                Initial Corpus Retrieval & Decomposition
              </h3>
            </div>
            <span className="text-xs font-mono text-emerald-500 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Initial Search Complete
            </span>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Decomposed original query into normalized intent. Queried vector and metadata index to retrieve initial seed documents.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50 text-xs text-muted-foreground">
            <span>Evidence gathered:</span>
            <span className="font-mono font-semibold text-foreground">
              {evidence.length} chunks
            </span>
            {openQuestions.length > 0 && (
              <>
                <span className="text-border">•</span>
                <span>Open questions identified:</span>
                <span className="font-mono font-semibold text-foreground">
                  {openQuestions.length} questions
                </span>
              </>
            )}
          </div>
        </div>

        {/* Subsequent Iterations */}
        {followUpQueries.length > 0 ? (
          followUpQueries.map((query, idx) => {
            return (
              <div
                key={query.id || idx}
                className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-3 ml-2 sm:ml-6 relative before:absolute before:-left-4 before:top-6 before:bottom-0 before:w-[2px] before:bg-border/60"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
                      Iteration {query.iteration || 2}
                    </span>
                    <span
                      className={`font-mono text-[10px] font-semibold px-2 py-0.5 rounded border uppercase ${getStatusBadge(
                        query.status
                      )}`}
                    >
                      {query.status}
                    </span>
                  </div>

                  {query.priority && (
                    <span className="font-mono text-[10px] text-muted-foreground uppercase">
                      Priority: {query.priority}
                    </span>
                  )}
                </div>

                {/* Query executed */}
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase text-muted-foreground font-semibold">
                    Generated Follow-Up Search Query
                  </span>
                  <div className="p-2.5 rounded bg-muted/40 border border-border/70 font-mono text-xs text-foreground flex items-center gap-2">
                    <Search className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>"{query.query_text}"</span>
                  </div>
                </div>

                {/* Reason / Hypothesis */}
                {query.reason && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Hypothesis / Rationale: </span>
                    {query.reason}
                  </div>
                )}

                {/* Discovered evidence links */}
                {query.retrieved_result_ids && query.retrieved_result_ids.length > 0 && (
                  <div className="pt-2 border-t border-border/50 flex flex-wrap items-center gap-2 text-xs">
                    <CornerDownRight className="w-3.5 h-3.5 text-primary" />
                    <span className="text-muted-foreground">Retrieved evidence IDs:</span>
                    <div className="flex flex-wrap gap-1">
                      {query.retrieved_result_ids.map((resId, rIdx) => (
                        <span
                          key={rIdx}
                          className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-muted text-foreground border border-border"
                        >
                          {String(resId).slice(0, 8)}...
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        ) : (
          <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
            No autonomous follow-up queries required; initial search yielded sufficient evidence.
          </div>
        )}
      </div>
    </div>
  )
}
