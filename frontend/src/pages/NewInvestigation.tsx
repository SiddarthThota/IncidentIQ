import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { api, ApiError } from '../lib/api'
import { Search, Loader2, Sparkles, AlertCircle, ArrowRight, HelpCircle, ShieldCheck } from 'lucide-react'

const EXAMPLE_QUESTIONS = [
  {
    title: 'Deployment & Latency Incident (Demo Scenario)',
    question:
      'Why did the Order API become slow on September 16? Check whether the deployment was related and whether we have seen this before.',
  },
  {
    title: 'Causal vs Temporal Association Inquiry',
    question: 'Was the deployment related to the latency incident?',
  },
  {
    title: 'Historical Postmortem Pattern Match',
    question: 'Did this exact failure happen before?',
  },
  {
    title: 'Operational Runbook Guidance Check',
    question: 'The service is failing after a deployment. What should the on-call engineer do first?',
  },
]

export function NewInvestigation() {
  const [question, setQuestion] = useState('')
  const navigate = useNavigate()

  const createMutation = useMutation({
    mutationFn: (q: string) => api.createInvestigation(q),
    onSuccess: data => {
      if (data.investigation_id) {
        navigate(`/investigations/${data.investigation_id}`)
      } else {
        navigate('/history')
      }
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = question.trim()
    if (!trimmed || createMutation.isPending) return
    createMutation.mutate(trimmed)
  }

  const handleSelectExample = (exampleText: string) => {
    // Populate textarea WITHOUT submitting automatically
    setQuestion(exampleText)
  }

  const charLimit = 2000
  const isOverLimit = question.length > charLimit
  const isSubmitting = createMutation.isPending

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in pb-12">
      {/* Page Title & Intro */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" /> IncidentIQ Investigation Engine
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          What are you investigating?
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
          Enter an operational incident question. IncidentIQ performs semantic and metadata-aware retrieval,
          discovers open questions, executes follow-up searches, and synthesizes a verifiable, document-backed conclusion.
        </p>
      </div>

      {/* Main Form */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="incident-question" className="text-sm font-semibold text-foreground">
                Incident Question / Hypothesis
              </label>
              <span
                className={`text-xs font-mono ${
                  isOverLimit ? 'text-destructive font-semibold' : 'text-muted-foreground'
                }`}
              >
                {question.length} / {charLimit} characters
              </span>
            </div>

            <textarea
              id="incident-question"
              rows={5}
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="e.g., Why did the Order API become slow on September 16? Check whether the deployment was related and whether we have seen this before."
              className={`w-full rounded-lg border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary leading-relaxed resize-none transition-all ${
                isOverLimit ? 'border-destructive focus:ring-destructive' : 'border-input'
              }`}
              disabled={isSubmitting}
            />
          </div>

          {/* Error Message */}
          {createMutation.error && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Investigation initialization failed</p>
                <p className="text-xs mt-1 text-muted-foreground">
                  {createMutation.error instanceof ApiError
                    ? createMutation.error.message
                    : 'Backend server was unable to execute the investigation pipeline.'}
                </p>
              </div>
            </div>
          )}

          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Traceable conclusion with strict causation guardrails
            </div>

            <div className="flex items-center gap-2">
              {question.length > 0 && (
                <button
                  type="button"
                  onClick={() => setQuestion('')}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting || !question.trim() || isOverLimit}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Investigating...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Start Investigation
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Dynamic Investigation Progress Banner while Submitting */}
        {isSubmitting && (
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-2 animate-in fade-in">
            <div className="flex items-center gap-2 text-primary text-xs font-semibold">
              <Loader2 className="w-4 h-4 animate-spin" />
              Executing Bounded Multi-Stage Investigation Pipeline
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Analyzing entities • Querying pgvector corpus • Formulating hypothesis follow-up queries •
              Comparing historical postmortems • Building chronology • Synthesizing document-backed conclusion...
            </p>
          </div>
        )}
      </div>

      {/* Suggested Evaluator Questions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-muted-foreground" />
            Example Evaluator Inquiries
          </h2>
          <span className="text-xs text-muted-foreground">Click to populate question input</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {EXAMPLE_QUESTIONS.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectExample(item.question)}
              className="text-left p-4 rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-muted/40 transition-all shadow-xs flex flex-col justify-between space-y-2 group"
            >
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-primary">
                  {item.title}
                </span>
                <p className="text-xs font-medium text-foreground mt-1 group-hover:text-primary transition-colors leading-relaxed">
                  "{item.question}"
                </p>
              </div>
              <div className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium group-hover:text-primary">
                Populate query <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
