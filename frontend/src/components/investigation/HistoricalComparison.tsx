import { GitCompare, History, Database, AlertTriangle, FileText } from 'lucide-react'
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
  if (!relationships || relationships.length === 0) {
    return null
  }

  const findEvidence = (evId: string) => {
    return evidence.find(e => String(e.id) === String(evId))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/10 text-accent rounded-xl border border-accent/20 shadow-inner">
            <GitCompare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">
              Historical Correlation
            </h2>
            <p className="text-[11px] font-mono text-muted-foreground mt-0.5 opacity-80">
              Pattern matching against prior resolved incidents
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {relationships.map((rel, idx) => {
          const ev1 = findEvidence(rel.source_evidence_id)
          const ev2 = findEvidence(rel.target_evidence_id)
          const isSimilar = rel.relationship_type.includes('SIMILAR')

          return (
            <div
              key={idx}
              className="rounded-2xl border border-accent/30 bg-card/40 backdrop-blur-md p-6 shadow-[0_8px_30px_rgba(0,0,0,0.12)] space-y-6 relative overflow-hidden group hover:border-accent/50 transition-colors"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10 group-hover:bg-accent/20 transition-colors" />

              <div className="flex flex-wrap items-center justify-between gap-4 relative z-10 border-b border-border/50 pb-4">
                <span className="font-mono text-[10px] uppercase tracking-widest text-accent font-bold flex items-center gap-2">
                  <Database className="w-4 h-4 text-accent" />
                  Historical Record Analysis
                </span>
                <div className="flex gap-2">
                   <span className="text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-accent/10 text-accent border border-accent/30 flex items-center gap-1.5">
                    <History className="w-3 h-3" />
                    {rel.relationship_type.replace(/_/g, ' ')}
                  </span>
                  {isSimilar && (
                    <span className="text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-warning/10 text-warning border border-warning/30 flex items-center gap-1.5">
                      <AlertTriangle className="w-3 h-3" />
                      NOT AN EXACT MATCH
                    </span>
                  )}
                </div>
              </div>

              {/* Explanation Summary */}
              <div className="rounded-xl bg-background/50 border border-border/60 text-sm text-foreground font-medium leading-relaxed p-4 relative z-10 shadow-sm border-l-4 border-l-accent">
                <span className="text-accent font-bold uppercase tracking-wider text-[10px] block mb-2 opacity-80">Correlation Rationale</span>
                {rel.explanation}
              </div>

              {/* Confidence Meter */}
              {rel.confidence && (
                <div className="flex items-center gap-3 relative z-10">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold tracking-widest w-24">SIMILARITY</span>
                  <div className="h-1.5 bg-background border border-border/60 rounded-full flex-1 overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all duration-1000"
                      style={{ width: `${Math.round(rel.confidence * 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-accent font-bold w-12 text-right">
                    {Math.round(rel.confidence * 100)}%
                  </span>
                </div>
              )}

              {/* Document References */}
              <div className="flex flex-col gap-2 pt-4 border-t border-border/50 relative z-10">
                 <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">
                   Linked Source Documents
                 </span>
                 <div className="flex flex-wrap gap-3">
                  {ev1 && (
                     <button
                       onClick={() => onSelectDocument && onSelectDocument(String(ev1.document_id), ev1.source ?? undefined)}
                       className="font-mono text-xs flex items-center gap-2 bg-background hover:bg-background/80 border border-border/60 px-3 py-1.5 rounded-lg text-foreground transition-colors shadow-sm"
                     >
                       <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                       {ev1.source || String(ev1.document_id).slice(0, 8)}
                     </button>
                  )}
                  {ev2 && (
                     <button
                       onClick={() => onSelectDocument && onSelectDocument(String(ev2.document_id), ev2.source ?? undefined)}
                       className="font-mono text-xs flex items-center gap-2 bg-background hover:bg-background/80 border border-border/60 px-3 py-1.5 rounded-lg text-foreground transition-colors shadow-sm"
                     >
                       <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                       {ev2.source || String(ev2.document_id).slice(0, 8)}
                     </button>
                  )}
                 </div>
              </div>

            </div>
          )
        })}
      </div>
    </div>
  )
}