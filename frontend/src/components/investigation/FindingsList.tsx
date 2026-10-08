import { CheckCircle2, Shield, AlertTriangle, HelpCircle, Layers, FileText } from 'lucide-react'
import type { InvestigationFinding, SourceReference } from '../../types/investigation'

interface FindingsListProps {
  findings: InvestigationFinding[]
  sourceReferences?: SourceReference[]
  onSelectDocument?: (documentId: string, sourceLabel?: string) => void
}

export function FindingsList({ findings, sourceReferences = [], onSelectDocument }: FindingsListProps) {
  if (!findings || findings.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center text-muted-foreground text-sm">
        No structured findings extracted for this investigation.
      </div>
    )
  }

  // Classification styling helper
  const getClassificationBadge = (cls: string) => {
    switch (cls) {
      case 'DIRECT':
        return {
          label: 'DIRECT EVIDENCE',
          className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        }
      case 'CORROBORATED':
        return {
          label: 'CORROBORATED',
          className: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
          icon: <Layers className="w-3.5 h-3.5" />,
        }
      case 'TEMPORAL':
        return {
          label: 'TEMPORAL ASSOCIATION',
          className: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
          icon: <AlertTriangle className="w-3.5 h-3.5" />,
        }
      case 'INFERRED':
        return {
          label: 'INFERRED (LOW CERTAINTY)',
          className: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
          icon: <Shield className="w-3.5 h-3.5" />,
        }
      case 'CONTRADICTED':
        return {
          label: 'CONTRADICTED',
          className: 'bg-destructive/15 text-destructive border-destructive/30',
          icon: <AlertTriangle className="w-3.5 h-3.5" />,
        }
      case 'INSUFFICIENT':
        return {
          label: 'INSUFFICIENT',
          className: 'bg-muted text-muted-foreground border-border',
          icon: <HelpCircle className="w-3.5 h-3.5" />,
        }
      default:
        return {
          label: cls,
          className: 'bg-muted text-muted-foreground border-border',
          icon: <Shield className="w-3.5 h-3.5" />,
        }
    }
  }

  const getConfidenceBadge = (conf: string) => {
    switch (conf) {
      case 'HIGH':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
      case 'MEDIUM':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
      case 'LOW':
        return 'text-destructive bg-destructive/10 border-destructive/20'
      default:
        return 'text-muted-foreground bg-muted border-border'
    }
  }

  const getSourceLabel = (docId: string) => {
    const ref = sourceReferences.find(sr => sr.document_id === docId)
    return ref?.source_label || docId.slice(0, 8) + '...'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-ai" />
            EVIDENCE SYNTHESIS
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            How the investigation connected and evaluated the evidence
          </p>
        </div>
        <span className="text-xs font-mono text-muted-foreground px-2 py-0.5 rounded bg-muted border border-border">
          {findings.length} Findings
        </span>
      </div>

      <div className="grid gap-3">
        {findings.map((finding, idx) => {
          const badge = getClassificationBadge(finding.classification)
          const confClass = getConfidenceBadge(finding.confidence)

          return (
            <div
              key={finding.id || idx}
              className="rounded-lg border border-border bg-card p-4 transition-all hover:border-border/80 shadow-xs space-y-3"
            >
              {/* Badges Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${badge.className}`}
                  >
                    {badge.icon}
                    {badge.label}
                  </span>

                  <span
                    className={`font-mono text-[10px] font-medium px-2 py-0.5 rounded border uppercase ${confClass}`}
                  >
                    Confidence: {finding.confidence}
                  </span>
                </div>

                {finding.classification === 'TEMPORAL' && (
                  <span className="text-[10px] font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    Temporal precedence; not causal
                  </span>
                )}
              </div>

              {/* Statement */}
              <p className="text-sm font-medium text-foreground leading-relaxed">
                {finding.statement}
              </p>

              {/* Reasoning Basis */}
              {finding.reasoning_basis && (
                <div className="text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-md border border-border/60">
                  <span className="font-semibold text-foreground/80">Evidentiary Basis: </span>
                  {finding.reasoning_basis}
                </div>
              )}

              {/* Linked Document IDs */}
              {finding.document_ids && finding.document_ids.length > 0 && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] font-medium text-muted-foreground">Source IDs:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {finding.document_ids.map((docId, dIdx) => (
                      <button
                        key={dIdx}
                        onClick={() => onSelectDocument && onSelectDocument(String(docId))}
                        disabled={!onSelectDocument}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted/60 hover:bg-muted text-[11px] font-mono text-primary border border-border transition-colors disabled:cursor-default"
                        title="Click to view verified source"
                      >
                        <FileText className="w-3 h-3 text-primary" />
                        {getSourceLabel(String(docId))}
                      </button>
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
