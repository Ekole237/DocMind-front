import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { CheckCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { admin } from "../../api/client"
import { AdminLayout } from "../../components/layout/AdminLayout"
import type { AdminFeedback, ApiError } from "../../types"

type StatusFilter = "all" | "PENDING" | "RESOLVED"

const LIMIT = 10

function getApiMessage(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: ApiError } }
  return e.response?.data?.message ?? fallback
}

export function FeedbacksPage() {
  const [feedbacks, setFeedbacks] = useState<AdminFeedback[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("PENDING")
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const totalPages = Math.max(1, Math.ceil(total / LIMIT))

  useEffect(() => {
    setIsLoading(true)
    setError("")
    admin
      .listFeedbacks(statusFilter, page)
      .then((data) => {
        setFeedbacks(data.feedbacks ?? [])
        setTotal(data.total ?? 0)
      })
      .catch((err) => setError(getApiMessage(err, "Erreur lors du chargement")))
      .finally(() => setIsLoading(false))
  }, [page, statusFilter])

  const handleResolve = async (id: string) => {
    setActionLoading(id)
    try {
      await admin.resolveFeedback(id)
      setFeedbacks((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status: "RESOLVED" as const } : f))
      )
    } catch (err) {
      setError(getApiMessage(err, "Erreur lors de la résolution"))
    } finally {
      setActionLoading(null)
    }
  }

  const tabs: { id: StatusFilter; label: string }[] = [
    { id: "PENDING", label: "En attente" },
    { id: "RESOLVED", label: "Résolus" },
    { id: "all", label: "Tous" },
  ]

  return (
    <AdminLayout currentPage="feedbacks">
      <div className="p-6">
        <h1 className="mb-6 text-3xl font-bold">Signalements</h1>

        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 p-4 text-destructive">{error}</div>
        )}

        {/* Tab-like filter */}
        <div className="mb-4 flex gap-2 border-b border-border pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setStatusFilter(tab.id); setPage(1) }}
              className={`rounded-t px-4 py-2 text-sm font-medium transition-colors ${
                statusFilter === tab.id
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded bg-muted" />
            ))}
          </div>
        )}

        {!isLoading && feedbacks.length === 0 && (
          <div className="text-center text-muted-foreground">Aucun signalement</div>
        )}

        {!isLoading && feedbacks.length > 0 && (
          <>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Commentaire</th>
                    <th className="px-4 py-3 text-left">Log ID</th>
                    <th className="px-4 py-3 text-left">Statut</th>
                    <th className="px-4 py-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {feedbacks.map((fb) => (
                    <tr key={fb.id} className="border-b border-border hover:bg-muted/50">
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(fb.createdAt).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <span className="line-clamp-2 text-xs">{fb.comment ?? <em className="text-muted-foreground">—</em>}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                        {fb.queryLogId.slice(0, 8)}…
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={fb.status === "PENDING" ? "pending" : "success"}>
                          {fb.status === "PENDING" ? "En attente" : "Résolu"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {fb.status === "PENDING" && (
                          <Button
                            size="sm"
                            className="gap-1"
                            disabled={actionLoading === fb.id}
                            onClick={() => handleResolve(fb.id)}
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            Résoudre
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Précédent
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} sur {totalPages} — {total} au total
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
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
