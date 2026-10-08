import { ShieldAlert, AlertTriangle, Info, CheckCircle2, FileText, HelpCircle, Activity } from 'lucide-react'
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
          badgeClass: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
          containerClass: 'border-emerald-500/30 bg-emerald-500/5',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
        }
      case 'PARTIALLY_SUPPORTED':
        return {
          title: 'Partially Supported',
          badgeClass: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
          containerClass: 'border-amber-500/30 bg-amber-500/5',
          icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
        }
      case 'INSUFFICIENT':
        return {
          title: 'Insufficient Evidence',
          badgeClass: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
          containerClass: 'border-amber-500/30 bg-amber-500/5',
          icon: <HelpCircle className="w-5 h-5 text-amber-500" />,
        }
      case 'CONTRADICTED':
        return {
          title: 'Contradictory Guidance Detected',
          badgeClass: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
          containerClass: 'border-purple-500/30 bg-purple-500/5',
          icon: <ShieldAlert className="w-5 h-5 text-purple-400" />,
        }
      case 'PROVIDER_LIMITED':
        return {
          title: 'Provider Limited Fallback',
          badgeClass: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
          containerClass: 'border-blue-500/30 bg-blue-500/5',
          icon: <Activity className="w-5 h-5 text-blue-400" />,
        }
      default:
        return {
          title: conclusion_status,
          badgeClass: 'bg-muted text-muted-foreground border-border',
          containerClass: 'border-border bg-card',
          icon: <Info className="w-5 h-5 text-muted-foreground" />,
        }
    }
  }

  const statusConfig = getStatusConfig()

  // Confidence badge color
  const getConfidenceBadge = (conf: string) => {
    switch (conf) {
      case 'HIGH':
        return 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
      case 'MEDIUM':
        return 'bg-amber-500/15 text-amber-500 border-amber-500/30'
      case 'LOW':
        return 'bg-destructive/15 text-destructive border-destructive/30'
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  return (
    <div className={`rounded-xl border p-6 shadow-sm space-y-6 ${statusConfig.containerClass}`}>
      {/* Conclusion Status Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border/70">
        <div className="flex items-center gap-3">
          {statusConfig.icon}
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-ai">
              TRACEABLE CONCLUSION
            </span>
            <h2 className="text-xl font-bold text-foreground tracking-tight">
              {statusConfig.title}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Evidence-backed answer with an auditable reasoning trail
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Badge */}
          <span
            className={`font-mono text-xs font-semibold px-3 py-1 rounded-full border uppercase tracking-wider ${statusConfig.badgeClass}`}
          >
            Status: {conclusion_status}
          </span>

          {/* Confidence Badge */}
          <span
            className={`font-mono text-xs font-semibold px-3 py-1 rounded-full border uppercase tracking-wider ${getConfidenceBadge(
              confidence
            )}`}
          >
            Confidence: {confidence}
          </span>
        </div>
      </div>

      {/* Causation Warning Banner (Phase 6 / AGENTS.md requirement) */}
      {hasTemporalFinding && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-3 text-amber-500">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-semibold tracking-tight text-amber-400">
              Causation Boundary Notice
            </h4>
            <p className="text-xs text-amber-200/90 leading-relaxed">
              Temporal association established. Causation was not established by the available evidence.
              Chronological proximity does not constitute definitive proof of root-cause impact.
            </p>
          </div>
        </div>
      )}

      {/* Insufficient Evidence Notice */}
      {isInsufficient && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 space-y-2">
          <div className="flex items-center gap-2 text-amber-400">
            <HelpCircle className="w-5 h-5" />
            <h4 className="text-sm font-semibold">Insufficient Evidence Grounding</h4>
          </div>
          <p className="text-xs text-amber-200/90 leading-relaxed">
            IncidentIQ identified that the knowledge corpus does not contain sufficient verified documents or direct telemetry
            to reach a definitive conclusion for this inquiry. Insufficient evidence is a valid, safe operational conclusion.
          </p>
        </div>
      )}

      {/* Provider-Limited Notice */}
      {isProviderLimited && (
        <div className="rounded-lg border border-blue-500/40 bg-blue-500/10 p-4 space-y-2">
          <div className="flex items-center gap-2 text-blue-400">
            <Activity className="w-5 h-5" />
            <h4 className="text-sm font-semibold">AI Provider Availability Notice</h4>
          </div>
          <p className="text-xs text-blue-200/90 leading-relaxed">
            Investigation could not complete the final LLM reasoning step because the AI provider was temporarily unavailable.
            All evidence already retrieved, relationships, and chronological events have been fully preserved deterministically.
          </p>
        </div>
      )}

      {/* Executive Summary */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Executive Summary
        </h3>
        <div className="rounded-lg bg-card/80 border border-border p-5 text-sm leading-relaxed text-foreground whitespace-pre-wrap font-sans">
          {summary}
        </div>
      </div>

      {/* Uncertainty & Open Questions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Uncertainty Notes */}
        {uncertainty_notes && (
          <div className="rounded-lg border border-border bg-card/60 p-4 space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              Uncertainty & Boundary Notes
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {uncertainty_notes}
            </p>
          </div>
        )}

        {/* Unresolved Questions */}
        {unresolved_questions && unresolved_questions.length > 0 && (
          <div className="rounded-lg border border-border bg-card/60 p-4 space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-primary" />
              Unresolved Follow-Up Questions
            </h4>
            <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-4">
              {unresolved_questions.map((q, idx) => (
                <li key={idx} className="leading-relaxed">
                  {q}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Source References */}
      {source_references && source_references.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border/70">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            Verified Source References ({source_references.length})
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
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-secondary hover:bg-secondary/80 border border-border text-xs font-mono font-medium text-foreground transition-colors disabled:cursor-default"
                title={src.document_id ? `Click to view ${src.source_label}` : undefined}
              >
                <FileText className="w-3 h-3 text-primary" />
                {src.source_label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
