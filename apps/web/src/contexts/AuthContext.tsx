import type { ReactNode } from "react"
import { createContext, useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { API_BASE_URL, login as apiLogin } from "../api/client"
import type { ApiError, JwtUser } from "../types"
import { getUser, isAuthenticated, removeToken, saveToken } from "../utils/storage"

interface AuthContextType {
  user: JwtUser | null
  isLoading: boolean
  loginWithPassword: (email: string, password: string) => Promise<void>
  loginWithZoho: () => void
  logout: () => void
  handleOAuthCallback: (token: string) => void
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<JwtUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  // Restore auth state on mount
  useEffect(() => {
    if (isAuthenticated()) {
      setUser(getUser())
    } else {
      removeToken()
    }
    setIsLoading(false)
  }, [])

  const loginWithPassword = useCallback(async (email: string, password: string) => {
    const token = await apiLogin(email, password)
    saveToken(token)
    const decoded = getUser()
    if (!decoded) {
      removeToken()
      throw { statusCode: 500, message: "Token invalide reçu du serveur", code: "INVALID_TOKEN" } satisfies ApiError
    }
    setUser(decoded)
    navigate("/chat", { replace: true })
  }, [navigate])

  const loginWithZoho = useCallback(() => {
    window.location.href = `${API_BASE_URL}/auth/zoho`
  }, [])

  const handleOAuthCallback = useCallback((token: string) => {
    saveToken(token)
    const decoded = getUser()
    if (!decoded) {
      removeToken()
      navigate("/login?error=server", { replace: true })
      return
    }
    setUser(decoded)
    navigate("/chat", { replace: true })
  }, [navigate])

  const logout = useCallback(() => {
    removeToken()
    setUser(null)
    navigate("/login", { replace: true })
  }, [navigate])

  return (
    <AuthContext.Provider value={{ user, isLoading, loginWithPassword, loginWithZoho, handleOAuthCallback, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
