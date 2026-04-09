import { Button } from "@workspace/ui/components/button"
import { Activity, FileText, LayoutDashboard, LogOut, Menu, MessageSquare, Users } from "lucide-react"
import type { ReactNode } from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../hooks/useAuth"

interface AdminLayoutProps {
  children: ReactNode
  currentPage?: "dashboard" | "documents" | "feedbacks" | "logs" | "guests"
}

export function AdminLayout({ children, currentPage }: AdminLayoutProps) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navItems = [
    { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard, path: "/admin/dashboard" },
    { id: "documents", label: "Documents", icon: FileText, path: "/admin/documents" },
    { id: "feedbacks", label: "Retours", icon: MessageSquare, path: "/admin/feedbacks" },
    { id: "logs", label: "Logs", icon: Activity, path: "/admin/logs" },
    { id: "guests", label: "Invités", icon: Users, path: "/admin/guests" },
  ]

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-border bg-card transition-transform md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full p-4">
          <div className="mb-6">
            <h1 className="text-lg font-semibold">Doc Mind - Admin</h1>
          </div>

          <nav className="flex-1 space-y-1">
            {navItems.map(({ id, label, icon: Icon, path }) => (
              <Button
                key={id}
                variant={currentPage === id ? "default" : "ghost"}
                className="w-full justify-start gap-2"
                onClick={() => {
                  navigate(path)
                  setSidebarOpen(false)
                }}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Button>
            ))}
          </nav>

          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-destructive hover:text-destructive"
            onClick={() => {
              logout()
              navigate("/login")
            }}
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b border-border bg-card px-4 py-3 flex items-center gap-4 md:gap-0">
          <button
            className="md:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h2 className="flex-1 text-lg font-semibold">Admin</h2>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
