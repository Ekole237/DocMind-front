import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { LoginForm } from "../../components/auth/LoginForm"
import { useAuth } from "../../hooks/useAuth"

const ZOHO_ERROR_MESSAGES: Record<string, string> = {
  cancelled: "Connexion annulée. Réessayez.",
  server: "Erreur de connexion Zoho. Réessayez.",
}

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, isLoading } = useAuth()

  const errorParam = searchParams.get("error")
  const errorMessage = errorParam ? (ZOHO_ERROR_MESSAGES[errorParam] ?? "Erreur inattendue.") : null

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && user) {
      navigate("/chat", { replace: true })
    }
  }, [user, isLoading, navigate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Doc Mind</CardTitle>
          <CardDescription>Assistant RH — Connectez-vous pour continuer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorMessage && (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  )
}
