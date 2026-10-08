import { Link } from 'react-router-dom'
import { FileText, Search, Activity, ArrowRight } from 'lucide-react'

export function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your operational investigations.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col items-center justify-center text-center h-48 space-y-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <Search className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-semibold">Start Investigation</h3>
          <p className="text-sm text-muted-foreground">Ask an operational question to search evidence.</p>
          <Link to="/investigate" className="text-primary hover:underline text-sm font-medium inline-flex items-center gap-1">
            New Investigation <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col items-center justify-center text-center h-48 space-y-2 opacity-75">
          <Activity className="w-6 h-6 text-muted-foreground" />
          <h3 className="font-semibold text-muted-foreground">Active Investigations</h3>
          <p className="text-sm text-muted-foreground">0 ongoing</p>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col items-center justify-center text-center h-48 space-y-2 opacity-75">
          <FileText className="w-6 h-6 text-muted-foreground" />
          <h3 className="font-semibold text-muted-foreground">Recent Evidence</h3>
          <p className="text-sm text-muted-foreground">0 documents analyzed</p>
        </div>
      </div>

      <div className="mt-8 rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="font-semibold">Recent Investigations</h3>
        </div>
        <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center space-y-3">
          <Search className="w-8 h-8 opacity-50" />
          <p>No recent investigations found.</p>
          <Link to="/investigate" className="text-primary hover:underline text-sm">
            Start your first investigation
          </Link>
        </div>
      </div>
    </div>
  )
}
