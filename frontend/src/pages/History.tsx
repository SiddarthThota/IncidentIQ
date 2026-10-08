import { History as HistoryIcon } from 'lucide-react'

export function History() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Investigation History</h1>
        <p className="text-muted-foreground mt-1">Review past incidents and evidence analyses.</p>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden min-h-[400px] flex flex-col items-center justify-center p-8 text-center">
        <div className="p-4 bg-muted/50 rounded-full mb-4">
          <HistoryIcon className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No History Available</h3>
        <p className="text-muted-foreground max-w-md">
          You haven't run any investigations yet. Once you start asking questions, your investigation traces and conclusions will appear here.
        </p>
      </div>
    </div>
  )
}
