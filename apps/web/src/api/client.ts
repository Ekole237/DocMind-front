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
      window.dispatchEvent(new CustomEvent('auth:expired'))
    }
    return Promise.reject(error)
  }
)

// Login — le backend retourne un JWT brut (string)
export async function login(email: string, password: string, _hp = ""): Promise<string> {
  try {
    const response = await apiClient.post<string>("/auth/login", { email, password, _hp }, {
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

export async function activateGuest(token: string): Promise<{ access_token: string }> {
  try {
    const response = await apiClient.get<{ access_token: string }>(`/auth/guest/activate?token=${token}`)
    return response.data
  } catch (err) {
    const axiosError = err as AxiosError<ApiError>
    if (axiosError.response?.data) {
      throw axiosError.response.data
    }
    throw { statusCode: 0, message: "Erreur réseau", code: "NETWORK_ERROR" } satisfies ApiError
  }
}

export async function requestMagicLink(email: string, _hp = ""): Promise<{ message: string }> {
  try {
    const response = await apiClient.post<{ message: string }>("/auth/guest/magic-link", { email, _hp })
    return response.data
  } catch (err) {
    const axiosError = err as AxiosError<ApiError>
    if (axiosError.response?.data) {
      throw axiosError.response.data
    }
    throw { statusCode: 0, message: "Erreur réseau", code: "NETWORK_ERROR" } satisfies ApiError
  }
}

export async function activateMagicLink(token: string): Promise<{ access_token: string }> {
  try {
    const response = await apiClient.get<{ access_token: string }>(`/auth/guest/magic-link/activate?token=${token}`)
    return response.data
  } catch (err) {
    const axiosError = err as AxiosError<ApiError>
    if (axiosError.response?.data) {
      throw axiosError.response.data
    }
    throw { statusCode: 0, message: "Erreur réseau", code: "NETWORK_ERROR" } satisfies ApiError
  }
}

// ============= ADMIN API =============
import type {
  AdminDocument,
  AdminFeedback,
  AdminQueryLog,
  DashboardMetrics,
  GuestToken,
  CreateGuestTokenResult,
  ExtendGuestTokenResult,
} from "../types"

export const admin = {
  // Dashboard
  getDashboard: (): Promise<DashboardMetrics> =>
    apiClient.get<DashboardMetrics>("/admin/dashboard").then((r) => r.data),

  // Documents
  listDocuments: (): Promise<AdminDocument[]> =>
    apiClient.get<AdminDocument[]>("/admin/documents").then((r) =>
      Array.isArray(r.data) ? r.data : []
    ),

  importDocument: (data: {
    title: string
    confidentiality: string
    driveUrl?: string
    filePath?: string
    mimeType?: string
  }): Promise<AdminDocument> =>
    apiClient.post<AdminDocument>("/admin/documents", data).then((r) => r.data),

  indexDocument: (id: string) =>
    apiClient
      .post<{ status: string; documentId: string; startedAt: string }>(
        `/admin/documents/${id}/index`
      )
      .then((r) => r.data),

  disableDocument: (id: string): Promise<AdminDocument> =>
    apiClient.patch<AdminDocument>(`/admin/documents/${id}/disable`).then((r) => r.data),

  enableDocument: (id: string) =>
    apiClient
      .patch<{ status: string }>(`/admin/documents/${id}/enable`)
      .then((r) => r.data),

  deleteDocument: (id: string): Promise<{ deleted: boolean }> =>
    apiClient.delete<{ deleted: boolean }>(`/admin/documents/${id}`).then((r) => r.data),

  reindexAll: (): Promise<{ status: string }> =>
    apiClient.post<{ status: string }>("/admin/reindex", { confirm: true }).then((r) => r.data),

  // Feedbacks
  listFeedbacks: (
    status: string,
    page: number
  ): Promise<{ feedbacks: AdminFeedback[]; total: number }> =>
    apiClient
      .get<{ feedbacks: AdminFeedback[]; total: number }>("/admin/feedbacks", {
        params: { status: status === "all" ? undefined : status, page },
      })
      .then((r) => r.data),

  resolveFeedback: (id: string): Promise<AdminFeedback> =>
    apiClient.patch<AdminFeedback>(`/admin/feedbacks/${id}/resolve`).then((r) => r.data),

  // Logs
  listLogs: (filters: {
    from?: string
    to?: string
    role?: string
    flagged?: boolean
    page?: number
    limit?: number
  }): Promise<AdminQueryLog[]> =>
    apiClient
      .get<AdminQueryLog[]>("/admin/logs", { params: filters })
      .then((r) => (Array.isArray(r.data) ? r.data : [])),

  // Guests
  listGuests: (
    active?: boolean,
    page?: number
  ): Promise<{ tokens: GuestToken[]; total: number }> =>
    apiClient
      .get<{ tokens: GuestToken[]; total: number }>("/admin/guests", {
        params: {
          active: active === undefined ? undefined : String(active),
          page,
        },
      })
      .then((r) => r.data),

  createGuest: (data: {
    firstName: string
    lastName: string
    email: string
    expiresAt: string
  }): Promise<CreateGuestTokenResult> =>
    apiClient.post<CreateGuestTokenResult>("/admin/guests", data).then((r) => r.data),

  extendGuest: (id: string, expiresAt: string): Promise<ExtendGuestTokenResult> =>
    apiClient
      .patch<ExtendGuestTokenResult>(`/admin/guests/${id}/extend`, { expiresAt })
      .then((r) => r.data),

  revokeGuest: (id: string): Promise<{ deleted: boolean }> =>
    apiClient.delete<{ deleted: boolean }>(`/admin/guests/${id}`).then((r) => r.data),
}

export default apiClient
