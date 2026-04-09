import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Mail } from "lucide-react"
import { useState } from "react"
import { useAuth } from "../../hooks/useAuth"
import type { ApiError } from "../../types"

function isApiError(err: unknown): err is ApiError {
  return typeof err === "object" && err !== null && "statusCode" in err
}

function getErrorMessage(err: unknown, status?: number): string {
  if (status === 429) return "Trop de tentatives, réessayez dans 15 minutes."

  if (isApiError(err)) {
    if (err.code === "INVALID_CREDENTIALS") return "Identifiants incorrects."
    return err.message || "Erreur lors de la connexion."
  }

  return "Erreur lors de la connexion."
}

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPasswordLoading, setIsPasswordLoading] = useState(false)
  const [isZohoLoading, setIsZohoLoading] = useState(false)

  const { loginWithPassword, loginWithZoho } = useAuth()

  const isLoading = isPasswordLoading || isZohoLoading

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email || !password) {
      setError("L'email et le mot de passe sont requis.")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Adresse email invalide.")
      return
    }

    setIsPasswordLoading(true)
    try {
      await loginWithPassword(email, password)
    } catch (err) {
      const axiosStatus = isApiError(err) ? err.statusCode : undefined
      setError(getErrorMessage(err, axiosStatus))
    } finally {
      setIsPasswordLoading(false)
    }
  }

  const handleZoho = () => {
    setError(null)
    setIsZohoLoading(true)
    // loginWithZoho() fait window.location.href — le loading reste affiché
    // jusqu'à la navigation
    loginWithZoho()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <Input
          id="email"
          type="email"
          placeholder="votre@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          required
          autoComplete="email"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">
          Mot de passe
        </label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          required
          autoComplete="current-password"
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isPasswordLoading ? (
          <span className="flex items-center gap-2">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Connexion...
          </span>
        ) : (
          "Se connecter"
        )}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-background px-2 text-muted-foreground">ou</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full gap-2"
        onClick={handleZoho}
        disabled={isLoading}
      >
        {isZohoLoading ? (
          <span className="flex items-center gap-2">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Redirection...
          </span>
        ) : (
          <>
            <Mail className="h-4 w-4" />
            Se connecter avec Zoho
          </>
        )}
      </Button>
    </form>
  )
}
