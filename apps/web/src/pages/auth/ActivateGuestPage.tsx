import { useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { activateGuest, activateMagicLink } from "../../api/client"
import { saveToken } from "../../utils/storage"

export function ActivateGuestPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    const token = searchParams.get("token")
    if (!token) {
      navigate("/login", { replace: true })
      return
    }

    const isMagicLink = window.location.pathname.includes("magic-link")
    const activateApi = isMagicLink ? activateMagicLink : activateGuest

    activateApi(token)
      .then((data) => {
        saveToken(data.access_token)
        navigate("/chat", { replace: true })
        // Force un re-render contextuel si AuthContext utilise un event listener ou rechargement local
        window.location.reload()
      })
      .catch(() => {
        navigate("/login?error=guest_invalid", { replace: true })
      })
  }, [searchParams, navigate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground">Activation de votre accès en cours...</p>
      </div>
    </div>
  )
}
