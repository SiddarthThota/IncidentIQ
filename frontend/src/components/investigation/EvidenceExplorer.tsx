import { useState } from 'react'
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import type { InvestigationEvidence } from '../../types/investigation'

interface EvidenceExplorerProps {
  evidence: InvestigationEvidence[]
  onSelectDocument?: (documentId: string, sourceLabel?: string) => void
}

export function EvidenceExplorer({ evidence, onSelectDocument }: EvidenceExplorerProps) {
  const [expandedChunks, setExpandedChunks] = useState<Record<string, boolean>>({})

  if (!evidence || evidence.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center text-muted-foreground text-sm">
        No evidence chunks retrieved for this investigation.
      </div>
    )
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
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20'
      case 'CONTRADICTED':
        return 'text-destructive bg-destructive/10 border-destructive/20'
      default:
        return 'text-muted-foreground bg-muted border-border'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground tracking-tight">
            Retrieved Evidence Explorer
          </h2>
          <p className="text-xs text-muted-foreground">
            Verifiable document chunks and claim extractions retrieved by semantic & metadata search
          </p>
        </div>
        <span className="text-xs font-mono text-muted-foreground px-2 py-0.5 rounded bg-muted border border-border">
          {evidence.length} Chunks
        </span>
      </div>

      <div className="grid gap-3">
        {evidence.map((ev, idx) => {
          const chunkKey = String(ev.chunk_id || ev.id || idx)
          const isExpanded = !!expandedChunks[chunkKey]

          return (
            <div
              key={chunkKey}
              className="rounded-lg border border-border bg-card p-4 transition-all hover:border-border/80 shadow-xs space-y-3"
            >
              {/* Evidence Top Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  {/* Source Label or Document ID */}
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-primary/15 text-primary border border-primary/20">
                    {ev.source || 'EVIDENCE'}
                  </span>
                  <span className="font-mono text-muted-foreground text-[11px]">
                    Doc ID: {String(ev.document_id).slice(0, 8)}...
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {onSelectDocument && (
                    <button
                      onClick={() => onSelectDocument(String(ev.document_id), ev.source ?? undefined)}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> View Full Source
                    </button>
                  )}
                </div>
              </div>

              {/* Source Text Excerpt */}
              {ev.source_text && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="font-mono uppercase">Excerpt</span>
                    <button
                      onClick={() => toggleExpand(chunkKey)}
                      className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground text-[11px] transition-colors"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-3 h-3" /> Show Less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3 h-3" /> Show More
                        </>
                      )}
                    </button>
                  </div>
                  <div
                    className={`rounded bg-muted/40 border border-border/60 p-3 text-xs font-mono text-foreground leading-relaxed transition-all ${
                      isExpanded ? 'whitespace-pre-wrap' : 'line-clamp-3'
                    }`}
                  >
                    {ev.source_text}
                  </div>
                </div>
              )}

              {/* Extracted Claims */}
              {ev.claims && ev.claims.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Extracted Claims ({ev.claims.length})
                  </span>
                  <div className="grid gap-2">
                    {ev.claims.map((claim, cIdx) => (
                      <div
                        key={claim.id || cIdx}
                        className="rounded bg-muted/20 border border-border/40 p-2.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <p className="text-foreground leading-snug font-medium">
                          {claim.claim_text}
                        </p>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`font-mono text-[10px] font-semibold px-2 py-0.5 rounded border uppercase ${getClassificationBadge(
                              claim.classification
                            )}`}
                          >
                            {claim.classification}
                          </span>
                          {claim.confidence !== null && claim.confidence !== undefined && (
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {(claim.confidence * 100).toFixed(0)}%
                            </span>
                          )}
                        </div>
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
