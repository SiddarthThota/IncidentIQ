import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { X, FileText, Calendar, Tag, Server, GitBranch, Copy, Check, Loader2, AlertCircle } from 'lucide-react'

interface DocumentModalProps {
  documentId: string | null
  sourceLabel?: string | null
  onClose: () => void
}

export function DocumentModal({ documentId, sourceLabel, onClose }: DocumentModalProps) {
  const [copied, setCopied] = useState(false)

  const { data: document, isLoading, error } = useQuery({
    queryKey: ['document', documentId],
    queryFn: () => (documentId ? api.getDocument(documentId) : null),
    enabled: !!documentId,
  })

  if (!documentId) return null

  const handleCopy = () => {
    if (document?.content) {
      navigator.clipboard.writeText(document.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="doc-modal-title"
    >
      <div className="bg-card text-card-foreground border border-border rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-primary/15 text-primary border border-primary/20">
                  {document?.source || sourceLabel || 'DOC'}
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  {documentId.slice(0, 8)}...
                </span>
              </div>
              <h3 id="doc-modal-title" className="text-base font-semibold tracking-tight text-foreground mt-0.5">
                {document?.title || (isLoading ? 'Loading document...' : 'Source Document')}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Close document modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {isLoading && (
            <div className="py-16 flex flex-col items-center justify-center text-muted-foreground space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Fetching verified source document from database...</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Failed to load source document</p>
                <p className="text-xs mt-1 text-muted-foreground">
                  Document ID: {documentId}. The document may be restricted or unavailable.
                </p>
              </div>
            </div>
          )}

          {document && (
            <>
              {/* Metadata Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-muted/40 border border-border flex flex-col gap-1">
                  <span className="text-muted-foreground flex items-center gap-1 font-medium">
                    <Tag className="w-3 h-3" /> Type
                  </span>
                  <span className="font-semibold capitalize text-foreground">
                    {document.document_type.replace('_', ' ')}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-muted/40 border border-border flex flex-col gap-1">
                  <span className="text-muted-foreground flex items-center gap-1 font-medium">
                    <Server className="w-3 h-3" /> Service
                  </span>
                  <span className="font-semibold text-foreground">
                    {document.service || 'N/A'}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-muted/40 border border-border flex flex-col gap-1">
                  <span className="text-muted-foreground flex items-center gap-1 font-medium">
                    <GitBranch className="w-3 h-3" /> Version
                  </span>
                  <span className="font-semibold text-foreground">
                    {document.software_version || 'N/A'}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-muted/40 border border-border flex flex-col gap-1">
                  <span className="text-muted-foreground flex items-center gap-1 font-medium">
                    <Calendar className="w-3 h-3" /> Document Date
                  </span>
                  <span className="font-semibold text-foreground">
                    {document.document_date || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Full Content */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-muted-foreground uppercase tracking-wider">
                    Document Text
                  </span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy Text
                      </>
                    )}
                  </button>
                </div>
                <div className="p-4 rounded-lg bg-muted/30 border border-border font-mono text-xs leading-relaxed whitespace-pre-wrap text-foreground max-h-96 overflow-y-auto">
                  {document.content}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
