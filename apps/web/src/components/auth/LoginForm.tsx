import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Mail, Loader2, KeyRound, ChevronRight } from "lucide-react"
import { useState } from "react"
import { useAuth } from "../../hooks/useAuth"
import type { ApiError } from "../../types"

function isApiError(err: unknown): err is ApiError {
  return typeof err === "object" && err !== null && "statusCode" in err
}

function getErrorMessage(err: unknown, status?: number): string {
  if (status === 429) return "Trop de tentatives. Veuillez patienter 15 minutes."

  if (isApiError(err)) {
    if (err.code === "INVALID_CREDENTIALS") return "Identifiants incorrects. Veuillez vérifier votre email et mot de passe."
    return err.message || "Impossible de se connecter au serveur."
  }

  return "Erreur lors de la connexion. Vérifiez votre connexion internet."
}

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPasswordLoading, setIsPasswordLoading] = useState(false)
  const [isZohoLoading, setIsZohoLoading] = useState(false)
  const [isAdminFormVisible, setIsAdminFormVisible] = useState(false)

  const { loginWithPassword, loginWithZoho } = useAuth()
  const isLoading = isPasswordLoading || isZohoLoading

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email || !password) {
      setError("Veuillez remplir tous les champs.")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("L'adresse email saisie est incorrecte.")
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
    loginWithZoho()
  }

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
          <AlertDescription className="text-xs font-medium leading-tight tracking-tight">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Primary Auth: Zoho for all Employees */}
      <div className="space-y-4">
        <Button
          type="button"
          className="relative h-12 w-full gap-3 overflow-hidden rounded-xl font-semibold shadow-md transition-all hover:shadow-lg active:scale-[0.98]"
          onClick={handleZoho}
          disabled={isLoading}
        >
          {isZohoLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Mail className="h-5 w-5" />
              <span>Accès Collaborateur via Zoho</span>
            </>
          )}
        </Button>
        <p className="text-center text-[11px] text-muted-foreground">
          Utilisez vos identifiants d'entreprise pour vous connecter.
        </p>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/50" />
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-widest text-muted-foreground/50">
          <span className="bg-background px-3 font-medium">Administration</span>
        </div>
      </div>

      {/* Secondary Auth: Password for Admins */}
      <div className="space-y-3">
        {!isAdminFormVisible ? (
          <Button
            type="button"
            variant="ghost"
            className="h-10 w-full justify-between gap-2 px-3 text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => setIsAdminFormVisible(true)}
            disabled={isLoading}
          >
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider">
              <KeyRound className="h-4 w-4" />
              Accès Administration
            </div>
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <form onSubmit={handleSubmit} className="animate-in fade-in slide-in-from-top-3 duration-300 space-y-4">
            <div className="space-y-4">
              <div className="space-y-1.5 px-0.5">
                <label htmlFor="email" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 ml-1">
                  Email Administrateur
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@entreprise.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (error) setError(null)
                  }}
                  disabled={isLoading}
                  required
                  autoComplete="email"
                  className="h-11 rounded-xl bg-muted/20 border-border/50 focus-visible:ring-primary/20"
                />
              </div>

              <div className="space-y-1.5 px-0.5">
                <label htmlFor="password" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 ml-1">
                  Mot de passe
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (error) setError(null)
                  }}
                  disabled={isLoading}
                  required
                  autoComplete="current-password"
                  className="h-11 rounded-xl bg-muted/20 border-border/50 focus-visible:ring-primary/20"
                />
              </div>

              <Button type="submit" className="h-11 w-full rounded-xl font-medium shadow-sm transition-all active:scale-[0.98]" disabled={isLoading}>
                {isPasswordLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Valider l'authentification"
                )}
              </Button>

              <button
                type="button"
                className="w-full text-center text-xs text-muted-foreground underline-offset-4 hover:underline"
                onClick={() => {
                  setIsAdminFormVisible(false)
                  setError(null)
                }}
                disabled={isLoading}
              >
                Retour aux accès collaborateur
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
