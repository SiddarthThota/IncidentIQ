import { HelpCircle, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react'
import type { InvestigationOpenQuestion } from '../../types/investigation'

interface OpenQuestionsListProps {
  questions: InvestigationOpenQuestion[]
  onSelectDocument?: (documentId: string, sourceLabel?: string) => void
}

export function OpenQuestionsList({ questions }: OpenQuestionsListProps) {
  if (!questions || questions.length === 0) {
    return null
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return {
          label: 'RESOLVED',
          className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.15)]',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
        }
      case 'OPEN':
        return {
          label: 'OPEN',
          className: 'bg-primary/10 text-primary border-primary/30 shadow-[0_0_8px_rgba(168,85,247,0.15)]',
          icon: <HelpCircle className="w-3.5 h-3.5 text-primary" />,
        }
      case 'UNRESOLVED':
        return {
          label: 'UNRESOLVED',
          className: 'bg-warning/10 text-warning border-warning/30 shadow-[0_0_8px_rgba(245,158,11,0.15)]',
          icon: <AlertCircle className="w-3.5 h-3.5 text-warning" />,
        }
      case 'SKIPPED':
        return {
          label: 'SKIPPED',
          className: 'bg-muted/50 text-muted-foreground border-border',
          icon: null,
        }
      case 'BLOCKED':
        return {
          label: 'BLOCKED',
          className: 'bg-destructive/10 text-destructive border-destructive/30 shadow-[0_0_8px_rgba(244,63,94,0.15)]',
          icon: <ShieldAlert className="w-3.5 h-3.5 text-destructive" />,
        }
      default:
        return {
          label: status,
          className: 'bg-muted/50 text-muted-foreground border-border',
          icon: null,
        }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md py-2 z-10">
        <div>
          <h2 className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-primary" />
            Open Questions
          </h2>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground px-2 py-0.5 rounded-full bg-background border border-border font-bold">
          {questions.length} QUESTIONS
        </span>
      </div>

      <div className="grid gap-4">
        {questions.map((q, idx) => {
          const badge = getStatusBadge(q.status)

          return (
            <div
              key={q.id || idx}
              className="rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm p-4 transition-all hover:border-primary/40 hover:bg-card/60 shadow-sm space-y-4 relative group overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />

              {/* Question Header & Status */}
              <div className="flex flex-wrap items-center justify-between gap-2 relative z-10">
                <span
                  className={`inline-flex items-center gap-1.5 font-mono text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-widest ${badge.className}`}
                >
                  {badge.icon}
                  {badge.label}
                </span>

                {q.generated_at && (
                  <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase tracking-widest bg-background/50 px-2 py-0.5 rounded border border-border/30">
                    {new Date(q.generated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                )}
              </div>

              {/* Question Text */}
              <h4 className="text-sm font-semibold text-foreground leading-relaxed relative z-10">
                "{q.question}"
              </h4>

              {/* Why it matters */}
              {(q.why_it_matters || q.reason) && (
                <div className="text-[11px] text-muted-foreground bg-background/50 p-3 rounded-lg border border-border/40 relative z-10 leading-relaxed font-mono">
                  <span className="font-bold text-foreground/80 uppercase tracking-widest text-[9px] block mb-1">RELEVANCE</span>
                  {q.why_it_matters || q.reason}
                </div>
              )}

              {/* Resolution details if resolved */}
              {q.status === 'RESOLVED' && (
                <div className="text-[11px] text-emerald-400 bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20 space-y-1 relative z-10 font-mono leading-relaxed">
                  <span className="font-bold text-emerald-300 uppercase tracking-widest text-[9px] block mb-1">RESOLUTION</span>
                  <p className="text-emerald-200/90">
                    {q.resolution_reason || 'Corroborating evidence chunk located during follow-up query.'}
                  </p>
                </div>
              )}

              {/* Supporting evidence IDs */}
              {q.supporting_evidence_ids && q.supporting_evidence_ids.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/40 text-[10px] uppercase font-bold tracking-widest relative z-10">
                  <span className="text-muted-foreground">EVIDENCE IDs:</span>
                  <div className="flex flex-wrap gap-1">
                    {q.supporting_evidence_ids.map((id, sIdx) => (
                      <span
                        key={sIdx}
                        className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground border border-border"
                      >
                        {String(id).slice(0, 8)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
