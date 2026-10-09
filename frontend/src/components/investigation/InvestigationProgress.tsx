import { CheckCircle2, Circle, Clock, AlertTriangle } from 'lucide-react'
import type { InvestigationStateWithConclusion } from '../../types/investigation'

interface InvestigationProgressProps {
  state: InvestigationStateWithConclusion
}

interface Step {
  id: string
  title: string
  description: string
  status: 'completed' | 'in_progress' | 'pending' | 'failed'
  details?: string | null
}

export function InvestigationProgress({ state }: InvestigationProgressProps) {
  const events = state.events || []

  // Check event presence
  const hasEvent = (typePrefix: string) =>
    events.some(e => e.event_type.toUpperCase().includes(typePrefix.toUpperCase()))

  const isFailed = state.status === 'FAILED' || state.status === 'INVESTIGATION_PROVIDER_FAILURE'
  const isProviderLimited = state.status === 'PROVIDER_LIMITED' || state.conclusion?.conclusion_status === 'PROVIDER_LIMITED'

  const steps: Step[] = [
    {
      id: 'question',
      title: 'Question Ingestion',
      description: 'Accepted natural-language question',
      status: state.original_question ? 'completed' : 'pending',
    },
    {
      id: 'analysis',
      title: 'Entity & Intent Analysis',
      description: state.analysis
        ? `Identified intent: ${state.analysis.investigation_intent || 'operational'}`
        : 'Analyzing inquiry semantics',
      status: state.analysis || hasEvent('QUESTION_ANALYZED') ? 'completed' : 'pending',
      details: state.analysis?.services?.length ? `Target service: ${state.analysis.services.join(', ')}` : null,
    },
    {
      id: 'search',
      title: 'Initial Evidence Search',
      description: state.retrieved_evidence?.length > 0
        ? `Retrieved ${state.retrieved_evidence.length} evidence chunks`
        : 'Querying vector & metadata index',
      status: state.retrieved_evidence?.length > 0 || hasEvent('RETRIEVAL') ? 'completed' : 'pending',
    },
    {
      id: 'followup',
      title: 'Follow-up Investigation',
      description: state.follow_up_queries?.length > 0
        ? `${state.follow_up_queries.length} follow-up hypothesis queries`
        : state.iteration_count > 1
        ? `Iterated ${state.iteration_count} rounds`
        : 'Evaluated open questions',
      status: state.follow_up_queries?.length > 0 || state.iteration_count > 1 || hasEvent('FOLLOW_UP')
        ? 'completed'
        : state.retrieved_evidence?.length > 0 ? 'completed' : 'pending',
    },
    {
      id: 'reasoning',
      title: 'Evidence Synthesis',
      description: state.conclusion
        ? `Status: ${state.conclusion.conclusion_status}`
        : isProviderLimited
        ? 'Provider limited fallback engaged'
        : 'Corroborating findings & chronology',
      status: state.conclusion
        ? 'completed'
        : isProviderLimited
        ? 'completed'
        : isFailed
        ? 'failed'
        : state.retrieved_evidence?.length > 0
        ? 'in_progress'
        : 'pending',
    },
    {
      id: 'conclusion',
      title: 'Traceable Conclusion',
      description: state.conclusion
        ? `${state.conclusion.findings?.length || 0} document-backed findings`
        : 'Awaiting conclusion output',
      status: state.conclusion ? 'completed' : isFailed ? 'failed' : 'pending',
    },
  ]

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground tracking-tight">Investigation Step Flow</h2>
          <p className="text-xs text-muted-foreground">
            Deterministic state verification across retrieval, iteration, and synthesis
          </p>
        </div>
        <span className="text-xs font-mono text-muted-foreground px-2 py-1 rounded bg-muted/50 border border-border">
          {events.length} Recorded Events
        </span>
      </div>

      {/* Steps Pipeline */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {steps.map((step, idx) => {
          let icon = <Circle className="w-4 h-4 text-muted-foreground" />
          let borderClass = 'border-border bg-card'
          let titleClass = 'text-muted-foreground'

          if (step.status === 'completed') {
            icon = <CheckCircle2 className="w-4 h-4 text-success" />
            borderClass = 'border-success/30 bg-success-background shadow-sm'
            titleClass = 'text-foreground'
          } else if (step.status === 'in_progress') {
            icon = <Clock className="w-4 h-4 text-primary animate-spin" />
            borderClass = 'border-primary/30 bg-primary-light shadow-sm'
            titleClass = 'text-primary'
          } else if (step.status === 'failed') {
            icon = <AlertTriangle className="w-4 h-4 text-destructive" />
            borderClass = 'border-destructive/30 bg-destructive-background shadow-sm'
            titleClass = 'text-destructive'
          }

          return (
            <div
              key={step.id}
              className={`rounded-lg border p-3.5 flex flex-col justify-between transition-all ${borderClass}`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    Step {idx + 1}
                  </span>
                  {icon}
                </div>
                <h4 className={`text-xs font-semibold leading-snug ${titleClass}`}>
                  {step.title}
                </h4>
                <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                  {step.description}
                </p>
              </div>
              {step.details && (
                <div className="mt-2 pt-2 border-t border-border/50 text-[10px] text-muted-foreground font-mono truncate">
                  {step.details}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
