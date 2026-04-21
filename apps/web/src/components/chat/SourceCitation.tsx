import { Button } from "@workspace/ui/components/button"
import { Check, CheckCircle2, ChevronDown, Copy, ExternalLink, FileText } from "lucide-react"
import { useState } from "react"
import type { ChatSource } from "../../types"

interface SourceCitationProps {
  source: ChatSource
}

function splitByExactQuote(content: string, exactQuote?: string | null) {
  if (!exactQuote) return null

  const startIndex = content.indexOf(exactQuote)
  if (startIndex === -1) return null

  return {
    before: content.slice(0, startIndex),
    quote: exactQuote,
    after: content.slice(startIndex + exactQuote.length),
  }
}

export function SourceCitation({ source }: SourceCitationProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const rawContent = source.content ?? ""
  const highlightedExcerpt = splitByExactQuote(rawContent, source.exactQuote)

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch {
      return dateString
    }
  }

  const handleCopy = () => {
    if (source.content) {
      navigator.clipboard.writeText(source.content)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    }
  }

  const confidenceColor = 
    source.confidenceScore >= 0.8 ? "text-[var(--success-bg)]" :
    source.confidenceScore >= 0.5 ? "text-[var(--warning-bg)]" :
    "text-destructive"

  return (
    <div className="mt-2 flex w-full max-w-[85%] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center gap-2 border-b border-border/50 bg-muted/50 px-4 py-2">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Source du document</span>
      </div>
      
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-1">
            <h4 className="font-semibold text-sm leading-tight text-foreground line-clamp-2">
              {source.documentName}
            </h4>
            <p className="text-xs text-muted-foreground">
              Dernière modification : {formatDate(source.lastModified)}
            </p>
          </div>
        </div>

        {source.content && isExpanded && (
          <div className="relative mt-2">
            <div className="max-h-60 overflow-y-auto whitespace-pre-wrap break-words rounded-lg border-l-4 border-primary/50 bg-slate-50 p-4 pt-5 font-serif text-[13px] leading-relaxed text-slate-700 shadow-inner dark:bg-slate-900/50 dark:text-slate-300">
              {highlightedExcerpt ? (
                <>
                  {highlightedExcerpt.before}
                  <mark className="rounded-sm bg-[var(--warning-bg)]/30">
                    {highlightedExcerpt.quote}
                  </mark>
                  {highlightedExcerpt.after}
                </>
              ) : (
                rawContent
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1 right-1 h-7 w-7 rounded-md bg-background/50 hover:bg-background backdrop-blur-sm"
              onClick={handleCopy}
              title="Copier l'extrait"
            >
              {isCopied ? <Check className="h-3.5 w-3.5 text-[var(--success-bg)]" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
            </Button>
          </div>
        )}

        <div className="flex items-center justify-between mt-1 flex-wrap gap-2">
          <div className="flex items-center gap-1.5 text-xs font-medium bg-muted px-2 py-1 rounded-md">
            <CheckCircle2 className={`h-3.5 w-3.5 ${confidenceColor}`} />
            <span>Fiabilité : {Math.round(source.confidenceScore * 100)}%</span>
          </div>
          
          <div className="flex items-center gap-2">
            {source.content && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 gap-1.5 px-3 text-xs"
              >
                {isExpanded ? "Masquer" : "Voir l'extrait"}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
              </Button>
            )}
            <Button
              variant="default"
              size="sm"
              asChild
              className="h-8 gap-2 px-3 text-xs"
            >
              <a href={source.driveUrl} target="_blank" rel="noopener noreferrer">
                Ouvrir <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
