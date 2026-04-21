import { useEffect, useState } from "react"
import { admin } from "../../api/client"
import { MetricCard } from "../../components/admin/MetricCard"
import { AdminLayout } from "../../components/layout/AdminLayout"
import type { DashboardMetrics } from "../../types"

export function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    admin
      .getDashboard()
      .then(setMetrics)
      .catch(() => setError("Erreur lors du chargement du tableau de bord"))
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <AdminLayout currentPage="dashboard">
      <div className="p-6">
        <h1 className="mb-6 title-lg">Tableau de bord</h1>

        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 p-4 text-destructive">{error}</div>
        )}

        {isLoading && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        )}

        {!isLoading && metrics && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Documents indexés" value={metrics.documentsIndexed} />
            <MetricCard
              label="En attente d'indexation"
              value={metrics.documentsPending}
              variant="warning"
            />
            <MetricCard
              label="Signalements en attente"
              value={metrics.feedbacksPending}
              variant="danger"
            />
            <MetricCard label="Requêtes ce mois" value={metrics.queriesThisMonth} />
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
