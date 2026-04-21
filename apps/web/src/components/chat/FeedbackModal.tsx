import { Button } from "@workspace/ui/components/button"
import { AlertCircle } from "lucide-react"
import { useState } from "react"

interface FeedbackModalProps {
  isOpen: boolean
  queryLogId: string
  onClose: () => void
  onSubmit: (comment?: string) => Promise<void>
}

export function FeedbackModal({ isOpen, onClose, onSubmit }: FeedbackModalProps) {
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async () => {
    setError("")
    setIsSubmitting(true)

    try {
      await onSubmit(comment || undefined)
      setSuccess(true)
      setTimeout(() => {
        setComment("")
        setSuccess(false)
        onClose()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-lg">
        <div className="mb-4 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <h2 className="font-semibold">Signaler une réponse</h2>
        </div>

        {success ? (
          <div className="mb-4 rounded-lg bg-[var(--success-bg)]/10 p-3 text-sm text-[var(--success-bg)]">
            ✓ Merci pour votre retour !
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <textarea
              placeholder="Commentaire (optionnel)..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={isSubmitting}
              className="mb-4 w-full rounded-lg border border-input bg-background p-2 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50"
              rows={4}
            />

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                Annuler
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Envoi..." : "Envoyer"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
