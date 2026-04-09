import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { CheckCircle } from "lucide-react"
import { useEffect, useState } from "react"
import apiClient from "../../api/client"
import { AdminLayout } from "../../components/layout/AdminLayout"
import type { Feedback, FeedbacksResponse } from "../../types"

export function FeedbacksPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [status, setStatus] = useState<"all" | "PENDING" | "RESOLVED">("all")
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    loadFeedbacks()
  }, [page, status])

  const loadFeedbacks = async () => {
    setIsLoading(true)
    setError("")
    try {
      const response = await apiClient.get<FeedbacksResponse>("/admin/feedbacks", {
        params: {
          page,
          limit: 10,
          status: status === "all" ? undefined : status,
        },
      })
      setFeedbacks(response.data.feedbacks)
      setTotalPages(Math.ceil(response.data.total / response.data.limit))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResolve = async (feedbackId: string) => {
    setActionLoading(feedbackId)
    try {
      await apiClient.patch(`/admin/feedbacks/${feedbackId}/resolve`)
      loadFeedbacks()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la résolution")
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <AdminLayout currentPage="feedbacks">
      <div className="p-6">
        <h1 className="mb-6 text-3xl font-bold">Retours utilisateurs</h1>

        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 p-4 text-destructive">
            {error}
          </div>
        )}

        <div className="mb-4 flex gap-2">
          <Button
            variant={status === "all" ? "default" : "outline"}
            onClick={() => {
              setStatus("all")
              setPage(1)
            }}
          >
            Tous
          </Button>
          <Button
            variant={status === "PENDING" ? "default" : "outline"}
            onClick={() => {
              setStatus("PENDING")
              setPage(1)
            }}
          >
            En attente
          </Button>
          <Button
            variant={status === "RESOLVED" ? "default" : "outline"}
            onClick={() => {
              setStatus("RESOLVED")
              setPage(1)
            }}
          >
            Résolus
          </Button>
        </div>

        {isLoading && (
          <div className="text-center text-muted-foreground">Chargement...</div>
        )}

        {!isLoading && feedbacks.length === 0 && (
          <div className="text-center text-muted-foreground">Aucun retour trouvé</div>
        )}

        {!isLoading && feedbacks.length > 0 && (
          <>
            <div className="space-y-4">
              {feedbacks.map((feedback) => (
                <div key={feedback.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium">Question: {feedback.question}</p>
                      {feedback.comment && (
                        <p className="mt-2 text-sm text-muted-foreground">Commentaire: {feedback.comment}</p>
                      )}
                    </div>
                    <Badge
                      variant={feedback.status === "PENDING" ? "pending" : "success"}
                    >
                      {feedback.status === "PENDING" ? "En attente" : "Résolu"}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {new Date(feedback.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                    {feedback.status === "PENDING" && (
                      <Button
                        size="sm"
                        onClick={() => handleResolve(feedback.id)}
                        disabled={actionLoading === feedback.id}
                        className="gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Résoudre
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-6 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Précédent
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} sur {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Suivant
              </Button>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
