import { supabase } from './supabase'
import type {
  InvestigationStateWithConclusion,
  InvestigationConclusion,
  DocumentResponse,
  InvestigationSummary,
} from '../types/investigation'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export class ApiError extends Error {
  status: number
  detail?: string

  constructor(status: number, message: string, detail?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    }
  } catch {
    // Auth token optional for unauthenticated public endpoints
  }
  return headers
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  const authHeaders = await getAuthHeaders()
  
  const mergedHeaders = {
    ...authHeaders,
    ...(options.headers as Record<string, string> || {}),
  }

  let response: Response
  try {
    response = await fetch(url, {
      ...options,
      headers: mergedHeaders,
    })
  } catch (err: any) {
    throw new ApiError(
      0,
      'Failed to connect to IncidentIQ backend server. Ensure the backend is running at ' + API_BASE_URL,
      err?.message
    )
  }

  if (!response.ok) {
    let errorDetail = ''
    try {
      const errJson = await response.json()
      errorDetail = errJson.detail || errJson.message || JSON.stringify(errJson)
    } catch {
      errorDetail = await response.text()
    }

    let message = `Request failed with status ${response.status}`
    if (response.status === 400) {
      message = errorDetail || 'Invalid investigation request parameters.'
    } else if (response.status === 401) {
      message = 'Authentication required. Please sign in.'
    } else if (response.status === 404) {
      message = errorDetail || 'The requested resource was not found.'
    } else if (response.status === 422) {
      message = errorDetail || 'Data validation error.'
    } else if (response.status === 500) {
      message = errorDetail || 'IncidentIQ backend encountered an internal error.'
    }

    throw new ApiError(response.status, message, errorDetail)
  }

  return response.json() as Promise<T>
}

export const api = {
  /**
   * Submit a new natural-language incident question to initiate an investigation.
   */
  async createInvestigation(question: string): Promise<InvestigationStateWithConclusion> {
    return request<InvestigationStateWithConclusion>('/api/investigations', {
      method: 'POST',
      body: JSON.stringify({ question }),
    })
  },

  /**
   * Fetch an investigation state with conclusion by UUID.
   */
  async getInvestigation(id: string): Promise<InvestigationStateWithConclusion> {
    return request<InvestigationStateWithConclusion>(`/api/investigations/${id}`)
  },

  /**
   * Explicitly re-run or trigger reasoning on an existing investigation.
   */
  async concludeInvestigation(id: string): Promise<InvestigationConclusion> {
    return request<InvestigationConclusion>(`/api/investigations/${id}/conclude`, {
      method: 'POST',
    })
  },

  /**
   * Fetch a single document by its UUID.
   */
  async getDocument(documentId: string): Promise<DocumentResponse> {
    return request<DocumentResponse>(`/api/documents/${documentId}`)
  },

  /**
   * List past investigations with graceful fallback to direct Supabase query if backend is unreachable.
   */
  async listInvestigations(limit = 50, offset = 0): Promise<InvestigationSummary[]> {
    try {
      return await request<InvestigationSummary[]>(`/api/investigations?limit=${limit}&offset=${offset}`)
    } catch (apiErr) {
      // Graceful fallback to Supabase direct query
      try {
        const { data, error } = await supabase
          .from('investigations')
          .select('id, original_question, status, iteration_count, created_at, updated_at, investigation_conclusions(conclusion_status, confidence, summary)')
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1)

        if (error) {
          throw error
        }

        return (data || []).map((row: any) => {
          const conclusion = Array.isArray(row.investigation_conclusions)
            ? row.investigation_conclusions[0]
            : row.investigation_conclusions

          return {
            id: row.id,
            original_question: row.original_question,
            status: row.status,
            iteration_count: row.iteration_count ?? 1,
            conclusion_status: conclusion?.conclusion_status ?? null,
            confidence: conclusion?.confidence ?? null,
            summary: conclusion?.summary ?? null,
            created_at: row.created_at,
            updated_at: row.updated_at,
          }
        })
      } catch {
        // If both failed, throw original api error
        throw apiErr
      }
    }
  },
}
