import { Button } from "@workspace/ui/components/button"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"

export function UnauthorizedPage() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">403</h1>
        <p className="mt-2 text-muted-foreground">Accès refusé - Vous n'avez pas les permissions nécessaires</p>
        <Button onClick={handleLogout} className="mt-4">
          Se déconnecter
        </Button>
      </div>
    </div>
  )
}
