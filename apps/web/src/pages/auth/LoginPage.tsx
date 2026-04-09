import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { LoginForm } from "../../components/auth/LoginForm"
import { useAuth } from "../../hooks/useAuth"

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isAuthenticated } = useAuth()

  // Handle Zoho callback
  useEffect(() => {
    const token = searchParams.get("token")
    if (token) {
      // Store token in localStorage
      localStorage.setItem("auth_token", token)
      // Refresh page to trigger auth context initialization
      window.location.href = "/chat"
    }
  }, [searchParams])

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/chat")
    }
  }, [isAuthenticated, navigate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Doc Mind</CardTitle>
          <CardDescription>Assistant RH - Connectez-vous pour continuer</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  )
}
