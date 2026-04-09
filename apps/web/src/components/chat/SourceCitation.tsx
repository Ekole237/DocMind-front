import { Button } from "@workspace/ui/components/button"
import { ExternalLink, FileText, CheckCircle2 } from "lucide-react"
import type { ChatSource } from "../../types"

interface SourceCitationProps {
  source: ChatSource
}

export function SourceCitation({ source }: SourceCitationProps) {
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

  const confidenceColor = 
    source.confidenceScore >= 0.8 ? "text-green-600 dark:text-green-400" :
    source.confidenceScore >= 0.5 ? "text-yellow-600 dark:text-yellow-400" :
    "text-red-600 dark:text-red-400"

  return (
    <div className="mt-2 flex max-w-[85%] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md">
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

        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1.5 text-xs font-medium bg-muted px-2 py-1 rounded-md">
            <CheckCircle2 className={`h-3.5 w-3.5 ${confidenceColor}`} />
            <span>Fiabilité : {Math.round(source.confidenceScore * 100)}%</span>
          </div>
          
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
  )
}
