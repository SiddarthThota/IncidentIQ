import { ShieldAlert, FileText, Zap } from 'lucide-react'
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-destructive-background text-destructive rounded-xl border border-destructive/30 shadow-sm">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">
              Contradictions Detected
            </h2>
            <p className="text-[11px] font-mono text-muted-foreground mt-0.5 opacity-80">
              Neutral comparative analysis preserving all source contexts
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono text-destructive font-bold px-3 py-1 rounded-full bg-destructive-background border border-destructive/30 uppercase tracking-widest shadow-sm">
          {contradictions.length} CONFLICT{contradictions.length > 1 ? 'S' : ''}
        </span>
      </div>

      <div className="grid gap-6">
        {contradictions.map((contra, idx) => {
          const ev1 = findEvidence(contra.evidence_1_id)
          const ev2 = findEvidence(contra.evidence_2_id)

          return (
            <div
              key={contra.id || idx}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6 relative overflow-hidden group hover:border-destructive/50 hover:shadow-md transition-all"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-destructive-background rounded-full blur-2xl pointer-events-none -mr-10 -mt-10 group-hover:bg-destructive/10 transition-colors" />

              <div className="flex items-center justify-between relative z-10 border-b border-border pb-4">
                <span className="font-mono text-[10px] uppercase tracking-widest text-destructive font-bold flex items-center gap-2">
                  <Zap className="w-4 h-4 text-destructive" />
                  Semantic Contradiction #{idx + 1}
                </span>
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-destructive-background text-destructive border border-destructive/30">
                  STATUS: {contra.status}
                </span>
              </div>

              {/* Conflicting Claims Summary */}
              <div className="rounded-xl bg-background/50 border border-border/60 text-sm text-foreground font-medium leading-relaxed p-4 relative z-10 shadow-sm border-l-4 border-l-destructive">
                <span className="text-destructive font-bold uppercase tracking-wider text-[10px] block mb-2 opacity-80">Conflict Description</span>
                {contra.conflicting_claims}
              </div>

              {/* Side-by-side Evidence Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                {/* Source A */}
                <div className="rounded-xl border border-border/60 bg-background/60 p-4 space-y-3 shadow-inner hover:bg-background/80 transition-colors">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-border/50">
                    <span className="font-bold text-foreground flex items-center gap-2 uppercase tracking-widest text-[10px]">
                      <FileText className="w-3.5 h-3.5 text-primary" />
                      PERSPECTIVE A
                    </span>
                    {ev1 && (
                      <button
                        onClick={() =>
                          onSelectDocument && onSelectDocument(String(ev1.document_id), ev1.source ?? undefined)
                        }
                        className="font-mono text-[10px] text-primary hover:text-primary/80 font-bold uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded border border-primary/20"
                      >
                        VIEW DOC
                      </button>
                    )}
                  </div>
                  {ev1?.source_text && (
                    <p className="text-xs text-muted-foreground font-mono leading-relaxed line-clamp-4">
                      "{ev1.source_text}"
                    </p>
                  )}
                </div>

                {/* Source B */}
                <div className="rounded-xl border border-border/60 bg-background/60 p-4 space-y-3 shadow-inner hover:bg-background/80 transition-colors">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-border/50">
                    <span className="font-bold text-foreground flex items-center gap-2 uppercase tracking-widest text-[10px]">
                      <FileText className="w-3.5 h-3.5 text-accent" />
                      PERSPECTIVE B
                    </span>
                    {ev2 && (
                      <button
                        onClick={() =>
                          onSelectDocument && onSelectDocument(String(ev2.document_id), ev2.source ?? undefined)
                        }
                        className="font-mono text-[10px] text-accent hover:text-accent/80 font-bold uppercase tracking-wider bg-accent/10 px-2 py-0.5 rounded border border-accent/20"
                      >
                        VIEW DOC
                      </button>
                    )}
                  </div>
                  {ev2?.source_text && (
                    <p className="text-xs text-muted-foreground font-mono leading-relaxed line-clamp-4">
                      "{ev2.source_text}"
                    </p>
                  )}
                </div>
              </div>

              {/* Context / Applicability Info */}
              {contra.context_info && (
                <div className="rounded-xl bg-muted/40 p-4 text-xs text-muted-foreground border border-border/50 flex flex-col gap-1.5 relative z-10">
                  <span className="font-bold uppercase tracking-widest text-foreground text-[10px]">Operational Context & Resolution:</span>
                  <span className="leading-relaxed">{contra.context_info}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}