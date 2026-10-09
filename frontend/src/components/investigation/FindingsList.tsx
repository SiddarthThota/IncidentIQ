import { CheckCircle2, Shield, AlertTriangle, HelpCircle, FileText, Target } from 'lucide-react'
import type { InvestigationFinding, SourceReference } from '../../types/investigation'

interface FindingsListProps {
  findings: InvestigationFinding[]
  sourceReferences?: SourceReference[]
  onSelectDocument?: (documentId: string, sourceLabel?: string) => void
}

export function FindingsList({ findings, sourceReferences = [], onSelectDocument }: FindingsListProps) {
  if (!findings || findings.length === 0) {
    return null
  }

  // Classification styling helper
  const getClassificationBadge = (cls: string) => {
    switch (cls) {
      case 'DIRECT':
        return {
          label: 'DIRECT',
          className: 'bg-success-background text-success border-success/30 shadow-sm',
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        }
      case 'CORROBORATED':
        return {
          label: 'CORROBORATED',
          className: 'bg-primary-light text-primary border-primary/30 shadow-sm',
          icon: <Target className="w-3.5 h-3.5" />,
        }
      case 'TEMPORAL':
        return {
          label: 'TEMPORAL',
          className: 'bg-warning-background text-warning border-warning/30 shadow-sm',
          icon: <AlertTriangle className="w-3.5 h-3.5" />,
        }
      case 'INFERRED':
        return {
          label: 'INFERRED',
          className: 'bg-primary-light text-primary border-primary/30 shadow-sm',
          icon: <Shield className="w-3.5 h-3.5" />,
        }
      case 'CONTRADICTED':
        return {
          label: 'CONTRADICTED',
          className: 'bg-destructive-background text-destructive border-destructive/30 shadow-sm',
          icon: <AlertTriangle className="w-3.5 h-3.5" />,
        }
      case 'INSUFFICIENT':
        return {
          label: 'INSUFFICIENT',
          className: 'bg-muted text-muted-foreground border-border shadow-sm',
          icon: <HelpCircle className="w-3.5 h-3.5" />,
        }
      default:
        return {
          label: cls,
          className: 'bg-muted text-muted-foreground border-border shadow-sm',
          icon: <Shield className="w-3.5 h-3.5" />,
        }
    }
  }

  const getSourceLabel = (docId: string) => {
    const ref = sourceReferences.find(sr => sr.document_id === docId)
    return ref?.source_label || docId.slice(0, 8) + '...'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md py-2 z-10">
        <div>
          <h2 className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            Extracted Findings
          </h2>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground px-2 py-0.5 rounded-full bg-background border border-border font-bold">
          {findings.length} FINDINGS
        </span>
      </div>

      <div className="grid gap-4">
        {findings.map((finding, idx) => {
          const badge = getClassificationBadge(finding.classification)

          return (
            <div
              key={finding.id || idx}
              className="rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-md shadow-sm space-y-3 relative group overflow-hidden"
            >
              {/* Badges Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 relative z-10">
                <span
                  className={`inline-flex items-center gap-1.5 font-mono text-[9px] font-bold px-2 py-0.5 rounded-full border tracking-widest ${badge.className}`}
                >
                  {badge.icon}
                  {badge.label}
                </span>

                {finding.classification === 'TEMPORAL' && (
                  <span className="text-[9px] font-bold uppercase tracking-widest text-warning bg-warning-background px-2 py-0.5 rounded border border-warning/20">
                    Not Causal
                  </span>
                )}
              </div>

              {/* Statement */}
              <p className="text-sm font-medium text-foreground leading-relaxed relative z-10">
                {finding.statement}
              </p>

              {/* Reasoning Basis */}
              {finding.reasoning_basis && (
                <div className="text-xs text-muted-foreground bg-card-subtle p-3 rounded-lg border border-border relative z-10 font-mono leading-relaxed">
                  <span className="font-bold text-foreground uppercase tracking-widest text-[10px] block mb-1">Basis</span>
                  {finding.reasoning_basis}
                </div>
              )}

              {/* Linked Document IDs */}
              {finding.document_ids && finding.document_ids.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-2 relative z-10">
                  {finding.document_ids.map((docId, dIdx) => (
                    <button
                      key={dIdx}
                      onClick={() => onSelectDocument && onSelectDocument(String(docId))}
                      disabled={!onSelectDocument}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-primary-light hover:bg-primary/20 text-[10px] font-mono text-primary font-bold tracking-wider border border-primary/20 transition-colors disabled:cursor-default"
                      title="Click to view verified source"
                    >
                      <FileText className="w-3 h-3 text-primary" />
                      {getSourceLabel(String(docId))}
                    </button>
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
