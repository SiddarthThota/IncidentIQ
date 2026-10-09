import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import {
  Search,
  History,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Layers,
} from 'lucide-react'

export function Dashboard() {
  const { data: recentInvestigations = [], isLoading } = useQuery({
    queryKey: ['recent-investigations'],
    queryFn: () => api.listInvestigations(5, 0),
  })

  return (
    <div className="space-y-8 animate-in fade-in pb-12">
      {/* Hero Welcome Card */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-card via-card to-primary/5 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" /> Operational Intelligence
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Investigate incidents with evidence, not guesses.
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl pt-1">
            Search operational evidence, follow discovered leads, compare historical context, and produce traceable conclusions.
          </p>
        </div>

        {/* Visual Pipeline */}
        <div className="flex items-center gap-2 pt-2 text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider overflow-x-auto">
          <span className="text-ai">ASK</span> <ArrowRight className="w-3 h-3" />
          <span className="text-ai">SEARCH</span> <ArrowRight className="w-3 h-3" />
          <span className="text-ai">INVESTIGATE</span> <ArrowRight className="w-3 h-3" />
          <span className="text-ai">VERIFY</span> <ArrowRight className="w-3 h-3" />
          <span className="text-emerald-400">CONCLUDE</span>
        </div>

        {/* Primary and Secondary CTA Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-3">
          <Link
            to="/investigations/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-xs"
          >
            <Search className="w-4 h-4" /> Start Investigation
          </Link>

          <Link
            to="/history"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-secondary text-secondary-foreground text-sm font-semibold hover:bg-secondary/80 transition-colors border border-border"
          >
            <History className="w-4 h-4" /> View Investigation History
          </Link>
        </div>
      </div>

      {/* Investigation Pipeline Workflow Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-5 space-y-2 shadow-sm transition-shadow hover:shadow-md">
          <div className="p-2.5 w-fit rounded-lg bg-primary/10 text-primary">
            <Search className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Semantic & Metadata Retrieval</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Vector embeddings combined with exact metadata filtering across dates, versions, and service identifiers.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-2 shadow-sm transition-shadow hover:shadow-md">
          <div className="p-2.5 w-fit rounded-lg bg-indigo-100 text-indigo-700">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Autonomous Follow-Up Loop</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Formulates targeted sub-queries to resolve missing information, predecessor deployments, and context gaps.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-2 shadow-sm transition-shadow hover:shadow-md">
          <div className="p-2.5 w-fit rounded-lg bg-emerald-100 text-emerald-700">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Traceable Conclusions</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Every statement is cited to verified source documents. Strict guardrails prohibit inventing evidence or claiming unverified causation.
          </p>
        </div>
      </div>

      {/* Recent Investigations List */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Recent Investigations</h3>
          <Link
            to="/history"
            className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1"
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="p-5">
          {isLoading ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              Loading recent investigations...
            </div>
          ) : recentInvestigations.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center space-y-3">
              <Search className="w-8 h-8 opacity-40 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">No recent investigations found</p>
                <p className="text-xs text-muted-foreground">
                  Launch your first inquiry to see evidence graphs and chronological analysis.
                </p>
              </div>
              <Link
                to="/investigations/new"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium pt-1"
              >
                Start an investigation <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentInvestigations.slice(0, 5).map(inv => (
                <Link
                  key={inv.id}
                  to={`/investigations/${inv.id}`}
                  className="py-3 px-2 flex items-center justify-between gap-4 hover:bg-muted/40 rounded-lg transition-colors group"
                >
                  <div className="space-y-1 min-w-0">
                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                      "{inv.original_question}"
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-mono text-[10px] uppercase">{inv.status}</span>
                      <span>•</span>
                      {inv.created_at && (
                        <span>{new Date(inv.created_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-transform shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
