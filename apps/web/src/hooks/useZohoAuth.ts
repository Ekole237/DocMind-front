import { useAuth } from "./useAuth"

// Alias conservé pour compatibilité avec les composants existants
export function useZohoAuth() {
  const { loginWithZoho } = useAuth()
  return { loginWithZoho }
}
