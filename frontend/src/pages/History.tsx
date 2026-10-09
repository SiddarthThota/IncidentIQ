import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import {
  History as HistoryIcon,
  Search,
  ArrowRight,
  Clock,
  Layers,
  Loader2,
  FileSearch,
} from 'lucide-react'

export function History() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const { data: investigations = [], isLoading } = useQuery({
    queryKey: ['investigations-history'],
    queryFn: () => api.listInvestigations(100, 0),
  })

  // Filter investigations
  const filtered = investigations.filter(inv => {
    const matchesSearch = inv.original_question
      .toLowerCase()
      .includes(searchTerm.toLowerCase().trim())

    if (!matchesSearch) return false

    if (statusFilter === 'ALL') return true
    if (statusFilter === 'COMPLETED') return inv.status === 'COMPLETED'
    if (statusFilter === 'IN_PROGRESS') return inv.status === 'IN_PROGRESS' || inv.status === 'INITIALIZED'
    if (statusFilter === 'INSUFFICIENT') return inv.conclusion_status === 'INSUFFICIENT'
    if (statusFilter === 'PROVIDER_LIMITED') {
      return (
        inv.status === 'PROVIDER_LIMITED' ||
        inv.conclusion_status === 'PROVIDER_LIMITED' ||
        inv.status === 'INVESTIGATION_PROVIDER_FAILURE'
      )
    }

    return true
  })

  const getConclusionBadge = (status?: string | null) => {
    if (!status) return null

    switch (status) {
      case 'SUPPORTED':
        return (
          <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full bg-success-background text-success border border-success/20">
            SUPPORTED
          </span>
        )
      case 'PARTIALLY_SUPPORTED':
        return (
          <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full bg-warning-background text-warning border border-warning/20">
            PARTIALLY SUPPORTED
          </span>
        )
      case 'INSUFFICIENT':
        return (
          <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full bg-warning-background text-warning border border-warning/20">
            INSUFFICIENT
          </span>
        )
      case 'CONTRADICTED':
        return (
          <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full bg-destructive-background text-destructive border border-destructive/20">
            CONTRADICTED
          </span>
        )
      case 'PROVIDER_LIMITED':
        return (
          <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary-light text-primary border border-primary/20">
            PROVIDER LIMITED
          </span>
        )
      default:
        return (
          <span className="font-mono text-[10px] font-medium px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
            {status}
          </span>
        )
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Investigation History
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Audit logs and conclusions across past incident investigations
          </p>
        </div>

        <Link
          to="/investigations/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-xs"
        >
          <FileSearch className="w-4 h-4" /> New Investigation
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search investigations by question or keyword..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Filter by Status"
        >
          <option value="ALL">All Statuses</option>
          <option value="COMPLETED">Completed</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="INSUFFICIENT">Insufficient Evidence</option>
          <option value="PROVIDER_LIMITED">Provider Limited</option>
        </select>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading past investigations...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="p-4 bg-muted/60 rounded-full text-muted-foreground">
            <HistoryIcon className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">
              {searchTerm || statusFilter !== 'ALL'
                ? 'No matching investigations found'
                : 'No investigations launched yet'}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm">
              {searchTerm || statusFilter !== 'ALL'
                ? 'Try adjusting your search keywords or status filter.'
                : 'Submit your first natural-language operational incident question to generate an investigation trail.'}
            </p>
          </div>
          <Link
            to="/investigations/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
          >
            Start Investigation
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(inv => {
            return (
              <Link
                key={inv.id}
                to={`/investigations/${inv.id}`}
                className="group rounded-xl border border-border bg-card p-5 hover:border-primary/50 hover:bg-muted/30 transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[10px] text-muted-foreground uppercase px-2 py-0.5 rounded bg-muted border border-border">
                      ID: {inv.id.slice(0, 8)}
                    </span>

                    {/* Status Pill */}
                    <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded uppercase border bg-muted text-muted-foreground border-border">
                      {inv.status}
                    </span>

                    {/* Conclusion Status if available */}
                    {getConclusionBadge(inv.conclusion_status)}

                    {/* Iteration Badge */}
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                      <Layers className="w-3 h-3" />
                      Iter {inv.iteration_count || 1}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-snug truncate">
                    "{inv.original_question}"
                  </h3>

                  {inv.summary && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {inv.summary}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 text-xs text-muted-foreground">
                  {inv.created_at && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(inv.created_at).toLocaleDateString()}
                    </span>
                  )}

                  <div className="inline-flex items-center gap-1 font-semibold text-primary group-hover:translate-x-1 transition-transform">
                    View <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
