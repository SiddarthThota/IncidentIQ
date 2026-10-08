import { Calendar, Clock, Server, GitBranch, FileText } from 'lucide-react'
import type { TimelineEvent } from '../../types/investigation'

interface TimelineViewProps {
  timeline: TimelineEvent[]
  onSelectDocument?: (documentId: string, sourceLabel?: string) => void
}

export function TimelineView({ timeline, onSelectDocument }: TimelineViewProps) {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center text-muted-foreground text-sm">
        No chronological timeline events established from retrieved evidence.
      </div>
    )
  }

  // Sort events by ordering
  const sortedEvents = [...timeline].sort((a, b) => (a.ordering ?? 0) - (b.ordering ?? 0))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground tracking-tight">
            Evidence Chronology & Timeline
          </h2>
          <p className="text-xs text-muted-foreground">
            Strict separation between operational Event Dates and document publication dates
          </p>
        </div>
        <span className="text-xs font-mono text-muted-foreground px-2 py-0.5 rounded bg-muted border border-border">
          {sortedEvents.length} Events
        </span>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-3 before:bottom-3 before:w-[2px] before:bg-border">
        {sortedEvents.map((event, idx) => {
          return (
            <div key={event.id || idx} className="relative group">
              {/* Timeline Bullet Node */}
              <div className="absolute -left-6 top-1.5 w-[14px] h-[14px] rounded-full bg-primary/20 border-2 border-primary ring-4 ring-background flex items-center justify-center transition-all group-hover:scale-110" />

              <div className="rounded-lg border border-border bg-card p-4 transition-all hover:border-border/80 shadow-xs space-y-3">
                {/* Event Date vs Document Date */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Operational Event Date */}
                    {event.event_date ? (
                      <span className="inline-flex items-center gap-1 font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        <Calendar className="w-3.5 h-3.5" />
                        Event Date: {event.event_date}
                      </span>
                    ) : event.event_timestamp ? (
                      <span className="inline-flex items-center gap-1 font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        <Clock className="w-3.5 h-3.5" />
                        Event Timestamp: {new Date(event.event_timestamp).toUTCString()}
                      </span>
                    ) : (
                      <span className="font-mono text-muted-foreground text-[11px]">
                        Event Date: Undated / Unspecified
                      </span>
                    )}

                    {/* Document Date (Explicitly separate) */}
                    {event.document_date && (
                      <span className="inline-flex items-center gap-1 font-mono text-muted-foreground bg-muted/60 px-2 py-0.5 rounded border border-border text-[11px]">
                        <Clock className="w-3 h-3" />
                        Document Published: {event.document_date}
                      </span>
                    )}
                  </div>

                  {/* Source Document Reference */}
                  {event.source_label && (
                    <button
                      onClick={() => onSelectDocument && onSelectDocument('', event.source_label ?? '')}
                      disabled={!onSelectDocument}
                      className="inline-flex items-center gap-1 font-mono text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                      title="View source document"
                    >
                      <FileText className="w-3 h-3" />
                      {event.source_label}
                    </button>
                  )}
                </div>

                {/* Event Description */}
                <p className="text-sm font-medium text-foreground leading-relaxed">
                  {event.event_label}
                </p>

                {/* Context Badges (Service, Version) */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/50 text-xs">
                  {event.service && (
                    <span className="inline-flex items-center gap-1 font-mono text-muted-foreground bg-muted/40 px-2 py-0.5 rounded">
                      <Server className="w-3 h-3" />
                      {event.service}
                    </span>
                  )}

                  {event.software_version && (
                    <span className="inline-flex items-center gap-1 font-mono text-muted-foreground bg-muted/40 px-2 py-0.5 rounded">
                      <GitBranch className="w-3 h-3" />
                      v{event.software_version}
                    </span>
                  )}

                  <span className="text-[10px] text-muted-foreground font-mono ml-auto">
                    Sequence #{event.ordering + 1}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
