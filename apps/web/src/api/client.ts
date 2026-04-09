import type { AxiosInstance } from "axios"
import axios, { AxiosError } from "axios"
import { getToken, removeToken } from "../utils/storage"

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api"

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor: add JWT token
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

// Response interceptor: handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // 401 Unauthorized: logout
    if (error.response?.status === 401) {
      removeToken()
      window.location.href = "/login"
    }
    return Promise.reject(error)
  }
)

export default apiClient
