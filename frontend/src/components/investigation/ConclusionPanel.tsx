import { ShieldAlert, AlertTriangle, Info, CheckCircle2, FileText, HelpCircle, Activity, Shield } from 'lucide-react'
import type { InvestigationConclusion, InvestigationFinding } from '../../types/investigation'

interface ConclusionPanelProps {
  conclusion: InvestigationConclusion | null | undefined
  findings?: InvestigationFinding[]
  onSelectDocument?: (documentId: string, sourceLabel?: string) => void
}

export function ConclusionPanel({ conclusion, findings = [], onSelectDocument }: ConclusionPanelProps) {
  if (!conclusion) return null

  const {
    conclusion_status,
    confidence,
    summary,
    uncertainty_notes,
    unresolved_questions,
    source_references,
  } = conclusion

  // Check if any findings are temporal or if summary has temporal relationship
  const hasTemporalFinding = findings.some(
    f => f.classification === 'TEMPORAL' || f.statement.toLowerCase().includes('temporal')
  )

  const isInsufficient = conclusion_status === 'INSUFFICIENT'
  const isProviderLimited = conclusion_status === 'PROVIDER_LIMITED'

  // Status Badge configurations
  const getStatusConfig = () => {
    switch (conclusion_status) {
      case 'SUPPORTED':
        return {
          title: 'Investigation Supported',
          badgeClass: 'bg-success-background text-success border-success/30 shadow-sm',
          containerClass: 'bg-success-background/30 border-success/20',
          icon: <CheckCircle2 className="w-6 h-6 text-success" />,
        }
      case 'PARTIALLY_SUPPORTED':
        return {
          title: 'Partially Supported',
          badgeClass: 'bg-warning-background text-warning border-warning/30 shadow-sm',
          containerClass: 'bg-warning-background/30 border-warning/20',
          icon: <AlertTriangle className="w-6 h-6 text-warning" />,
        }
      case 'INSUFFICIENT':
        return {
          title: 'Insufficient Evidence',
          badgeClass: 'bg-warning-background text-warning border-warning/30 shadow-sm',
          containerClass: 'bg-warning-background/30 border-warning/20',
          icon: <HelpCircle className="w-6 h-6 text-warning" />,
        }
      case 'CONTRADICTED':
        return {
          title: 'Contradictory Guidance Detected',
          badgeClass: 'bg-destructive-background text-destructive border-destructive/30 shadow-sm',
          containerClass: 'bg-destructive-background/30 border-destructive/20',
          icon: <ShieldAlert className="w-6 h-6 text-destructive" />,
        }
      case 'PROVIDER_LIMITED':
        return {
          title: 'Provider Limited Fallback',
          badgeClass: 'bg-primary-light text-primary border-primary/30 shadow-sm',
          containerClass: 'bg-primary-light/30 border-primary/20',
          icon: <Activity className="w-6 h-6 text-primary" />,
        }
      default:
        return {
          title: conclusion_status,
          badgeClass: 'bg-muted text-muted-foreground border-border',
          containerClass: 'bg-card border-border',
          icon: <Info className="w-6 h-6 text-muted-foreground" />,
        }
    }
  }

  const statusConfig = getStatusConfig()

  return (
    <div className={`relative rounded-2xl border p-1 shadow-sm ${statusConfig.containerClass} overflow-hidden group`}>
      <div className="relative rounded-xl bg-card border border-border/50 p-6 sm:p-8 space-y-8">

        {/* Conclusion Status Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-border/50 pb-6">
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-background border border-border shadow-sm">
              {statusConfig.icon}
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-primary font-bold">
                TRACEABLE CONCLUSION
              </span>
              <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
                {statusConfig.title}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className={`font-mono text-[10px] font-bold px-3 py-1.5 rounded-full border uppercase tracking-wider ${statusConfig.badgeClass}`}>
              {conclusion_status}
            </span>
            <span className="font-mono text-[10px] font-bold px-3 py-1.5 rounded-full border uppercase tracking-wider bg-primary-light text-primary border-primary/30 shadow-sm">
              CONFIDENCE: {confidence}
            </span>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            Executive Answer
          </h3>
          <div className="text-lg leading-relaxed text-foreground font-medium">
            {summary}
          </div>
        </div>

        {/* Conditional Special Callouts */}
        <div className="space-y-4">
          {/* Causation Warning Banner */}
          {hasTemporalFinding && (
            <div className="rounded-xl border border-warning/40 bg-warning-background p-5 flex items-start gap-4 shadow-sm relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-warning" />
              <AlertTriangle className="w-6 h-6 text-warning shrink-0" />
              <div className="space-y-1.5">
                <h4 className="text-sm font-bold tracking-tight text-warning">
                  TEMPORAL RELATIONSHIP
                </h4>
                <p className="text-sm text-warning/90 leading-relaxed font-medium">
                  Temporal association established. Causation was not established by the available evidence.<br/>
                  <span className="text-warning/70">Chronological proximity does not constitute definitive proof of root-cause impact.</span>
                </p>
              </div>
            </div>
          )}

          {/* Insufficient Evidence Notice */}
          {isInsufficient && (
            <div className="rounded-xl border border-border bg-muted p-5 flex items-start gap-4">
              <Shield className="w-6 h-6 text-muted-foreground shrink-0" />
              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-foreground">Insufficient Evidence Grounding</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  IncidentIQ identified that the knowledge corpus does not contain sufficient verified documents or direct telemetry
                  to reach a definitive conclusion for this inquiry. Insufficient evidence is a valid, safe operational conclusion.
                </p>
              </div>
            </div>
          )}

          {/* Provider-Limited Notice */}
          {isProviderLimited && (
            <div className="rounded-xl border border-warning/40 bg-warning-background p-5 flex items-start gap-4">
              <Activity className="w-6 h-6 text-warning shrink-0" />
              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-warning">AI Provider Temporarily Unavailable</h4>
                <p className="text-sm text-warning/90 leading-relaxed">
                  Investigation could not complete the final LLM reasoning step because the AI provider was temporarily unavailable.
                  Any evidence already collected has been preserved deterministically.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* What We Could Not Prove Section */}
        {(uncertainty_notes || (unresolved_questions && unresolved_questions.length > 0)) && (
          <div className="rounded-xl border border-warning/30 bg-warning-background/50 p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-warning flex items-center gap-2">
              <HelpCircle className="w-4 h-4" />
              What The Evidence Does Not Prove
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {uncertainty_notes && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-warning/80">
                    Uncertainty Notes
                  </h4>
                  <p className="text-sm text-warning-foreground leading-relaxed">
                    {uncertainty_notes}
                  </p>
                </div>
              )}
              {unresolved_questions && unresolved_questions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-warning/80">
                    Unresolved Questions
                  </h4>
                  <ul className="text-sm text-warning-foreground space-y-2 list-disc pl-4">
                    {unresolved_questions.map((q, idx) => (
                      <li key={idx} className="leading-relaxed">{q}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Visual Evidence Chain Placeholder (Would be mapped from findings in full version) */}
        {findings && findings.length > 0 && (
          <div className="pt-6 border-t border-border/50">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
              Why We Believe This
            </h3>
            <div className="flex flex-col gap-2 relative">
              <div className="absolute left-3.5 top-2 bottom-2 w-px bg-border z-0" />
              {findings.slice(0,3).map((f, i) => (
                <div key={i} className="flex items-start gap-4 relative z-10 group">
                  <div className="w-7 h-7 rounded-full bg-card border-2 border-primary flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-primary/20 transition-colors">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="bg-background/50 border border-border/50 rounded-lg p-3 text-sm text-muted-foreground flex-1">
                    {f.statement}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Source References Strip */}
        {source_references && source_references.length > 0 && (
          <div className="pt-6 border-t border-border/50">
            <div className="flex items-center gap-3">
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                SOURCES
              </h4>
              <div className="flex flex-wrap items-center gap-2">
                {source_references.map((src, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (src.document_id && onSelectDocument) {
                        onSelectDocument(src.document_id, src.source_label)
                      }
                    }}
                    disabled={!src.document_id || !onSelectDocument}
                    className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20 hover:bg-accent/20 hover:border-accent/40 transition-all disabled:opacity-50"
                  >
                    <FileText className="w-3.5 h-3.5 text-accent group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-mono font-semibold text-foreground">
                      {src.source_label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
