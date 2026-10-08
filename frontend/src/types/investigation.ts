export type EvidenceClassification =
  | 'DIRECT'
  | 'CORROBORATED'
  | 'TEMPORAL'
  | 'INFERRED'
  | 'CONTRADICTED'
  | 'INSUFFICIENT'

export type RelationshipType =
  | 'TEMPORAL_BEFORE'
  | 'TEMPORAL_AFTER'
  | 'SAME_SERVICE'
  | 'SAME_FAILURE_TYPE'
  | 'SAME_VERSION'
  | 'DIFFERENT_VERSION'
  | 'SIMILAR_INCIDENT'
  | 'POSSIBLE_RELATION'
  | 'CONTRADICTS'
  | 'CORROBORATES'

export type ConclusionStatus =
  | 'SUPPORTED'
  | 'PARTIALLY_SUPPORTED'
  | 'INSUFFICIENT'
  | 'CONTRADICTED'
  | 'PROVIDER_LIMITED'

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW'

export type FindingClassification =
  | 'DIRECT'
  | 'CORROBORATED'
  | 'TEMPORAL'
  | 'INFERRED'
  | 'CONTRADICTED'
  | 'INSUFFICIENT'

export interface TimelineEvent {
  id?: string
  event_label: string
  event_date?: string | null
  event_timestamp?: string | null
  document_date?: string | null
  source_label?: string | null
  software_version?: string | null
  service?: string | null
  evidence_id?: string | null
  ordering: number
}

export interface SourceReference {
  id?: string
  source_label: string
  document_id?: string | null
  evidence_id?: string | null
}

export interface InvestigationFinding {
  id?: string
  statement: string
  classification: FindingClassification
  confidence: ConfidenceLevel
  reasoning_basis?: string | null
  evidence_ids: string[]
  document_ids: string[]
  chunk_ids: string[]
}

export interface InvestigationConclusion {
  id?: string
  investigation_id: string
  summary: string
  conclusion_status: ConclusionStatus
  confidence: ConfidenceLevel
  uncertainty_notes?: string | null
  findings: InvestigationFinding[]
  timeline: TimelineEvent[]
  source_references: SourceReference[]
  unresolved_questions: string[]
  generated_at?: string | null
}

export interface InvestigationQuestionAnalysis {
  normalized_question: string
  entities: string[]
  services: string[]
  dates: string[]
  software_versions: string[]
  investigation_intent: string
  subquestions: string[]
}

export interface InvestigationEvidenceClaim {
  id?: string
  evidence_id?: string | null
  claim_text: string
  classification: EvidenceClassification
  confidence?: number | null
}

export interface InvestigationEvidence {
  id?: string
  document_id: string
  chunk_id: string
  claims: InvestigationEvidenceClaim[]
  source_text?: string | null
  source?: string | null
}

export interface InvestigationRelationship {
  id?: string
  source_evidence_id: string
  target_evidence_id: string
  relationship_type: RelationshipType
  explanation?: string | null
  confidence?: number | null
}

export interface InvestigationContradiction {
  id?: string
  evidence_1_id: string
  evidence_2_id: string
  conflicting_claims: string
  context_info?: string | null
  status: string
}

export interface InvestigationOpenQuestion {
  id?: string
  question: string
  reason?: string | null
  related_evidence_id?: string | null
  why_it_matters?: string | null
  supporting_evidence_ids: string[]
  status: 'OPEN' | 'RESOLVED' | 'UNRESOLVED' | 'SKIPPED' | 'BLOCKED' | string
  generated_at?: string | null
  resolved_by_evidence_ids: string[]
  resolution_reason?: string | null
}

export interface InvestigationFollowUpQuery {
  id?: string
  question_id?: string | null
  query_text: string
  reason?: string | null
  supporting_evidence_ids: string[]
  priority?: string | null
  status: 'PENDING' | 'EXECUTED' | 'SKIPPED' | 'FAILED' | 'NO_RESULTS' | string
  iteration: number
  retrieved_result_ids: string[]
}

export interface InvestigationEvent {
  id?: string
  event_type: string
  details?: string | null
  timestamp?: string | null
}

export interface InvestigationState {
  investigation_id?: string | null
  original_question: string
  analysis?: InvestigationQuestionAnalysis | null
  retrieved_evidence: InvestigationEvidence[]
  relationships: InvestigationRelationship[]
  contradictions: InvestigationContradiction[]
  open_questions: InvestigationOpenQuestion[]
  follow_up_queries: InvestigationFollowUpQuery[]
  events: InvestigationEvent[]
  iteration_count: number
  status: string
  created_at?: string | null
  updated_at?: string | null
}

export interface InvestigationStateWithConclusion extends InvestigationState {
  conclusion?: InvestigationConclusion | null
}

export interface DocumentResponse {
  id: string
  document_type: string
  service?: string | null
  document_date?: string | null
  software_version?: string | null
  title: string
  source: string
  content: string
  created_at: string
  updated_at: string
}

export interface InvestigationSummary {
  id: string
  original_question: string
  status: string
  iteration_count: number
  conclusion_status?: ConclusionStatus | null
  confidence?: ConfidenceLevel | null
  summary?: string | null
  created_at?: string | null
  updated_at?: string | null
}
