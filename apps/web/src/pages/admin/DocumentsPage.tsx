import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Eye, EyeOff, Plus, Trash2, Zap } from "lucide-react"
import { useEffect, useState } from "react"
import apiClient from "../../api/client"
import { AdminLayout } from "../../components/layout/AdminLayout"
import type { Document, DocumentsResponse } from "../../types"

export function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    loadDocuments()
  }, [page, search])

  const loadDocuments = async () => {
    setIsLoading(true)
    setError("")
    try {
      const response = await apiClient.get<DocumentsResponse>("/admin/documents", {
        params: { page, limit: 10, search: search || undefined },
      })
      setDocuments(response.data.documents)
      setTotalPages(Math.ceil(response.data.total / response.data.limit))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement")
    } finally {
      setIsLoading(false)
    }
  }

  const handleIndex = async (docId: string) => {
    setActionLoading(docId)
    try {
      await apiClient.post(`/admin/documents/${docId}/index`)
      loadDocuments()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'indexation")
    } finally {
      setActionLoading(null)
    }
  }

  const handleToggle = async (docId: string, isActive: boolean) => {
    setActionLoading(docId)
    try {
      if (isActive) {
        await apiClient.patch(`/admin/documents/${docId}/disable`)
      } else {
        await apiClient.patch(`/admin/documents/${docId}/enable`)
      }
      loadDocuments()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la mise à jour")
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (docId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce document ?")) return

    setActionLoading(docId)
    try {
      await apiClient.delete(`/admin/documents/${docId}`)
      loadDocuments()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la suppression")
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <AdminLayout currentPage="documents">
      <div className="p-6">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="text-3xl font-bold">Documents</h1>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Importer un document
          </Button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 p-4 text-destructive">
            {error}
          </div>
        )}

        <div className="mb-4">
          <Input
            placeholder="Rechercher un document..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </div>

        {isLoading && (
          <div className="text-center text-muted-foreground">Chargement...</div>
        )}

        {!isLoading && documents.length === 0 && (
          <div className="text-center text-muted-foreground">Aucun document trouvé</div>
        )}

        {!isLoading && documents.length > 0 && (
          <>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted">
                  <tr>
                    <th className="px-4 py-2 text-left">Nom</th>
                    <th className="px-4 py-2 text-left">Statut</th>
                    <th className="px-4 py-2 text-left">Date de création</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id} className="border-b border-border hover:bg-muted/50">
                      <td className="px-4 py-2 font-medium">{doc.name}</td>
                      <td className="px-4 py-2">
                        <Badge
                          variant={
                            doc.status === "INDEXED"
                              ? "success"
                              : doc.status === "FAILED"
                                ? "destructive"
                                : "pending"
                          }
                        >
                          {doc.status === "INDEXED" && "Indexé"}
                          {doc.status === "PENDING" && "En attente"}
                          {doc.status === "FAILED" && "Erreur"}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">
                        {new Date(doc.createdAt).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2">
                          {doc.status !== "INDEXED" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleIndex(doc.id)}
                              disabled={actionLoading === doc.id}
                              title="Indexer le document"
                            >
                              <Zap className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggle(doc.id, doc.status === "INDEXED")}
                            disabled={actionLoading === doc.id}
                            title={doc.status === "INDEXED" ? "Désactiver" : "Activer"}
                          >
                            {doc.status === "INDEXED" ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(doc.id)}
                            disabled={actionLoading === doc.id}
                            title="Supprimer"
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
    </AdminLayout>
  )
}
