import type { AxiosInstance } from "axios"
import axios, { AxiosError } from "axios"
import type { ApiError } from "../types"
import { getToken, removeToken } from "../utils/storage"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api"

export const API_BASE_URL = API_URL

const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor: inject JWT
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor: 401 → logout
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      removeToken()
      window.location.href = "/login"
    }
    return Promise.reject(error)
  }
)

// Login — le backend retourne un JWT brut (string)
export async function login(email: string, password: string): Promise<string> {
  try {
    const response = await apiClient.post<string>("/auth/login", { email, password }, {
      responseType: "text",
    })
    return response.data
  } catch (err) {
    const axiosError = err as AxiosError<ApiError>
    if (axiosError.response?.data) {
      throw axiosError.response.data
    }
    throw { statusCode: 0, message: "Erreur réseau", code: "NETWORK_ERROR" } satisfies ApiError
  }
}

export default apiClient
