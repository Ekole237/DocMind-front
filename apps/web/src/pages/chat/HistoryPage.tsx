import { Button } from "@workspace/ui/components/button"
import { ArrowLeft, Flag } from "lucide-react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import apiClient from "../../api/client"
import { useAuth } from "../../hooks/useAuth"
import type { QueryLogSummary } from "../../types"

export function HistoryPage() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const [messages, setMessages] = useState<QueryLogSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    loadHistory()
  }, [page])

  const loadHistory = async () => {
    setIsLoading(true)
    setError("")
    try {
      const response = await apiClient.get<{ logs: QueryLogSummary[]; total: number; page: number; limit: number }>("/chat/history", {
        params: { page, limit: 10 },
      })

      setMessages(response.data.logs)
      setTotalPages(Math.ceil(response.data.total / response.data.limit))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement de l'historique")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/chat")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold">Historique</h1>
        </div>
        <Button
          variant="ghost"
          onClick={() => {
            logout()
            navigate("/login")
          }}
        >
          Déconnexion
        </Button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto p-6">
        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 p-4 text-destructive">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="text-center text-muted-foreground">Chargement...</div>
        )}

        {!isLoading && messages.length === 0 && (
          <div className="text-center text-muted-foreground">Aucun historique disponible</div>
        )}

        {!isLoading && messages.length > 0 && (
          <>
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{msg.question}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{msg.answer}</p>
                    </div>
                    {msg.isFlagged && (
                      <Flag className="ml-2 h-5 w-5 flex-shrink-0 text-destructive" />
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                    {msg.sourceDocName && (
                      <span>📄 {msg.sourceDocName}</span>
                    )}
                    {msg.isIgnorance && (
                      <span className="rounded-full bg-[var(--warning-bg)]/10 px-2 py-1 text-[var(--warning-bg)]">
                        Pas de réponse
                      </span>
                    )}
                    <span>{new Date(msg.timestamp).toLocaleDateString("fr-FR")}</span>
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
      </main>
    </div>
  )
}
