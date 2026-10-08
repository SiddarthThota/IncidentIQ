import { HelpCircle, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react'
import type { InvestigationOpenQuestion } from '../../types/investigation'

interface OpenQuestionsListProps {
  questions: InvestigationOpenQuestion[]
  onSelectDocument?: (documentId: string, sourceLabel?: string) => void
}

export function OpenQuestionsList({ questions }: OpenQuestionsListProps) {
  if (!questions || questions.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center text-muted-foreground text-sm">
        No open investigation questions formulated.
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return {
          label: 'RESOLVED',
          className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
        }
      case 'OPEN':
        return {
          label: 'OPEN FOR INVESTIGATION',
          className: 'bg-primary/15 text-primary border-primary/30',
          icon: <HelpCircle className="w-3.5 h-3.5 text-primary" />,
        }
      case 'UNRESOLVED':
        return {
          label: 'UNRESOLVED (EVIDENCE DEFICIT)',
          className: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
          icon: <AlertCircle className="w-3.5 h-3.5 text-amber-500" />,
        }
      case 'SKIPPED':
        return {
          label: 'SKIPPED',
          className: 'bg-muted text-muted-foreground border-border',
          icon: null,
        }
      case 'BLOCKED':
        return {
          label: 'BLOCKED',
          className: 'bg-destructive/15 text-destructive border-destructive/30',
          icon: <ShieldAlert className="w-3.5 h-3.5 text-destructive" />,
        }
      default:
        return {
          label: status,
          className: 'bg-muted text-muted-foreground border-border',
          icon: null,
        }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground tracking-tight">
            Investigation Inquiries & Open Questions
          </h2>
          <p className="text-xs text-muted-foreground">
            Formulated inquiries that drive targeted follow-up retrieval and gap identification
          </p>
        </div>
        <span className="text-xs font-mono text-muted-foreground px-2 py-0.5 rounded bg-muted border border-border">
          {questions.length} Inquiries
        </span>
      </div>

      <div className="grid gap-3">
        {questions.map((q, idx) => {
          const badge = getStatusBadge(q.status)

          return (
            <div
              key={q.id || idx}
              className="rounded-lg border border-border bg-card p-4 transition-all hover:border-border/80 shadow-xs space-y-3"
            >
              {/* Question Header & Status */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold px-2.5 py-0.5 rounded-full border uppercase ${badge.className}`}
                >
                  {badge.icon}
                  {badge.label}
                </span>

                {q.generated_at && (
                  <span className="text-[11px] font-mono text-muted-foreground">
                    Formulated: {new Date(q.generated_at).toLocaleTimeString()}
                  </span>
                )}
              </div>

              {/* Question Text */}
              <h4 className="text-sm font-semibold text-foreground leading-snug">
                "{q.question}"
              </h4>

              {/* Why it matters */}
              {(q.why_it_matters || q.reason) && (
                <div className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-md border border-border/50">
                  <span className="font-semibold text-foreground/80">Investigation Relevance: </span>
                  {q.why_it_matters || q.reason}
                </div>
              )}

              {/* Resolution details if resolved */}
              {q.status === 'RESOLVED' && (
                <div className="text-xs text-emerald-400 bg-emerald-500/10 p-2.5 rounded-md border border-emerald-500/20 space-y-1">
                  <span className="font-semibold text-emerald-300">Resolution Reason: </span>
                  <p className="text-emerald-200/90 leading-relaxed">
                    {q.resolution_reason || 'Corroborating evidence chunk located during follow-up query.'}
                  </p>
                </div>
              )}

              {/* Supporting evidence IDs */}
              {q.supporting_evidence_ids && q.supporting_evidence_ids.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs text-muted-foreground">
                  <span className="text-[11px] font-medium">Supporting Evidence:</span>
                  {q.supporting_evidence_ids.map((id, sIdx) => (
                    <span
                      key={sIdx}
                      className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-muted text-foreground border border-border"
                    >
                      {String(id).slice(0, 8)}...
                    </span>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
