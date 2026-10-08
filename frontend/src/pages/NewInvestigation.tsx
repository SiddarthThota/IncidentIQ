import { useState } from 'react'
import { Search, Loader2 } from 'lucide-react'

export function NewInvestigation() {
  const [question, setQuestion] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim()) return
    setIsSubmitting(true)
    
    // TODO: Connect to backend API once available
    // setTimeout simulates a request for the frontend skeleton
    setTimeout(() => {
      setIsSubmitting(false)
      alert('Backend is not yet connected. Feature arriving in Phase 4.')
    }, 1000)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">New Investigation</h1>
        <p className="text-muted-foreground mt-1">Ask a natural-language operational incident question.</p>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="question" className="block text-sm font-medium mb-2">
              Incident Question
            </label>
            <textarea
              id="question"
              rows={4}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., Why did the Order API become slow on September 16? Check whether the deployment was related..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              disabled={isSubmitting}
            />
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !question.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Start Investigation
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
