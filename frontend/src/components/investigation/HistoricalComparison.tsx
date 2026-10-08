import { History, GitCompare, FileText, ShieldCheck } from 'lucide-react'
import type { InvestigationRelationship, InvestigationEvidence } from '../../types/investigation'

interface HistoricalComparisonProps {
  relationships: InvestigationRelationship[]
  evidence: InvestigationEvidence[]
  onSelectDocument?: (documentId: string, sourceLabel?: string) => void
}

export function HistoricalComparison({
  relationships,
  evidence,
  onSelectDocument,
}: HistoricalComparisonProps) {
  // Find relationships that refer to similar incidents or historical relations
  const historicalRels = relationships.filter(
    r =>
      r.relationship_type === 'SIMILAR_INCIDENT' ||
      r.relationship_type === 'SAME_FAILURE_TYPE' ||
      (r.explanation && r.explanation.toLowerCase().includes('historical'))
  )

  if (historicalRels.length === 0) {
    return null
  }

  const findEv = (id: string) => evidence.find(e => String(e.id) === String(id))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground tracking-tight">
              Historical Incident Correlation & Comparison
            </h2>
            <p className="text-xs text-muted-foreground">
              Cross-incident pattern matching with strict boundary distinction between Similar Incidents and Exact Matches
            </p>
          </div>
        </div>
        <span className="text-xs font-mono text-blue-400 font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
          {historicalRels.length} Historical Correlation{historicalRels.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="grid gap-4">
        {historicalRels.map((rel, idx) => {
          const srcEv = findEv(rel.source_evidence_id)
          const targetEv = findEv(rel.target_evidence_id)

          return (
            <div
              key={rel.id || idx}
              className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-5 shadow-xs space-y-4"
            >
              {/* Header Badge */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1.5">
                    <GitCompare className="w-3.5 h-3.5" />
                    SIMILAR INCIDENT (ANALOGOUS PATTERN)
                  </span>

                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border">
                    NOT AN EXACT MATCH
                  </span>
                </div>

                {rel.confidence !== null && rel.confidence !== undefined && (
                  <span className="font-mono text-xs text-muted-foreground">
                    Similarity Match: {(rel.confidence * 100).toFixed(0)}%
                  </span>
                )}
              </div>

              {/* Correlation Explanation */}
              <div className="p-3.5 rounded-lg bg-card/80 border border-border/80 text-xs text-foreground font-medium leading-relaxed">
                <span className="text-blue-400 font-semibold">Incident Comparison: </span>
                {rel.explanation ||
                  'Historical incident exhibits comparable failure symptoms under similar operational conditions.'}
              </div>

              {/* Side by side comparison cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {/* Active Incident Evidence */}
                <div className="rounded-lg border border-border bg-card p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-primary" />
                      Current Incident Context
                    </span>
                    {srcEv && (
                      <button
                        onClick={() =>
                          onSelectDocument &&
                          onSelectDocument(String(srcEv.document_id), srcEv.source ?? undefined)
                        }
                        className="font-mono text-xs text-primary hover:underline font-semibold"
                      >
                        {srcEv.source || 'Active Source'}
                      </button>
                    )}
                  </div>
                  {srcEv?.source_text && (
                    <p className="text-xs text-muted-foreground font-mono bg-muted/40 p-2.5 rounded border border-border/50 line-clamp-3">
                      "{srcEv.source_text}"
                    </p>
                  )}
                </div>

                {/* Historical Incident Evidence */}
                <div className="rounded-lg border border-border bg-card p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground flex items-center gap-1">
                      <History className="w-3.5 h-3.5 text-blue-400" />
                      Historical Postmortem / Reference
                    </span>
                    {targetEv && (
                      <button
                        onClick={() =>
                          onSelectDocument &&
                          onSelectDocument(String(targetEv.document_id), targetEv.source ?? undefined)
                        }
                        className="font-mono text-xs text-blue-400 hover:underline font-semibold"
                      >
                        {targetEv.source || 'Historical Source'}
                      </button>
                    )}
                  </div>
                  {targetEv?.source_text && (
                    <p className="text-xs text-muted-foreground font-mono bg-muted/40 p-2.5 rounded border border-border/50 line-clamp-3">
                      "{targetEv.source_text}"
                    </p>
                  )}
                </div>
              </div>

              {/* Guardrail Callout */}
              <div className="rounded bg-muted/30 p-2.5 text-[11px] text-muted-foreground border border-border/50 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  InvestigationIQ distinguishes analogous patterns from exact identity. Historical remediation steps provide context but must be verified against current service architecture and version.
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
