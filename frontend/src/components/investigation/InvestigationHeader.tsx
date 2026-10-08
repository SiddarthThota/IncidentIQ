import { useState } from 'react'
import { Copy, Check, Clock, RefreshCw, Layers } from 'lucide-react'
import type { InvestigationStateWithConclusion } from '../../types/investigation'

interface InvestigationHeaderProps {
  state: InvestigationStateWithConclusion
  onConclude?: () => void
  isConcluding?: boolean
}

export function InvestigationHeader({ state, onConclude, isConcluding }: InvestigationHeaderProps) {
  const [copiedId, setCopiedId] = useState(false)

  const handleCopyId = () => {
    if (state.investigation_id) {
      navigator.clipboard.writeText(state.investigation_id)
      setCopiedId(true)
      setTimeout(() => setCopiedId(false), 2000)
    }
  }

  // Derive status badge styling
  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase()
    if (s === 'COMPLETED' || s === 'SUPPORTED') {
      return {
        label: 'COMPLETED',
        className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      }
    }
    if (s === 'INSUFFICIENT') {
      return {
        label: 'INSUFFICIENT EVIDENCE',
        className: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      }
    }
    if (s === 'PROVIDER_LIMITED' || s === 'INVESTIGATION_PROVIDER_FAILURE') {
      return {
        label: 'PROVIDER LIMITED',
        className: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      }
    }
    if (s === 'FAILED') {
      return {
        label: 'FAILED',
        className: 'bg-destructive/10 text-destructive border-destructive/20',
      }
    }
    return {
      label: 'INVESTIGATING',
      className: 'bg-primary/10 text-primary border-primary/20 animate-pulse',
    }
  }

  const badge = getStatusBadge(state.status)

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
      {/* Top Meta Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Badge */}
          <span
            className={`font-semibold px-2.5 py-1 rounded-full border text-xs tracking-wide uppercase ${badge.className}`}
          >
            {badge.label}
          </span>

          {/* Iteration Count */}
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted/60 text-muted-foreground border border-border font-medium">
            <Layers className="w-3 h-3" />
            Iteration {state.iteration_count || 1}
          </span>

          {/* Created Date */}
          {state.created_at && (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Clock className="w-3 h-3" />
              {new Date(state.created_at).toLocaleString()}
            </span>
          )}
        </div>

        {/* Investigation ID Pill */}
        {state.investigation_id && (
          <div className="flex items-center gap-2 bg-muted/40 px-2.5 py-1 rounded-md border border-border">
            <span className="text-muted-foreground font-mono text-xs">ID:</span>
            <span className="font-mono text-xs text-foreground font-medium">
              {state.investigation_id}
            </span>
            <button
              onClick={handleCopyId}
              className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
              title="Copy Investigation ID"
              aria-label="Copy Investigation ID"
            >
              {copiedId ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Main Question Heading */}
      <div>
        <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
          Operational Question
        </span>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-1 leading-snug">
          "{state.original_question}"
        </h1>
      </div>

      {/* Analysis Subheading if available */}
      {state.analysis && (
        <div className="pt-2 border-t border-border/60 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          {state.analysis.investigation_intent && (
            <div>
              <span className="font-medium text-foreground">Intent: </span>
              <span className="capitalize">{state.analysis.investigation_intent.replace('_', ' ')}</span>
            </div>
          )}

          {state.analysis.services && state.analysis.services.length > 0 && (
            <div>
              <span className="font-medium text-foreground">Services: </span>
              <span>{state.analysis.services.join(', ')}</span>
            </div>
          )}

          {state.analysis.software_versions && state.analysis.software_versions.length > 0 && (
            <div>
              <span className="font-medium text-foreground">Versions: </span>
              <span>{state.analysis.software_versions.join(', ')}</span>
            </div>
          )}

          {/* Trigger Reasoning Button if missing */}
          {!state.conclusion && onConclude && (
            <button
              onClick={onConclude}
              disabled={isConcluding}
              className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium shadow-xs transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isConcluding ? 'animate-spin' : ''}`} />
              {isConcluding ? 'Synthesizing...' : 'Generate Conclusion'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
