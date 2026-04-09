import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { useEffect, useState } from "react"
import apiClient from "../../api/client"
import { AdminLayout } from "../../components/layout/AdminLayout"
import type { LogEntry, LogsResponse } from "../../types"

export function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [flaggedOnly, setFlaggedOnly] = useState(false)

  useEffect(() => {
    loadLogs()
  }, [page, fromDate, toDate, flaggedOnly])

  const loadLogs = async () => {
    setIsLoading(true)
    setError("")
    try {
      const response = await apiClient.get<LogsResponse>("/admin/logs", {
        params: {
          page,
          limit: 10,
          from: fromDate || undefined,
          to: toDate || undefined,
          flagged: flaggedOnly || undefined,
        },
      })
      setLogs(response.data.logs)
      setTotalPages(Math.ceil(response.data.total / response.data.limit))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetFilters = () => {
    setFromDate("")
    setToDate("")
    setFlaggedOnly(false)
    setPage(1)
  }

  return (
    <AdminLayout currentPage="logs">
      <div className="p-6">
        <h1 className="mb-6 text-3xl font-bold">Logs d'activité</h1>

        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 p-4 text-destructive">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 rounded-lg border border-border bg-card p-4">
          <h2 className="mb-4 font-semibold">Filtres</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium">Depuis</label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value)
                  setPage(1)
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Jusqu'à</label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value)
                  setPage(1)
                }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Options</label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="flagged"
                  checked={flaggedOnly}
                  onChange={(e) => {
                    setFlaggedOnly(e.target.checked)
                    setPage(1)
                  }}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="flagged" className="text-sm">
                  Seulement flaggés
                </label>
                {(fromDate || toDate || flaggedOnly) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleResetFilters}
                    className="ml-auto"
                  >
                    Réinitialiser
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="text-center text-muted-foreground">Chargement...</div>
        )}

        {!isLoading && logs.length === 0 && (
          <div className="text-center text-muted-foreground">Aucun log trouvé</div>
        )}

        {!isLoading && logs.length > 0 && (
          <>
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="mb-2 flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium break-words">Q: {log.query}</p>
                      <p className="mt-1 text-sm text-muted-foreground break-words">
                        R: {log.answer.substring(0, 100)}...
                      </p>
                    </div>
                    {log.isFlagged && (
                      <Badge variant="destructive" className="ml-2 flex-shrink-0">
                        Flaggé
                      </Badge>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>Rôle: {log.userRole}</span>
                    {log.sourceDocName && <span>Doc: {log.sourceDocName}</span>}
                    <span>{new Date(log.timestamp).toLocaleDateString("fr-FR")}</span>
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
