import type { ReactNode } from "react"
import { createContext, useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { API_BASE_URL, login as apiLogin } from "../api/client"
import type { ApiError, JwtUser } from "../types"
import { getUser, isAuthenticated, removeToken, saveToken } from "../utils/storage"

interface AuthContextType {
  user: JwtUser | null
  isLoading: boolean
  loginWithPassword: (email: string, password: string, _hp?: string) => Promise<void>
  loginWithZoho: () => void
  logout: () => void
  handleOAuthCallback: (token: string) => void
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<JwtUser | null>(() => isAuthenticated() ? getUser() : null)
  const [isLoading] = useState(false)
  const navigate = useNavigate()

  // Cleanup token if not authenticated + listen for session expiry
  useEffect(() => {
    if (!isAuthenticated()) {
      removeToken()
    }

    const handleExpired = () => {
      removeToken()
      setUser(null)
      navigate("/login?error=session_expired", { replace: true })
    }
    
    window.addEventListener('auth:expired', handleExpired)
    return () => window.removeEventListener('auth:expired', handleExpired)
  }, [navigate])

  const loginWithPassword = useCallback(async (email: string, password: string, _hp = "") => {
    const token = await apiLogin(email, password, _hp)
    saveToken(token)
    const decoded = getUser()
    if (!decoded) {
      removeToken()
      throw { statusCode: 500, message: "Token invalide reçu du serveur", code: "INVALID_TOKEN" } satisfies ApiError
    }
    setUser(decoded)
    navigate(decoded.role === "admin" ? "/admin/dashboard" : "/chat", { replace: true })
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
    navigate(decoded.role === "admin" ? "/admin/dashboard" : "/chat", { replace: true })
  }, [navigate])

  const logout = useCallback(() => {
    removeToken()
    setUser(null)
    navigate("/login?error=logged_out", { replace: true })
  }, [navigate])

  return (
    <AuthContext.Provider value={{ user, isLoading, loginWithPassword, loginWithZoho, handleOAuthCallback, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
