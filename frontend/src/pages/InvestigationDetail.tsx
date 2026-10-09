import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, ApiError } from '../lib/api'
import {
  InvestigationHeader,
} from '../components/investigation/InvestigationHeader'
import { InvestigationProgress } from '../components/investigation/InvestigationProgress'
import { ConclusionPanel } from '../components/investigation/ConclusionPanel'
import { FindingsList } from '../components/investigation/FindingsList'
import { TimelineView } from '../components/investigation/TimelineView'
import { EvidenceExplorer } from '../components/investigation/EvidenceExplorer'
import { FollowUpSection } from '../components/investigation/FollowUpSection'
import { OpenQuestionsList } from '../components/investigation/OpenQuestionsList'
import { ContradictionsSection } from '../components/investigation/ContradictionsSection'
import { HistoricalComparison } from '../components/investigation/HistoricalComparison'
import { DocumentModal } from '../components/investigation/DocumentModal'
import { Loader2, ArrowLeft, RefreshCw, AlertCircle, FileSearch } from 'lucide-react'

export function InvestigationDetail() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
  const [selectedDocLabel, setSelectedDocLabel] = useState<string | null>(null)

  // Fetch investigation state
  const {
    data: state,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['investigation', id],
    queryFn: () => (id ? api.getInvestigation(id) : null),
    enabled: !!id,
    refetchInterval: query => {
      // If currently investigating without conclusion or failure, poll gently
      const current = query.state.data
      if (current && current.status === 'IN_PROGRESS' && !current.conclusion) {
        return 4000
      }
      return false
    },
  })

  // Conclude mutation
  const concludeMutation = useMutation({
    mutationFn: (invId: string) => api.concludeInvestigation(invId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investigation', id] })
    },
  })

  const handleOpenDocument = (documentId: string, sourceLabel?: string) => {
    setSelectedDocId(documentId)
    setSelectedDocLabel(sourceLabel || null)
  }

  const handleCloseDocument = () => {
    setSelectedDocId(null)
    setSelectedDocLabel(null)
  }

  // Loading State
  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">Loading Investigation State</h2>
          <p className="text-sm text-muted-foreground">
            Fetching verified evidence traces, timeline chronology, and reasoned conclusions...
          </p>
        </div>
      </div>
    )
  }

  // Error State
  if (error || !state) {
    const apiErr = error instanceof ApiError ? error : null

    return (
      <div className="max-w-2xl mx-auto py-12 space-y-6">
        <Link
          to="/history"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to History
        </Link>

        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 space-y-4">
          <div className="flex items-center gap-3 text-destructive">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <h2 className="text-lg font-bold">Investigation Not Available</h2>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            {apiErr?.message ||
              'Could not load the requested investigation state. Please verify the ID or ensure the backend server is reachable.'}
          </p>

          {apiErr?.detail && (
            <div className="p-3 rounded bg-muted/60 font-mono text-xs text-foreground overflow-x-auto">
              {apiErr.detail}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Try Again
            </button>
            <Link
              to="/investigations/new"
              className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
            >
              Start New Investigation
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const isProviderLimited =
    state.status === 'PROVIDER_LIMITED' ||
    state.status === 'INVESTIGATION_PROVIDER_FAILURE' ||
    state.conclusion?.conclusion_status === 'PROVIDER_LIMITED'

  return (
    <div className="space-y-8 animate-in fade-in pb-12 max-w-[1600px] mx-auto">
      {/* Top Back Nav & Quick Actions */}
      <div className="flex items-center justify-between">
        <Link
          to="/history"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Investigation Archive
        </Link>

        <Link
          to="/investigations/new"
          className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-ai font-bold transition-colors"
        >
          <FileSearch className="w-3.5 h-3.5" /> New Investigation
        </Link>
      </div>

      {/* Header Panel */}
      <InvestigationHeader
        state={state}
        onConclude={() => state.investigation_id && concludeMutation.mutate(state.investigation_id)}
        isConcluding={concludeMutation.isPending}
      />

      {/* Step Flow Pipeline - Investigation Journey */}
      <InvestigationProgress state={state} />

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Left Column (70%) */}
        <div className="xl:col-span-8 space-y-8">
          {/* Prominent Final Conclusion Panel */}
          {state.conclusion && (
            <section aria-label="Investigation Conclusion">
              <ConclusionPanel
                conclusion={state.conclusion}
                findings={state.conclusion.findings}
                onSelectDocument={handleOpenDocument}
              />
            </section>
          )}

          {/* Chronological Timeline */}
          <section aria-label="Chronology and Timeline">
            <TimelineView
              timeline={state.conclusion?.timeline || []}
              onSelectDocument={handleOpenDocument}
            />
          </section>

          {/* Contradictions Section if detected */}
          {state.contradictions && state.contradictions.length > 0 && (
            <section aria-label="Contradictions">
              <ContradictionsSection
                contradictions={state.contradictions}
                evidence={state.retrieved_evidence || []}
                onSelectDocument={handleOpenDocument}
              />
            </section>
          )}

          {/* Historical Comparison if similar incident relationships detected */}
          {state.relationships && state.relationships.length > 0 && (
            <section aria-label="Historical Comparison">
              <HistoricalComparison
                relationships={state.relationships}
                evidence={state.retrieved_evidence || []}
                onSelectDocument={handleOpenDocument}
              />
            </section>
          )}

          {/* Autonomous Follow-Up Iterations (Phase 5 Differentiator) */}
          <section aria-label="Follow-Up Investigation">
            <FollowUpSection
              iterationCount={state.iteration_count || 1}
              followUpQueries={state.follow_up_queries || []}
              openQuestions={state.open_questions || []}
              evidence={state.retrieved_evidence || []}
              isProviderLimited={isProviderLimited}
              onSelectDocument={handleOpenDocument}
            />
          </section>

          {/* Open Questions Panel */}
          <section aria-label="Open Questions">
            <OpenQuestionsList
              questions={state.open_questions || []}
              onSelectDocument={handleOpenDocument}
            />
          </section>
        </div>

        {/* Right Column (30%) */}
        <div className="xl:col-span-4 space-y-8 xl:sticky xl:top-24">
          {/* Evidence Explorer */}
          <section aria-label="Retrieved Evidence">
            <EvidenceExplorer
              evidence={state.retrieved_evidence || []}
              sourceReferences={state.conclusion?.source_references || []}
              onSelectDocument={handleOpenDocument}
            />
          </section>

          {/* Key Findings List (Moved to right column) */}
          <section aria-label="Key Findings">
            <FindingsList
              findings={state.conclusion?.findings || []}
              sourceReferences={state.conclusion?.source_references || []}
              onSelectDocument={handleOpenDocument}
            />
          </section>
        </div>
      </div>

      {/* Document Detail Modal */}
      <DocumentModal
        documentId={selectedDocId}
        sourceLabel={selectedDocLabel}
        onClose={handleCloseDocument}
      />
    </div>
  )
}
