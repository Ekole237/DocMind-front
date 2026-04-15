import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { useState } from "react"
import { admin } from "../../api/client"
import { AdminLayout } from "../../components/layout/AdminLayout"
import type { AdminQueryLog, ApiError } from "../../types"

const LIMIT = 10

function getApiMessage(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: ApiError } }
  return e.response?.data?.message ?? fallback
}

export function LogsPage() {
  const [logs, setLogs] = useState<AdminQueryLog[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [page, setPage] = useState(1)
  const [hasSearched, setHasSearched] = useState(false)

  // Filters (staged — applied on button click)
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [role, setRole] = useState("")
  const [flagged, setFlagged] = useState(false)

  const fetchLogs = (p: number) => {
    setIsLoading(true)
    setError("")
    admin
      .listLogs({
        from: from || undefined,
        to: to || undefined,
        role: role || undefined,
        flagged: flagged || undefined,
        page: p,
        limit: LIMIT,
      })
      .then((data) => {
        setLogs(data)
        setPage(p)
        setHasSearched(true)
      })
      .catch((err) => setError(getApiMessage(err, "Erreur lors du chargement")))
      .finally(() => setIsLoading(false))
  }

  const handleApply = () => fetchLogs(1)

  const handleReset = () => {
    setFrom(""); setTo(""); setRole(""); setFlagged(false)
    setPage(1); setLogs([]); setHasSearched(false)
  }

  return (
    <AdminLayout currentPage="logs">
      <div className="p-6">
        <h1 className="mb-6 text-3xl font-bold">Logs d'activité</h1>

        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 p-4 text-destructive">{error}</div>
        )}

        {/* Filters */}
        <div className="mb-6 rounded-lg border border-border bg-card p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Depuis</label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Jusqu'à</label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Rôle</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Tous</option>
                <option value="employee">Employé</option>
                <option value="admin">Admin</option>
                <option value="guest">Invité</option>
              </select>
            </div>
            <div className="flex flex-col justify-end gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={flagged}
                  onChange={(e) => setFlagged(e.target.checked)}
                  className="h-4 w-4"
                />
                Signalés uniquement
              </label>
              <div className="flex gap-2">
                <Button onClick={handleApply} disabled={isLoading} className="flex-1">
                  Appliquer
                </Button>
                <Button variant="outline" onClick={handleReset} disabled={isLoading}>
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded bg-muted" />
            ))}
          </div>
        )}

        {!isLoading && hasSearched && logs.length === 0 && (
          <div className="text-center text-muted-foreground">Aucun log trouvé</div>
        )}

        {!isLoading && !hasSearched && (
          <div className="text-center text-muted-foreground">
            Appliquez des filtres pour afficher les logs.
          </div>
        )}

        {!isLoading && logs.length > 0 && (
          <>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Question</th>
                    <th className="px-4 py-3 text-left">Réponse</th>
                    <th className="px-4 py-3 text-left">Rôle</th>
                    <th className="px-4 py-3 text-left">Temps</th>
                    <th className="px-4 py-3 text-left">Flags</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-border hover:bg-muted/50">
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-4 py-3 max-w-[200px]">
                        <span className="line-clamp-2 text-xs">{log.question}</span>
                      </td>
                      <td className="px-4 py-3 max-w-[200px]">
                        <span className="line-clamp-2 text-xs text-muted-foreground">{log.answer}</span>
                      </td>
                      <td className="px-4 py-3 text-xs">{log.role}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{log.responseTimeMs}ms</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {log.isFlagged && <Badge variant="pending">Signalé</Badge>}
                          {log.isIgnorance && <Badge variant="destructive">Sans rép.</Badge>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Blind pagination */}
            <div className="mt-4 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => fetchLogs(page - 1)}
                disabled={page === 1}
              >
                Précédent
              </Button>
              <span className="text-sm text-muted-foreground">Page {page}</span>
              <Button
                variant="outline"
                onClick={() => fetchLogs(page + 1)}
                disabled={logs.length < LIMIT}
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
