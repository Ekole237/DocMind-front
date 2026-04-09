import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Mail } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../hooks/useAuth"
import { useZohoAuth } from "../../hooks/useZohoAuth"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const { login } = useAuth()
  const { loginWithZoho } = useZohoAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // Validate inputs
      if (!email || !password) {
        setError("L'email et le mot de passe sont requis")
        setIsLoading(false)
        return
      }

      // Call login
      await login(email, password)

      // Navigate to chat on success
      navigate("/chat")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur lors de la connexion"
      setError(message || "Identifiants invalides")
    } finally {
      setIsLoading(false)
    }
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
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <span className="flex items-center gap-2">
            <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
            Connexion...
          </span>
        ) : (
          "Se connecter"
        )}
      </Button>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-background px-2 text-muted-foreground">ou</span>
        </div>
      </div>

      {/* Zoho Login Button */}
      <Button
        type="button"
        variant="outline"
        className="w-full gap-2"
        onClick={loginWithZoho}
        disabled={isLoading}
      >
        <Mail className="h-4 w-4" />
        Se connecter avec Zoho
      </Button>
    </form>
  )
}
