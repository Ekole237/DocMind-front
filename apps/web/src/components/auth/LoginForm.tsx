import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Mail, Loader2, KeyRound, ChevronRight, UserCircle, CheckCircle } from "lucide-react"
import { useState } from "react"
import { requestMagicLink } from "../../api/client"
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
  const [adminHp, setAdminHp] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPasswordLoading, setIsPasswordLoading] = useState(false)
  const [isZohoLoading, setIsZohoLoading] = useState(false)

  const [authMode, setAuthMode] = useState<"zoho" | "admin" | "guest">("zoho")
  const [guestEmail, setGuestEmail] = useState("")
  const [guestHp, setGuestHp] = useState("")
  const [isGuestLoading, setIsGuestLoading] = useState(false)
  const [guestSuccess, setGuestSuccess] = useState(false)

  const { loginWithPassword, loginWithZoho } = useAuth()
  const isLoading = isPasswordLoading || isZohoLoading || isGuestLoading

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
      await loginWithPassword(email, password, adminHp)
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

  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setGuestSuccess(false)
    if (!guestEmail) {
      setError("Veuillez remplir votre adresse email.")
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(guestEmail)) {
      setError("L'adresse email saisie est incorrecte.")
      return
    }
    setIsGuestLoading(true)
    try {
      await requestMagicLink(guestEmail, guestHp)
      setGuestSuccess(true)
    } catch (err) {
      if (isApiError(err) && err.statusCode === 429) {
        setError("Trop de demandes. Veuillez patienter avant de réessayer.")
      } else {
        setError(getErrorMessage(err, isApiError(err) ? err.statusCode : undefined))
      }
    } finally {
      setIsGuestLoading(false)
    }
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

      {authMode === "zoho" && (
        <>
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
              <span className="bg-background px-3 font-medium">Autres accès</span>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              type="button"
              variant="ghost"
              className="h-10 w-full justify-between gap-2 px-3 text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => { setAuthMode("guest"); setError(null) }}
              disabled={isLoading}
            >
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider">
                <UserCircle className="h-4 w-4" />
                Accès Invité (Guest)
              </div>
              <ChevronRight className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="h-10 w-full justify-between gap-2 px-3 text-muted-foreground transition-colors hover:text-foreground border border-transparent hover:border-border"
              onClick={() => { setAuthMode("admin"); setError(null) }}
              disabled={isLoading}
            >
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider">
                <KeyRound className="h-4 w-4" />
                Accès Administration
              </div>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}

      {authMode === "admin" && (
        <form onSubmit={handleSubmit} className="animate-in fade-in slide-in-from-top-3 duration-300 space-y-4">
          {/* Honeypot — invisible aux humains, intercepte les bots */}
          <input
            type="text"
            name="_hp"
            value={adminHp}
            onChange={(e) => setAdminHp(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            style={{ position: "absolute", opacity: 0, pointerEvents: "none", width: 0, height: 0 }}
          />
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
              onClick={() => { setAuthMode("zoho"); setError(null) }}
              disabled={isLoading}
            >
              Retour aux accès collaborateur
            </button>
          </div>
        </form>
      )}

      {authMode === "guest" && (
        <form onSubmit={handleGuestSubmit} className="animate-in fade-in slide-in-from-top-3 duration-300 space-y-4">
          {/* Honeypot — invisible aux humains, intercepte les bots */}
          <input
            type="text"
            name="_hp"
            value={guestHp}
            onChange={(e) => setGuestHp(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            style={{ position: "absolute", opacity: 0, pointerEvents: "none", width: 0, height: 0 }}
          />
          <div className="space-y-4">
            {guestSuccess ? (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
                <CheckCircle className="mx-auto mb-2 h-8 w-8 text-primary" />
                <p className="text-sm font-medium text-foreground">Lien de connexion envoyé</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Si cet email est associé à un accès actif, un lien "Magic Link" vous a été envoyé. Veuillez vérifier votre boîte de réception.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-1.5 px-0.5">
                  <label htmlFor="guestEmail" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 ml-1">
                    Email Invité
                  </label>
                  <Input
                    id="guestEmail"
                    type="email"
                    placeholder="invite@client.com"
                    value={guestEmail}
                    onChange={(e) => {
                      setGuestEmail(e.target.value)
                      if (error) setError(null)
                    }}
                    disabled={isLoading}
                    required
                    className="h-11 rounded-xl bg-muted/20 border-border/50 focus-visible:ring-primary/20"
                  />
                  <p className="mt-2 text-center text-[11px] text-muted-foreground px-2">
                    Si un accès vous a été autorisé, un lien unique vous sera immédiatement envoyé par courriel.
                  </p>
                </div>

                <Button type="submit" className="h-11 w-full rounded-xl font-medium shadow-sm transition-all active:scale-[0.98]" disabled={isLoading}>
                  {isGuestLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Recevoir mon lien de connexion"
                  )}
                </Button>
              </>
            )}

            <button
              type="button"
              className="w-full text-center text-xs text-muted-foreground underline-offset-4 hover:underline"
              onClick={() => {
                setAuthMode("zoho")
                setError(null)
                setGuestSuccess(false)
              }}
              disabled={isLoading}
            >
              Retour aux accès collaborateur
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
