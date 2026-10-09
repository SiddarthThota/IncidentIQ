import { Calendar, Clock, Server, GitBranch, FileText, Rocket, Package, AlertTriangle, BookOpen, History } from 'lucide-react'
import type { TimelineEvent } from '../../types/investigation'

interface TimelineViewProps {
  timeline: TimelineEvent[]
  onSelectDocument?: (documentId: string, sourceLabel?: string) => void
}

export function TimelineView({ timeline, onSelectDocument }: TimelineViewProps) {
  if (!timeline || timeline.length === 0) {
    return null
  }

  // Sort events by ordering
  const sortedEvents = [...timeline].sort((a, b) => (a.ordering ?? 0) - (b.ordering ?? 0))

  const getEventIcon = (eventLabel: string) => {
    const text = eventLabel.toLowerCase()
    if (text.includes('deploy')) return <Rocket className="w-4 h-4" />
    if (text.includes('incident') || text.includes('fail') || text.includes('outage') || text.includes('error') || text.includes('latency')) return <AlertTriangle className="w-4 h-4" />
    if (text.includes('guide') || text.includes('runbook')) return <BookOpen className="w-4 h-4" />
    if (text.includes('postmortem') || text.includes('report')) return <FileText className="w-4 h-4" />
    if (text.includes('history') || text.includes('previous')) return <History className="w-4 h-4" />
    return <Package className="w-4 h-4" />
  }

  const getEventColor = (eventLabel: string) => {
    const text = eventLabel.toLowerCase()
    if (text.includes('deploy')) return 'text-primary bg-primary-light border-primary/40 shadow-sm'
    if (text.includes('incident') || text.includes('fail') || text.includes('error') || text.includes('latency')) return 'text-destructive bg-destructive-background border-destructive/40 shadow-sm'
    if (text.includes('guide') || text.includes('runbook')) return 'text-success bg-success-background border-success/40 shadow-sm'
    if (text.includes('postmortem') || text.includes('report')) return 'text-primary bg-primary-light border-primary/40 shadow-sm'
    return 'text-muted-foreground bg-muted border-border shadow-sm'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            CHRONOLOGY & TIMELINE
          </h2>
        </div>
      </div>

      <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-[11px] sm:before:left-[19px] before:top-4 before:bottom-4 before:w-[2px] before:bg-gradient-to-b before:from-primary/50 before:via-border before:to-border/20">
        {sortedEvents.map((event, idx) => {
          const nodeColorClass = getEventColor(event.event_label)

          return (
            <div key={event.id || idx} className="relative group">
              {/* Luminous Timeline Node */}
              <div className={`absolute -left-6 sm:-left-8 top-1.5 w-7 h-7 rounded-full border-2 ring-4 ring-background flex items-center justify-center transition-all duration-300 group-hover:scale-110 z-10 ${nodeColorClass}`}>
                {getEventIcon(event.event_label)}
              </div>

              <div className="rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-md shadow-sm space-y-4 ml-2 sm:ml-4">

                {/* Event Description */}
                <h3 className="text-base font-bold text-foreground leading-snug">
                  {event.event_label}
                </h3>

                {/* Event Date vs Document Date */}
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  {/* Operational Event Date */}
                  {event.event_date ? (
                    <span className="inline-flex items-center gap-1.5 font-mono font-bold text-primary bg-primary-light px-2.5 py-1 rounded-md border border-primary/20">
                      <Calendar className="w-3.5 h-3.5" />
                      {event.event_date}
                    </span>
                  ) : event.event_timestamp ? (
                    <span className="inline-flex items-center gap-1.5 font-mono font-bold text-primary bg-primary-light px-2.5 py-1 rounded-md border border-primary/20">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(event.event_timestamp).toUTCString()}
                    </span>
                  ) : (
                    <span className="font-mono text-muted-foreground text-[11px]">
                      Undated
                    </span>
                  )}

                  {/* Document Date (Explicitly separate) */}
                  {event.document_date && (
                    <span className="inline-flex items-center gap-1 font-mono text-muted-foreground bg-muted px-2.5 py-1 rounded-md border border-border text-[11px]">
                      <Clock className="w-3 h-3" />
                      Pub: {event.document_date}
                    </span>
                  )}
                </div>

                {/* Context Badges (Service, Version, Source) */}
                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border/50 text-xs">
                  {event.service && (
                    <span className="inline-flex items-center gap-1 font-mono text-foreground bg-card-subtle px-2 py-1 rounded-md border border-border">
                      <Server className="w-3 h-3 text-muted-foreground" />
                      {event.service}
                    </span>
                  )}

                  {event.software_version && (
                    <span className="inline-flex items-center gap-1 font-mono text-foreground bg-card-subtle px-2 py-1 rounded-md border border-border">
                      <GitBranch className="w-3 h-3 text-muted-foreground" />
                      v{event.software_version}
                    </span>
                  )}

                  {/* Source Document Reference */}
                  {event.source_label && (
                    <button
                      onClick={() => onSelectDocument && onSelectDocument('', event.source_label ?? '')}
                      disabled={!onSelectDocument}
                      className="inline-flex items-center gap-1 font-mono text-xs font-semibold px-2 py-1 rounded-md bg-primary-light text-primary border border-primary/20 hover:bg-primary/20 transition-colors ml-auto"
                      title="View source document"
                    >
                      <FileText className="w-3 h-3" />
                      {event.source_label}
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
