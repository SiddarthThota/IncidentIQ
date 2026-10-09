import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { api, ApiError } from '../lib/api'
import { Search, Loader2, Sparkles, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react'

const EXAMPLE_QUESTIONS = [
  {
    title: 'Deployment Impact',
    question: 'Why did the Order API become slow on September 16? Check whether the deployment was related and whether we have seen this before.'
  },
  {
    title: 'Latency Investigation',
    question: 'Was the deployment related to the latency incident?'
  },
  {
    title: 'Historical Comparison',
    question: 'Did this exact failure happen before?'
  },
  {
    title: 'Conflicting Guidance',
    question: 'The service is failing after a deployment. What should the on-call engineer do first?'
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
    setQuestion(exampleText)
  }

  const charLimit = 2000
  const isOverLimit = question.length > charLimit
  const isSubmitting = createMutation.isPending

  return (
    <div className="max-w-3xl mx-auto space-y-10 animate-in fade-in pb-12 pt-8 sm:pt-16 px-4 text-center">

      {/* Centered Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-light text-primary border border-primary/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span className="text-xs font-bold uppercase tracking-wider">IncidentIQ Engine</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          What are you investigating?
        </h1>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="text-left space-y-6">
        <div className="relative group">
          <div className="relative rounded-2xl border border-border bg-card p-1 shadow-sm transition-shadow focus-within:shadow-md focus-within:border-primary/50">
            <textarea
              id="incident-question"
              rows={4}
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="Ask a question about an operational incident..."
              className={`w-full bg-transparent px-5 py-4 text-lg placeholder:text-muted-foreground focus:outline-none resize-none transition-all ${
                isOverLimit ? 'text-destructive' : 'text-foreground'
              }`}
              disabled={isSubmitting}
            />

            <div className="flex items-center justify-between border-t border-border px-4 py-3 bg-card-subtle rounded-b-xl">
              <div className="flex items-center gap-4">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-success" />
                  Traceable conclusion
                </span>
              </div>

              <div className="flex items-center gap-4">
                <span className={`text-xs font-medium ${isOverLimit ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
                  {question.length} / {charLimit}
                </span>
                {question.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setQuestion('')}
                    disabled={isSubmitting}
                    className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting || !question.trim() || isOverLimit}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  Start Investigation
                </button>
              </div>
            </div>
          </div>
        </div>

        {createMutation.error && (
          <div className="p-4 rounded-lg bg-destructive-background border border-destructive/20 text-destructive text-sm flex items-start gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Investigation initialization failed</p>
              <p className="text-xs mt-1 text-destructive/80">
                {createMutation.error instanceof ApiError
                  ? createMutation.error.message
                  : 'Backend server was unable to execute the investigation pipeline.'}
              </p>
            </div>
          </div>
        )}
      </form>

      {/* Suggested Evaluator Questions */}
      <div className="pt-8 text-left space-y-4">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest text-center">
          Suggested Investigations
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {EXAMPLE_QUESTIONS.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectExample(item.question)}
              className="text-left p-5 rounded-xl border border-border bg-card transition-all hover:border-primary hover:shadow-md flex flex-col space-y-2 group"
            >
              <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                {item.title}
              </span>
              <p className="text-sm text-secondary-foreground leading-relaxed">
                "{item.question}"
              </p>
              <div className="mt-auto pt-2 flex items-center gap-1.5 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                Select <ArrowRight className="w-3 h-3" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
