import type { ReactNode } from "react"
import { createContext, useCallback, useEffect, useState } from "react"
import apiClient from "../api/client"
import type { LoginRequest, LoginResponse, User } from "../types"
import { getToken, getUser, removeToken, setToken, setUser } from "../utils/storage"

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUserState] = useState<User | null>(null)
  const [token, setTokenState] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Restore auth state from localStorage on mount
  useEffect(() => {
    const savedToken = getToken()
    const savedUser = getUser()

    if (savedToken && savedUser) {
      setTokenState(savedToken)
      setUserState(savedUser)
    }

    setIsLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await apiClient.post<LoginResponse>("/auth/login", {
        email,
        password,
      } as LoginRequest)

      const { token: newToken, user: newUser } = response.data

      setToken(newToken)
      setUser(newUser)
      setTokenState(newToken)
      setUserState(newUser)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    removeToken()
    setTokenState(null)
    setUserState(null)
  }, [])

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user && !!token,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
