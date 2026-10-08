import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { ConclusionPanel } from '../components/investigation/ConclusionPanel'
import { FindingsList } from '../components/investigation/FindingsList'
import { TimelineView } from '../components/investigation/TimelineView'
import { EvidenceExplorer } from '../components/investigation/EvidenceExplorer'
import { FollowUpSection } from '../components/investigation/FollowUpSection'
import { OpenQuestionsList } from '../components/investigation/OpenQuestionsList'
import { ContradictionsSection } from '../components/investigation/ContradictionsSection'
import { HistoricalComparison } from '../components/investigation/HistoricalComparison'
import { NewInvestigation } from '../pages/NewInvestigation'
import { History } from '../pages/History'
import { InvestigationDetail } from '../pages/InvestigationDetail'
import { Login } from '../pages/Login'
import { api } from '../lib/api'
import type {
  InvestigationConclusion,
  InvestigationFinding,
  TimelineEvent,
  InvestigationEvidence,
  InvestigationContradiction,
  InvestigationRelationship,
  InvestigationOpenQuestion,
  InvestigationFollowUpQuery,
  InvestigationStateWithConclusion,
} from '../types/investigation'

// Mock api
vi.mock('../lib/api', () => ({
  api: {
    createInvestigation: vi.fn(),
    getInvestigation: vi.fn(),
    concludeInvestigation: vi.fn(),
    getDocument: vi.fn(),
    listInvestigations: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    status: number
    detail?: string
    constructor(status: number, message: string, detail?: string) {
      super(message)
      this.status = status
      this.detail = detail
    }
  },
}))

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue({}),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
  },
}))

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
}

