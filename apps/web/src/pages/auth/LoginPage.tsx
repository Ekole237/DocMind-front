import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Bot, ShieldCheck } from "lucide-react"
import { useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { LoginForm } from "../../components/auth/LoginForm"
import { useAuth } from "../../hooks/useAuth"

const ERROR_MESSAGES: Record<string, string> = {
  cancelled: "La connexion a été annulée.",
  server: "Le serveur ne répond pas. Réessayez plus tard.",
  session_expired: "Votre session a expiré. Veuillez vous reconnecter.",
  guest_invalid: "Ce lien d'invitation est invalide, a déjà été utilisé ou a expiré.",
  logged_out: "Vous avez été déconnecté avec succès.",
}

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, isLoading } = useAuth()

  const errorParam = searchParams.get("error")
  const errorMessage = errorParam ? (ERROR_MESSAGES[errorParam] ?? "Une erreur est survenue.") : null

  useEffect(() => {
    if (!isLoading && user) {
      navigate(user.role === "admin" ? "/admin/dashboard" : "/chat", { replace: true })
    }
  }, [user, isLoading, navigate])

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-muted/30 p-4 font-sans antialiased sm:p-8">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] h-[40%] w-[40%] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center space-y-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
            <Bot className="h-7 w-7 text-primary-foreground" />
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Doc Mind</h1>
              <span className="text-sm italic text-primary font-bold" style={{ fontFamily: "'Lucky Beauty', cursive" }}>by Ejara</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Assistant RH intelligent et base documentaire
            </p>
          </div>
        </div>

        <Card className="border-border/50 bg-card/80 shadow-xl backdrop-blur-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-semibold">Bienvenue</CardTitle>
            <CardDescription>
              Connectez-vous pour accéder à l'assistant
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {errorMessage && (
              <Alert variant={errorParam === "logged_out" ? "default" : "destructive"} className="animate-in fade-in slide-in-from-top-2">
                <AlertDescription className="text-xs font-medium">{errorMessage}</AlertDescription>
              </Alert>
            )}
            
            <LoginForm />
          </CardContent>
        </Card>

        <footer className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Accès sécurisé réservé aux collaborateurs</span>
        </footer>
      </div>
    </div>
  )
}
