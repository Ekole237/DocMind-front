import { AlertCircle, Users } from "lucide-react"
import { useEffect, useState } from "react"
import apiClient from "../../api/client"
import { MetricCard } from "../../components/admin/MetricCard"
import { AdminLayout } from "../../components/layout/AdminLayout"
import type { Dashboard } from "../../types"

export function DashboardPage() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    setIsLoading(true)
    setError("")
    try {
      const response = await apiClient.get<Dashboard>("/admin/dashboard")
      setDashboard(response.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement du tableau de bord")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AdminLayout currentPage="dashboard">
      <div className="p-6">
        <h1 className="mb-6 text-3xl font-bold">Tableau de bord</h1>

        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 p-4 text-destructive">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="text-center text-muted-foreground">Chargement...</div>
        )}

        {!isLoading && dashboard && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Documents"
              value={dashboard.totalDocuments}
              icon="📄"
            />
            <MetricCard
              title="Requêtes aujourd'hui"
              value={dashboard.queriestoday}
              icon="💬"
            />
            <MetricCard
              title="Retours en attente"
              value={dashboard.pendingFeedbacks}
              icon={<AlertCircle className="h-6 w-6 text-destructive" />}
            />
            <MetricCard
              title="Invités actifs"
              value={dashboard.activeGuests}
              icon={<Users className="h-6 w-6" />}
            />
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