describe('Investigation Experience Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders ConclusionPanel with SUPPORTED status and executive summary', () => {
    const conclusion: InvestigationConclusion = {
      investigation_id: 'inv-123',
      conclusion_status: 'SUPPORTED',
      confidence: 'HIGH',
      summary: 'Order API latency was caused by connection pool exhaustion during release v2.8.1.',
      findings: [],
      timeline: [],
      source_references: [
        { source_label: 'INC-1042', document_id: 'doc-1' },
      ],
      unresolved_questions: [],
    }

    render(<ConclusionPanel conclusion={conclusion} />)

    expect(screen.getByText('Investigation Supported')).toBeInTheDocument()
    expect(screen.getByText('Status: SUPPORTED')).toBeInTheDocument()
    expect(screen.getByText('Confidence: HIGH')).toBeInTheDocument()
    expect(screen.getByText(/Order API latency was caused by connection pool exhaustion/)).toBeInTheDocument()
    expect(screen.getByText('INC-1042')).toBeInTheDocument()
  })

  it('renders Causation Boundary Warning when temporal finding is present', () => {
    const conclusion: InvestigationConclusion = {
      investigation_id: 'inv-123',
      conclusion_status: 'PARTIALLY_SUPPORTED',
      confidence: 'MEDIUM',
      summary: 'Deployment preceded incident. Temporal association established.',
      findings: [],
      timeline: [],
      source_references: [],
      unresolved_questions: [],
    }

    const findings: InvestigationFinding[] = [
      {
        statement: 'v2.8.1 was deployed 2 hours before latency spiked.',
        classification: 'TEMPORAL',
        confidence: 'HIGH',
        evidence_ids: [],
        document_ids: [],
        chunk_ids: [],
      },
    ]

    render(<ConclusionPanel conclusion={conclusion} findings={findings} />)

    expect(screen.getByText('Causation Boundary Notice')).toBeInTheDocument()
    expect(screen.getByText(/Temporal association established. Causation was not established/)).toBeInTheDocument()
  })

  it('renders INSUFFICIENT evidence conclusion state clearly', () => {
    const conclusion: InvestigationConclusion = {
      investigation_id: 'inv-404',
      conclusion_status: 'INSUFFICIENT',
      confidence: 'LOW',
      summary: 'No documented incidents found matching database corruptions on this cluster.',
      uncertainty_notes: 'Missing metrics telemetry for that timeframe.',
      unresolved_questions: ['What was the database replica status?'],
      findings: [],
      timeline: [],
      source_references: [],
    }

    render(<ConclusionPanel conclusion={conclusion} />)

    expect(screen.getByText('Insufficient Evidence')).toBeInTheDocument()
    expect(screen.getByText('Status: INSUFFICIENT')).toBeInTheDocument()
    expect(screen.getByText('Insufficient Evidence Grounding')).toBeInTheDocument()
    expect(screen.getByText('What was the database replica status?')).toBeInTheDocument()
  })

  it('renders PROVIDER_LIMITED conclusion fallback state gracefully', () => {
    const conclusion: InvestigationConclusion = {
      investigation_id: 'inv-503',
      conclusion_status: 'PROVIDER_LIMITED',
      confidence: 'LOW',
      summary: 'Reasoning service fallback: raw findings preserved.',
      findings: [],
      timeline: [],
      source_references: [],
      unresolved_questions: [],
    }

    render(<ConclusionPanel conclusion={conclusion} />)

    expect(screen.getByText('Provider Limited Fallback')).toBeInTheDocument()
    expect(screen.getByText('Status: PROVIDER_LIMITED')).toBeInTheDocument()
    expect(screen.getByText('AI Provider Availability Notice')).toBeInTheDocument()
  })

  it('renders FindingsList with distinct classification badges', () => {
    const findings: InvestigationFinding[] = [
      {
        id: 'f-1',
        statement: 'Order API p99 latency increased to 3800ms.',
        classification: 'DIRECT',
        confidence: 'HIGH',
        reasoning_basis: 'Observed metrics in INC-1042.',
        evidence_ids: [],
        document_ids: ['d-1042' as any],
        chunk_ids: [],
      },
      {
        id: 'f-2',
        statement: 'Deploy completed shortly prior to incident.',
        classification: 'TEMPORAL',
        confidence: 'MEDIUM',
        reasoning_basis: 'DEP-882 timestamp 18:10 UTC.',
        evidence_ids: [],
        document_ids: [],
        chunk_ids: [],
      },
    ]

    render(<FindingsList findings={findings} />)

    expect(screen.getByText('DIRECT EVIDENCE')).toBeInTheDocument()
    expect(screen.getByText('TEMPORAL ASSOCIATION')).toBeInTheDocument()
    expect(screen.getByText(/Order API p99 latency increased to 3800ms/)).toBeInTheDocument()
    expect(screen.getByText(/Temporal precedence; not causal/)).toBeInTheDocument()
  })

  it('renders TimelineView distinguishing Event Date from Document Date', () => {
    const timeline: TimelineEvent[] = [
      {
        id: 't-1',
        event_label: 'Orders API v2.8.1 deployed to production',
        event_date: '2026-09-15' as any,
        document_date: '2026-09-17' as any,
        service: 'orders-api',
        software_version: '2.8.1',
        source_label: 'DEP-882',
        ordering: 0,
      },
    ]

    render(<TimelineView timeline={timeline} />)

    expect(screen.getByText('Evidence Chronology & Timeline')).toBeInTheDocument()
    expect(screen.getByText('Event Date: 2026-09-15')).toBeInTheDocument()
    expect(screen.getByText('Document Published: 2026-09-17')).toBeInTheDocument()
    expect(screen.getByText('Orders API v2.8.1 deployed to production')).toBeInTheDocument()
    expect(screen.getByText('DEP-882')).toBeInTheDocument()
  })

  it('renders EvidenceExplorer with excerpt and extracted claims', () => {
    const evidence: InvestigationEvidence[] = [
      {
        id: 'ev-1',
        document_id: 'doc-1042' as any,
        chunk_id: 'chunk-1' as any,
        source: 'INC-1042',
        source_text: 'Incident INC-1042: At 20:15 UTC latency began elevating on /orders.',
        claims: [
          {
            claim_text: 'Latency spiked on orders endpoint',
            classification: 'DIRECT',
            confidence: 0.95,
          },
        ],
      },
    ]

    render(<EvidenceExplorer evidence={evidence} />)

    expect(screen.getByText('Retrieved Evidence Explorer')).toBeInTheDocument()
    expect(screen.getByText('INC-1042')).toBeInTheDocument()
    expect(screen.getByText(/Incident INC-1042: At 20:15 UTC latency began elevating/)).toBeInTheDocument()
    expect(screen.getByText('Latency spiked on orders endpoint')).toBeInTheDocument()
  })

  it('renders ContradictionsSection with neutral comparison', () => {
    const contradictions: InvestigationContradiction[] = [
      {
        id: 'c-1',
        evidence_1_id: 'ev-1' as any,
        evidence_2_id: 'ev-2' as any,
        conflicting_claims: 'Older guide recommends restart; newer guide specifies avoiding restart during DB outage.',
        context_info: 'GUIDE-41 supersedes GUIDE-12 for Postgres connection failures.',
        status: 'OPEN',
      },
    ]

    const evidence: InvestigationEvidence[] = [
      { id: 'ev-1' as any, document_id: 'd1' as any, chunk_id: 'c1' as any, source: 'GUIDE-12', source_text: 'Always restart the pod.', claims: [] },
      { id: 'ev-2' as any, document_id: 'd2' as any, chunk_id: 'c2' as any, source: 'GUIDE-41', source_text: 'Do not restart during DB connection timeouts.', claims: [] },
    ]

    render(<ContradictionsSection contradictions={contradictions} evidence={evidence} />)

    expect(screen.getByText('Conflicting Evidence & Guidance Detected')).toBeInTheDocument()
    expect(screen.getByText('GUIDE-12')).toBeInTheDocument()
    expect(screen.getByText('GUIDE-41')).toBeInTheDocument()
    expect(screen.getByText(/GUIDE-41 supersedes GUIDE-12/)).toBeInTheDocument()
  })

  it('renders HistoricalComparison distinguishing Similar Incident from Exact Match', () => {
    const relationships: InvestigationRelationship[] = [
      {
        source_evidence_id: 'ev-1' as any,
        target_evidence_id: 'ev-2' as any,
        relationship_type: 'SIMILAR_INCIDENT',
        explanation: 'Analogous connection pool exhaustion was documented in PM-211.',
        confidence: 0.88,
      },
    ]

    const evidence: InvestigationEvidence[] = [
      { id: 'ev-1' as any, document_id: 'd1' as any, chunk_id: 'c1' as any, source: 'INC-1042', source_text: 'Active latency incident.', claims: [] },
      { id: 'ev-2' as any, document_id: 'd2' as any, chunk_id: 'c2' as any, source: 'PM-211', source_text: 'Historical postmortem.', claims: [] },
    ]

    render(<HistoricalComparison relationships={relationships} evidence={evidence} />)

    expect(screen.getByText('Historical Incident Correlation & Comparison')).toBeInTheDocument()
    expect(screen.getByText(/SIMILAR INCIDENT/)).toBeInTheDocument()
    expect(screen.getByText('NOT AN EXACT MATCH')).toBeInTheDocument()
    expect(screen.getByText('PM-211')).toBeInTheDocument()
  })

  it('renders FollowUpSection iterations and search queries', () => {
    const followUpQueries: InvestigationFollowUpQuery[] = [
      {
        query_text: 'orders-api deployment changelog September 15',
        reason: 'Identify whether deployment preceded latency spike',
        status: 'EXECUTED',
        iteration: 2,
        supporting_evidence_ids: [],
        retrieved_result_ids: ['res-882' as any],
      },
    ]

    render(
      <FollowUpSection
        iterationCount={2}
        followUpQueries={followUpQueries}
        openQuestions={[]}
        evidence={[]}
      />
    )

    expect(screen.getByText('Autonomous Iterative Follow-Up Investigation')).toBeInTheDocument()
    expect(screen.getByText('Iteration 1')).toBeInTheDocument()
    expect(screen.getByText('Iteration 2')).toBeInTheDocument()
    expect(screen.getByText(/"orders-api deployment changelog September 15"/)).toBeInTheDocument()
    expect(screen.getByText('EXECUTED')).toBeInTheDocument()
  })

  it('renders OpenQuestionsList with status and inquiry reason', () => {
    const questions: InvestigationOpenQuestion[] = [
      {
        id: 'q-1',
        question: 'Was a code change or database schema migration released in v2.8.1?',
        why_it_matters: 'Determine if code regression caused the connection leak.',
        status: 'RESOLVED',
        resolution_reason: 'DEP-882 confirms DB pool sizing configuration reduction.',
        supporting_evidence_ids: [],
        resolved_by_evidence_ids: [],
      },
    ]

    render(<OpenQuestionsList questions={questions} />)

    expect(screen.getByText('Investigation Inquiries & Open Questions')).toBeInTheDocument()
    expect(screen.getByText('RESOLVED')).toBeInTheDocument()
    expect(screen.getByText(/"Was a code change or database schema migration released in v2\.8\.1\?"/)).toBeInTheDocument()
  })
})

