import { Button } from "@workspace/ui/components/button"
import { ExternalLink } from "lucide-react"
import type { Source } from "../../types"

interface SourceCitationProps {
  source: Source
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

  return (
    <div className="mt-3 rounded-lg border border-border bg-card p-3">
      <div className="text-xs text-muted-foreground mb-2">Source du document :</div>
      <div className="space-y-2">
        <div>
          <p className="font-medium text-sm">{source.documentName}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Modifié: {formatDate(source.lastModified)}</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Confiance: {Math.round(source.confidenceScore * 100)}%</span>
            <Button
              variant="ghost"
              size="xs"
              asChild
              className="h-auto p-0"
            >
              <a href={source.driveUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                Ouvrir <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
