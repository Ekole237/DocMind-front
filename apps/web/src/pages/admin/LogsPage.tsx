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
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Date</th>
                    <th className="px-4 py-3 text-left font-medium">Question</th>
                    <th className="px-4 py-3 text-left font-medium">Réponse</th>
                    <th className="px-4 py-3 text-left font-medium">Rôle</th>
                    <th className="px-4 py-3 text-left font-medium">Temps</th>
                    <th className="px-4 py-3 text-left font-medium">Flags</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log._id} className="border-b border-border hover:bg-muted/50">
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        <div>{new Date(log._timestamp).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}</div>
                        <div className="text-[11px] opacity-70">{new Date(log._timestamp).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</div>
                      </td>
                      <td className="px-4 py-3 max-w-[220px]">
                        <span className="line-clamp-2 text-xs">{log._question}</span>
                      </td>
                      <td className="px-4 py-3 max-w-[220px]">
                        <span className="line-clamp-2 text-xs text-muted-foreground">{log._answer}</span>
                      </td>
                      <td className="px-4 py-3 text-xs capitalize">{log._role}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{log._responseTimeMs} ms</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {log._isFlagged && <Badge variant="pending">Signalé</Badge>}
                          {log._isIgnorance && <Badge variant="destructive">Sans rép.</Badge>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {logs.map((log) => (
                <div key={log._id} className="rounded-lg border border-border bg-card p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {new Date(log._timestamp).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                      {" · "}
                      {new Date(log._timestamp).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-1">
                      <Badge variant="outline" className="capitalize text-[11px]">{log._role}</Badge>
                      {log._isFlagged && <Badge variant="pending">Signalé</Badge>}
                      {log._isIgnorance && <Badge variant="destructive">Sans rép.</Badge>}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground line-clamp-2">{log._question}</p>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-3">{log._answer}</p>
                  </div>
                  <div className="text-[11px] text-muted-foreground">{log._responseTimeMs} ms</div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between">
              <Button variant="outline" onClick={() => fetchLogs(page - 1)} disabled={page === 1}>
                Précédent
              </Button>
              <span className="text-sm text-muted-foreground">Page {page}</span>
              <Button variant="outline" onClick={() => fetchLogs(page + 1)} disabled={logs.length < LIMIT}>
                Suivant
              </Button>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