describe('Page Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders Login page and handles submission', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    expect(screen.getByText('Sign in to IncidentIQ')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('populates question input on example click without submitting automatically', () => {
    const queryClient = createTestQueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <NewInvestigation />
        </MemoryRouter>
      </QueryClientProvider>
    )

    const exampleBtn = screen.getByText(/Why did the Order API become slow on September 16\?/)
    fireEvent.click(exampleBtn)

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
    expect(textarea.value).toContain('Why did the Order API become slow on September 16?')
    expect(api.createInvestigation).not.toHaveBeenCalled()
  })

  it('validates and submits investigation', async () => {
    const queryClient = createTestQueryClient()
    vi.mocked(api.createInvestigation).mockResolvedValueOnce({
      investigation_id: 'inv-999',
      original_question: 'Why did the service fail?',
      status: 'COMPLETED',
      retrieved_evidence: [],
      relationships: [],
      contradictions: [],
      open_questions: [],
      follow_up_queries: [],
      events: [],
      iteration_count: 1,
    } as any)

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/investigations/new']}>
          <Routes>
            <Route path="/investigations/new" element={<NewInvestigation />} />
            <Route path="/investigations/:id" element={<div>Investigation Detail Page</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    )

    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'Why did the service fail?' } })

    const submitBtn = screen.getByRole('button', { name: /Launch Investigation/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(api.createInvestigation).toHaveBeenCalledWith('Why did the service fail?')
    })
  })

  it('renders InvestigationDetail page loading and completed states', async () => {
    const queryClient = createTestQueryClient()
    const mockState: InvestigationStateWithConclusion = {
      investigation_id: 'inv-100',
      original_question: 'Why did the orders-api become slow on September 16?',
      status: 'COMPLETED',
      iteration_count: 2,
      analysis: {
        normalized_question: 'orders-api latency september 16',
        entities: ['orders-api'],
        services: ['orders-api'],
        dates: [],
        software_versions: ['2.8.1'],
        investigation_intent: 'incident_cause',
        subquestions: [],
      },
      retrieved_evidence: [],
      relationships: [],
      contradictions: [],
      open_questions: [],
      follow_up_queries: [],
      events: [
        { event_type: 'INVESTIGATION_STARTED', details: 'Started' },
        { event_type: 'RETRIEVAL_COMPLETED', details: 'Found chunks' },
      ],
      conclusion: {
        investigation_id: 'inv-100',
        conclusion_status: 'SUPPORTED',
        confidence: 'HIGH',
        summary: 'Latency was caused by connection pool limits.',
        findings: [
          {
            statement: 'Pool limit reached 100 connections.',
            classification: 'DIRECT',
            confidence: 'HIGH',
            evidence_ids: [],
            document_ids: [],
            chunk_ids: [],
          },
        ],
        timeline: [],
        source_references: [],
        unresolved_questions: [],
      },
    }

    vi.mocked(api.getInvestigation).mockResolvedValueOnce(mockState)

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/investigations/inv-100']}>
          <Routes>
            <Route path="/investigations/:id" element={<InvestigationDetail />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    )

    // Initial loading indicator
    expect(screen.getByText('Loading Investigation State')).toBeInTheDocument()

    // Wait for resolution
    await waitFor(() => {
      expect(screen.getByText('"Why did the orders-api become slow on September 16?"')).toBeInTheDocument()
      expect(screen.getByText('Investigation Supported')).toBeInTheDocument()
      expect(screen.getByText(/Pool limit reached 100 connections/)).toBeInTheDocument()
    })
  })

  it('renders History page and filters by search text', async () => {
    const queryClient = createTestQueryClient()
    vi.mocked(api.listInvestigations).mockResolvedValueOnce([
      {
        id: 'inv-1',
        original_question: 'Orders API latency spike',
        status: 'COMPLETED',
        iteration_count: 2,
        conclusion_status: 'SUPPORTED',
        confidence: 'HIGH',
        created_at: '2026-09-16T12:00:00Z',
      },
      {
        id: 'inv-2',
        original_question: 'Payment gateway timeout',
        status: 'COMPLETED',
        iteration_count: 1,
        conclusion_status: 'INSUFFICIENT',
        confidence: 'LOW',
        created_at: '2026-09-17T12:00:00Z',
      },
    ])

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <History />
        </MemoryRouter>
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('"Orders API latency spike"')).toBeInTheDocument()
      expect(screen.getByText('"Payment gateway timeout"')).toBeInTheDocument()
    })

    // Search filter
    const searchInput = screen.getByPlaceholderText(/Search investigations by question/)
    fireEvent.change(searchInput, { target: { value: 'Payment' } })

    expect(screen.queryByText('"Orders API latency spike"')).not.toBeInTheDocument()
    expect(screen.getByText('"Payment gateway timeout"')).toBeInTheDocument()
  })
})
