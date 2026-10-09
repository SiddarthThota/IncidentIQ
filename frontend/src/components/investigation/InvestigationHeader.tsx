import { useState } from 'react'
import { Copy, Check, Clock, RefreshCw, Layers, ShieldAlert, Zap, AlertTriangle } from 'lucide-react'
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
        label: 'INVESTIGATION COMPLETED',
        className: 'bg-success-background text-success border-success/20',
        icon: <Check className="w-3.5 h-3.5" />
      }
    }
    if (s === 'INSUFFICIENT') {
      return {
        label: 'INSUFFICIENT EVIDENCE',
        className: 'bg-warning-background text-warning border-warning/20',
        icon: <ShieldAlert className="w-3.5 h-3.5" />
      }
    }
    if (s === 'PROVIDER_LIMITED' || s === 'INVESTIGATION_PROVIDER_FAILURE') {
      return {
        label: 'PROVIDER LIMITED',
        className: 'bg-warning-background text-warning border-warning/20',
        icon: <AlertTriangle className="w-3.5 h-3.5" />
      }
    }
    if (s === 'FAILED') {
      return {
        label: 'INVESTIGATION FAILED',
        className: 'bg-destructive-background text-destructive border-destructive/20',
        icon: <AlertTriangle className="w-3.5 h-3.5" />
      }
    }
    return {
      label: 'INVESTIGATION ACTIVE',
      className: 'bg-primary-light text-primary border-primary/20 animate-pulse',
      icon: <Zap className="w-3.5 h-3.5" />
    }
  }

  const badge = getStatusBadge(state.status)

  return (
    <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm relative overflow-hidden group">
      {/* Subtle Background Decoration */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-light rounded-full blur-2xl pointer-events-none group-hover:bg-primary/10 transition-colors" />

      {/* Top Meta Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-xs relative z-10 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Badge */}
          <span
            className={`flex items-center gap-1.5 font-bold px-3 py-1.5 rounded-full border text-[10px] tracking-widest uppercase ${badge.className}`}
          >
            {badge.icon}
            {badge.label}
          </span>

          {/* Iteration Count */}
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background border border-border font-mono text-[10px] text-muted-foreground uppercase tracking-widest shadow-sm">
            <Layers className="w-3.5 h-3.5 text-muted-foreground/70" />
            ITERATION {state.iteration_count || 1}
          </span>

          {/* Created Date */}
          {state.created_at && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background border border-border font-mono text-[10px] text-muted-foreground uppercase tracking-widest shadow-sm">
              <Clock className="w-3.5 h-3.5 text-muted-foreground/70" />
              {new Date(state.created_at).toUTCString()}
            </span>
          )}
        </div>

        {/* Investigation ID Pill */}
        {state.investigation_id && (
          <div className="flex items-center gap-2 bg-background/80 px-3 py-1.5 rounded-lg border border-border/60 shadow-sm transition-colors hover:bg-background">
            <span className="text-primary/60 font-bold uppercase tracking-widest text-[10px]">ID</span>
            <span className="font-mono text-[10px] text-foreground font-semibold uppercase tracking-wider">
              {state.investigation_id.split('-')[0]}...
            </span>
            <button
              onClick={handleCopyId}
              className="text-muted-foreground hover:text-primary transition-colors p-0.5"
              title="Copy Investigation ID"
              aria-label="Copy Investigation ID"
            >
              {copiedId ? (
                <Check className="w-3.5 h-3.5 text-accent" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Main Question Heading */}
      <div className="relative z-10">
        <span className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2 mb-2">
          OPERATIONAL INQUIRY
          <div className="h-px bg-primary/20 flex-1 ml-4" />
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground leading-snug drop-shadow-sm">
          "{state.original_question}"
        </h1>
      </div>

      {/* Analysis Subheading if available */}
      {state.analysis && (
        <div className="mt-8 pt-4 border-t border-border/40 flex flex-wrap items-center gap-6 text-xs text-muted-foreground relative z-10">
          {state.analysis.investigation_intent && (
            <div className="flex flex-col gap-1">
              <span className="font-bold text-[9px] uppercase tracking-widest text-muted-foreground/70">DETECTED INTENT</span>
              <span className="font-mono font-semibold text-foreground uppercase tracking-wider bg-background px-2 py-0.5 rounded border border-border/50">
                {state.analysis.investigation_intent.replace('_', ' ')}
              </span>
            </div>
          )}

          {state.analysis.services && state.analysis.services.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="font-bold text-[9px] uppercase tracking-widest text-muted-foreground/70">TARGET SERVICES</span>
              <span className="font-mono font-semibold text-foreground uppercase tracking-wider">
                {state.analysis.services.join(', ')}
              </span>
            </div>
          )}

          {state.analysis.software_versions && state.analysis.software_versions.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="font-bold text-[9px] uppercase tracking-widest text-muted-foreground/70">SOFTWARE VERSIONS</span>
              <span className="font-mono font-semibold text-foreground uppercase tracking-wider">
                {state.analysis.software_versions.join(', ')}
              </span>
            </div>
          )}

          {/* Trigger Reasoning Button if missing */}
          {!state.conclusion && onConclude && (
            <div className="ml-auto">
              <button
                onClick={onConclude}
                disabled={isConcluding}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] font-bold uppercase tracking-widest text-[10px] transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isConcluding ? 'animate-spin' : ''}`} />
                {isConcluding ? 'SYNTHESIZING...' : 'FORCE SYNTHESIS'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
