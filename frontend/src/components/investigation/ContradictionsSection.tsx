import { ShieldAlert, ArrowLeftRight, FileText } from 'lucide-react'
import type { InvestigationContradiction, InvestigationEvidence } from '../../types/investigation'

interface ContradictionsSectionProps {
  contradictions: InvestigationContradiction[]
  evidence: InvestigationEvidence[]
  onSelectDocument?: (documentId: string, sourceLabel?: string) => void
}

export function ContradictionsSection({
  contradictions,
  evidence,
  onSelectDocument,
}: ContradictionsSectionProps) {
  if (!contradictions || contradictions.length === 0) {
    return null
  }

  // Helper to find evidence info
  const findEvidence = (evId: string) => {
    return evidence.find(e => String(e.id) === String(evId))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-purple-500/10 text-purple-400 rounded-lg">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground tracking-tight">
              Conflicting Evidence & Guidance Detected
            </h2>
            <p className="text-xs text-muted-foreground">
              Neutral comparative analysis preserving all source contexts without arbitrary suppression
            </p>
          </div>
        </div>
        <span className="text-xs font-mono text-purple-400 font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20">
          {contradictions.length} Conflict{contradictions.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="grid gap-4">
        {contradictions.map((contra, idx) => {
          const ev1 = findEvidence(contra.evidence_1_id)
          const ev2 = findEvidence(contra.evidence_2_id)

          return (
            <div
              key={contra.id || idx}
              className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-5 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-wider text-purple-400 font-bold flex items-center gap-1.5">
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  Direct Semantic Contradiction #{idx + 1}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Status: {contra.status}
                </span>
              </div>

              {/* Conflicting Claims Summary */}
              <div className="p-3 rounded-lg bg-card/80 border border-border/80 text-xs text-foreground font-medium leading-relaxed">
                <span className="text-purple-400 font-semibold">Conflict Description: </span>
                {contra.conflicting_claims}
              </div>

              {/* Side-by-side Evidence Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {/* Source A */}
                <div className="rounded-lg border border-border bg-card p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-primary" />
                      Perspective A
                    </span>
                    {ev1 && (
                      <button
                        onClick={() =>
                          onSelectDocument && onSelectDocument(String(ev1.document_id), ev1.source ?? undefined)
                        }
                        className="font-mono text-xs text-primary hover:underline font-semibold"
                      >
                        {ev1.source || `ID: ${String(ev1.document_id).slice(0, 8)}`}
                      </button>
                    )}
                  </div>
                  {ev1?.source_text && (
                    <p className="text-xs text-muted-foreground font-mono bg-muted/40 p-2.5 rounded border border-border/50 line-clamp-4">
                      "{ev1.source_text}"
                    </p>
                  )}
                </div>

                {/* Source B */}
                <div className="rounded-lg border border-border bg-card p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-teal-400" />
                      Perspective B
                    </span>
                    {ev2 && (
                      <button
                        onClick={() =>
                          onSelectDocument && onSelectDocument(String(ev2.document_id), ev2.source ?? undefined)
                        }
                        className="font-mono text-xs text-teal-400 hover:underline font-semibold"
                      >
                        {ev2.source || `ID: ${String(ev2.document_id).slice(0, 8)}`}
                      </button>
                    )}
                  </div>
                  {ev2?.source_text && (
                    <p className="text-xs text-muted-foreground font-mono bg-muted/40 p-2.5 rounded border border-border/50 line-clamp-4">
                      "{ev2.source_text}"
                    </p>
                  )}
                </div>
              </div>

              {/* Context / Applicability Info */}
              {contra.context_info && (
                <div className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-md border border-border/60">
                  <span className="font-semibold text-foreground">Operational Context & Resolution Note: </span>
                  {contra.context_info}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
