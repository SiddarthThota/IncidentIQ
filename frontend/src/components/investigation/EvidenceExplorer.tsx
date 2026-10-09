import { useState } from 'react'
import { ChevronDown, ChevronUp, ExternalLink, Layers, FileText } from 'lucide-react'
import type { InvestigationEvidence, SourceReference } from '../../types/investigation'

interface EvidenceExplorerProps {
  evidence: InvestigationEvidence[]
  sourceReferences?: SourceReference[]
  onSelectDocument?: (documentId: string, sourceLabel?: string) => void
}

export function EvidenceExplorer({ evidence, sourceReferences = [], onSelectDocument }: EvidenceExplorerProps) {
  const [expandedChunks, setExpandedChunks] = useState<Record<string, boolean>>({})

  if (!evidence || evidence.length === 0) {
    return null
  }

  const toggleExpand = (id: string) => {
    setExpandedChunks(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const getClassificationBadge = (cls: string) => {
    switch (cls) {
      case 'DIRECT':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
      case 'CORROBORATED':
        return 'text-teal-400 bg-teal-500/10 border-teal-500/20'
      case 'TEMPORAL':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
      case 'INFERRED':
        return 'text-primary bg-primary/10 border-primary/20'
      case 'CONTRADICTED':
        return 'text-destructive bg-destructive/10 border-destructive/20'
      default:
        return 'text-muted-foreground bg-muted border-border'
    }
  }

  const getSourceLabel = (docId: string) => {
    const ref = sourceReferences.find(sr => sr.document_id === docId)
    return ref?.source_label || null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md py-2 z-10">
        <div>
          <h2 className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            Retrieved Evidence
          </h2>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground px-2 py-0.5 rounded-full bg-background border border-border font-bold">
          {evidence.length} CHUNKS
        </span>
      </div>

      <div className="grid gap-4">
        {evidence.map((ev, idx) => {
          const chunkKey = String(ev.chunk_id || ev.id || idx)
          const isExpanded = !!expandedChunks[chunkKey]
          const readableSource = getSourceLabel(String(ev.document_id))

          return (
            <div
              key={chunkKey}
              className="rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md shadow-sm space-y-3 relative overflow-hidden group"
            >
              {/* Evidence Top Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs relative z-10">
                <div className="flex items-center gap-2">
                  {/* Source Label or Document ID */}
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-primary-light text-primary border border-primary/20 uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                    <FileText className="w-3 h-3" />
                    {readableSource || ev.source || 'EVIDENCE'}
                  </span>
                  {!readableSource && (
                    <span className="font-mono text-muted-foreground text-[10px]">
                      ID: {String(ev.document_id).slice(0, 8)}...
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {onSelectDocument && (
                    <button
                      onClick={() => onSelectDocument(String(ev.document_id), ev.source ?? undefined)}
                      className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest text-muted-foreground hover:text-primary transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" /> View
                    </button>
                  )}
                </div>
              </div>

              {/* Source Text Excerpt */}
              {ev.source_text && (
                <div className="space-y-1 relative z-10">
                  <div
                    className={`rounded bg-card-subtle border border-border p-3 text-xs font-mono text-secondary-foreground leading-relaxed transition-all ${
                      isExpanded ? 'whitespace-pre-wrap' : 'line-clamp-4'
                    }`}
                  >
                    {ev.source_text}
                  </div>
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => toggleExpand(chunkKey)}
                      className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary text-[10px] font-bold uppercase tracking-wider transition-colors"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-3 h-3" /> Less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3 h-3" /> More
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Extracted Claims */}
              {ev.claims && ev.claims.length > 0 && (
                <div className="space-y-2 pt-3 border-t border-border/40 relative z-10">
                  <div className="grid gap-2">
                    {ev.claims.map((claim, cIdx) => (
                      <div
                        key={claim.id || cIdx}
                        className="rounded border border-border/30 p-2 text-xs flex flex-col gap-1.5 hover:bg-background/40 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-widest ${getClassificationBadge(
                              claim.classification
                            )}`}
                          >
                            {claim.classification}
                          </span>
                          {claim.confidence !== null && claim.confidence !== undefined && (
                            <span className="font-mono text-[9px] text-muted-foreground ml-auto border border-border px-1 rounded bg-background">
                              {(claim.confidence * 100).toFixed(0)}%
                            </span>
                          )}
                        </div>
                        <p className="text-foreground leading-snug">
                          {claim.claim_text}
                        </p>
                      </div>
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
