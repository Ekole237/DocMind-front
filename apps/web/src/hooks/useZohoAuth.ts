import { useCallback } from "react"
import { useAuth } from "./useAuth"

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api"

export function useZohoAuth() {
  const { login } = useAuth()

  const loginWithZoho = useCallback(() => {
    // Redirect to Zoho OAuth endpoint on backend
    // Backend will handle the OAuth flow and redirect back
    const zohoAuthUrl = `${API_BASE_URL}/auth/zoho`
    window.location.href = zohoAuthUrl
  }, [])

  // Handle callback from Zoho (if backend redirects with token in URL)
  const handleZohoCallback = useCallback(
    async (token: string) => {
      try {
        // If backend returns token in URL, use it directly
        localStorage.setItem("auth_token", token)
        // Reload to trigger auth context initialization
        window.location.href = "/chat"
      } catch (error) {
        console.error("Error handling Zoho callback:", error)
      }
    },
    [login]
  )

  return { loginWithZoho, handleZohoCallback }
}
