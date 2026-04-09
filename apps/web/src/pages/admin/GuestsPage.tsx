import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Clock, Plus, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import apiClient from "../../api/client"
import { AdminLayout } from "../../components/layout/AdminLayout"
import type { Guest, GuestsResponse } from "../../types"

export function GuestsPage() {
  const [guests, setGuests] = useState<Guest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newGuestEmail, setNewGuestEmail] = useState("")

  useEffect(() => {
    loadGuests()
  }, [page])

  const loadGuests = async () => {
    setIsLoading(true)
    setError("")
    try {
      const response = await apiClient.get<GuestsResponse>("/admin/guests", {
        params: { page, limit: 10 },
      })
      setGuests(response.data.guests)
      setTotalPages(Math.ceil(response.data.total / response.data.limit))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGuestEmail) return

    setActionLoading("add")
    try {
      await apiClient.post("/admin/guests", { email: newGuestEmail })
      setNewGuestEmail("")
      setShowAddModal(false)
      loadGuests()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'ajout")
    } finally {
      setActionLoading(null)
    }
  }

  const handleExtend = async (guestId: string) => {
    setActionLoading(guestId)
    try {
      await apiClient.patch(`/admin/guests/${guestId}/extend`)
      loadGuests()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'extension")
    } finally {
      setActionLoading(null)
    }
  }

  const handleRevoke = async (guestId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir révoquer cet invité ?")) return

    setActionLoading(guestId)
    try {
      await apiClient.delete(`/admin/guests/${guestId}`)
      loadGuests()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la révocation")
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <AdminLayout currentPage="guests">
      <div className="p-6">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="text-3xl font-bold">Invités</h1>
          <Button onClick={() => setShowAddModal(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Ajouter un invité
          </Button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 p-4 text-destructive">
            {error}
          </div>
        )}

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-lg">
              <h2 className="mb-4 font-semibold">Ajouter un invité</h2>
              <form onSubmit={handleAddGuest} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    placeholder="invité@exemple.com"
                    value={newGuestEmail}
                    onChange={(e) => setNewGuestEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddModal(false)}
                    disabled={actionLoading === "add"}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={actionLoading === "add"}>
                    {actionLoading === "add" ? "Ajout..." : "Ajouter"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="text-center text-muted-foreground">Chargement...</div>
        )}

        {!isLoading && guests.length === 0 && (
          <div className="text-center text-muted-foreground">Aucun invité</div>
        )}

        {!isLoading && guests.length > 0 && (
          <>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted">
                  <tr>
                    <th className="px-4 py-2 text-left">Email</th>
                    <th className="px-4 py-2 text-left">Statut</th>
                    <th className="px-4 py-2 text-left">Expiration</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {guests.map((guest) => (
                    <tr key={guest.id} className="border-b border-border hover:bg-muted/50">
                      <td className="px-4 py-2 font-medium">{guest.email}</td>
                      <td className="px-4 py-2">
                        <Badge variant={guest.status === "ACTIVE" ? "success" : "outline"}>
                          {guest.status === "ACTIVE" ? "Actif" : "Expiré"}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">
                        {new Date(guest.expirationDate).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2">
                          {guest.status === "ACTIVE" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleExtend(guest.id)}
                              disabled={actionLoading === guest.id}
                              title="Prolonger l'accès"
                            >
                              <Clock className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRevoke(guest.id)}
                            disabled={actionLoading === guest.id}
                            title="Révoquer"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

      {/* Mobile Overlay for Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setShowAddModal(false)}
        />
      )}
    </AdminLayout>
  )
}
