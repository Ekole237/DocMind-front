import { Button } from "@workspace/ui/components/button"
import { useNavigate } from "react-router-dom"

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="mt-2 text-muted-foreground">Page non trouvée</p>
        <Button onClick={() => navigate("/")} className="mt-4">
          Retour à l'accueil
        </Button>
      </div>
    </div>
  )
}
