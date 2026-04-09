import { useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useAuth } from "../../hooks/useAuth"

export function CallbackPage() {
  const [searchParams] = useSearchParams()
  const { handleOAuthCallback } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const token = searchParams.get("token")

    if (!token) {
      navigate("/login?error=server", { replace: true })
      return
    }

    handleOAuthCallback(token)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Connexion en cours...</p>
      </div>
    </div>
  )
}
