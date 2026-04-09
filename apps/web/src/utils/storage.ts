import type { JwtUser } from "../types"

const TOKEN_KEY = "auth_token"

export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export function getUser(): JwtUser | null {
  const token = getToken()
  if (!token) return null

  try {
    const payload = token.split(".")[1]
    const decoded = JSON.parse(atob(payload)) as JwtUser & { exp: number }
    return decoded
  } catch {
    return null
  }
}

export function isAuthenticated(): boolean {
  const token = getToken()
  if (!token) return false

  try {
    const payload = token.split(".")[1]
    const decoded = JSON.parse(atob(payload)) as { exp: number }
    return decoded.exp > Date.now() / 1000
  } catch {
    return false
  }
}
