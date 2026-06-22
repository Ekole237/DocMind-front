import type { AxiosInstance } from "axios";
import axios, { AxiosError } from "axios";
import type { JwtUser } from "@/types";
import { API_URL, ENDPOINTS } from "./endpoints";
import { ErrorHandler } from "@/utils/error-handler";

export const API_BASE_URL = API_URL;

const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor: 401 → logout
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const requestUrl = error.config?.url ?? "";
    const isSessionProbe = requestUrl.includes(ENDPOINTS.session);

    // Évite un faux "session_expired" sur la vérification initiale de session
    // (ex: arrivée sur /login sans cookie valide).
    if (error.response?.status === 401 && !isSessionProbe) {
      window.dispatchEvent(new CustomEvent("auth:expired"));
    }
    return Promise.reject(error);
  }
);

export async function login(email: string, password: string, _hp = ""): Promise<JwtUser> {
  try {
    const response = await apiClient.post<{ user: JwtUser | null }>(ENDPOINTS.login, {
      email,
      password,
      _hp,
    });
    if (!response.data.user) {
      throw ErrorHandler.createApiError({
        statusCode: 500,
        message: "Session invalide",
        code: "INVALID_SESSION",
      });
    }
    return response.data.user;
  } catch (err) {
    throw ErrorHandler.createApiError(err);
  }
}

export async function getSession(): Promise<JwtUser> {
  try {
    const response = await apiClient.get<{ user: JwtUser }>(ENDPOINTS.session);
    return response.data.user;
  } catch (err) {
    throw ErrorHandler.createApiError(err);
  }
}

export async function logoutSession(): Promise<void> {
  await apiClient.post(ENDPOINTS.logout);
}

export async function updatePassword(password: string): Promise<{ message: string }> {
  try {
    const response = await apiClient.put<{ message: string }>(ENDPOINTS.updatePassword, {
      password,
    });
    return response.data;
  } catch (err) {
    throw ErrorHandler.createApiError(err);
  }
}

export async function activateGuest(token: string): Promise<JwtUser> {
  try {
    const response = await apiClient.get<{ user: JwtUser | null }>(ENDPOINTS.activateGuest(token));
    if (!response.data.user) {
      throw ErrorHandler.createApiError({
        statusCode: 500,
        message: "Session invalide",
        code: "INVALID_SESSION",
      });
    }
    return response.data.user;
  } catch (err) {
    throw ErrorHandler.createApiError(err);
  }
}

export async function requestMagicLink(email: string, _hp = ""): Promise<{ message: string }> {
  try {
    const response = await apiClient.post<{ message: string }>(ENDPOINTS.requestMagicLink, {
      email,
      _hp,
    });
    return response.data;
  } catch (err) {
    throw ErrorHandler.createApiError(err);
  }
}

export async function activateMagicLink(token: string): Promise<JwtUser> {
  try {
    const response = await apiClient.get<{ user: JwtUser | null }>(
      ENDPOINTS.activateMagicLink(token)
    );
    if (!response.data.user) {
      throw ErrorHandler.createApiError({
        statusCode: 500,
        message: "Session invalide",
        code: "INVALID_SESSION",
      });
    }
    return response.data.user;
  } catch (err) {
    throw ErrorHandler.createApiError(err);
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
  ChatSession,
  ChatMessage,
} from "@/types";

export const chat = {
  getSessions: (): Promise<ChatSession[]> =>
    apiClient.get<ChatSession[]>(ENDPOINTS.chat.sessions).then((r) => r.data),
  getSessionLogs: (id: string): Promise<ChatMessage[]> =>
    apiClient.get<ChatMessage[]>(ENDPOINTS.chat.sessionLogs(id)).then((r) => r.data),
};

export const admin = {
  // Dashboard
  getDashboard: (): Promise<DashboardMetrics> =>
    apiClient.get<DashboardMetrics>(ENDPOINTS.admin.dashboard).then((r) => r.data),

  // Documents
  listDocuments: (): Promise<AdminDocument[]> =>
    apiClient
      .get<AdminDocument[]>(ENDPOINTS.admin.documents)
      .then((r) => (Array.isArray(r.data) ? r.data : [])),

  importDocument: (data: {
    title: string;
    confidentiality: string;
    file: File;
  }): Promise<AdminDocument> => {
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("confidentiality", data.confidentiality);
    formData.append("file", data.file);

    return apiClient
      .post<AdminDocument>(ENDPOINTS.admin.documents, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((r) => r.data);
  },

  importDocuments: (data: {
    confidentiality: string;
    files: File[];
  }): Promise<AdminDocument[]> => {
    const formData = new FormData();
    data.files.forEach((file) => formData.append("files", file));

    return apiClient
      .post<AdminDocument[]>(`${ENDPOINTS.admin.documents}/batch`, formData, {
        params: { confidentiality: data.confidentiality },
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((r) => r.data);
  },

  indexDocument: (id: string) =>
    apiClient
      .post<{
        status: string;
        documentId: string;
        startedAt: string;
      }>(ENDPOINTS.admin.documentsByIdIndex(id))
      .then((r) => r.data),

  disableDocument: (id: string): Promise<AdminDocument> =>
    apiClient.patch<AdminDocument>(ENDPOINTS.admin.documentsByIdDisable(id)).then((r) => r.data),

  enableDocument: (id: string) =>
    apiClient
      .patch<{ status: string }>(ENDPOINTS.admin.documentsByIdEnable(id))
      .then((r) => r.data),

  deleteDocument: (id: string): Promise<{ deleted: boolean }> =>
    apiClient
      .delete<{ deleted: boolean }>(ENDPOINTS.admin.documentsByIdDelete(id))
      .then((r) => r.data),

  reindexAll: (): Promise<{ status: string }> =>
    apiClient
      .post<{ status: string }>(ENDPOINTS.admin.reindex, { confirm: true })
      .then((r) => r.data),

  // Feedbacks
  listFeedbacks: (
    status: string,
    page: number
  ): Promise<{ feedbacks: AdminFeedback[]; total: number }> =>
    apiClient
      .get<{ feedbacks: AdminFeedback[]; total: number }>(ENDPOINTS.admin.feedbacks, {
        params: { status: status === "all" ? undefined : status, page },
      })
      .then((r) => r.data),

  resolveFeedback: (id: string): Promise<AdminFeedback> =>
    apiClient.patch<AdminFeedback>(ENDPOINTS.admin.feedbacksByIdResolve(id)).then((r) => r.data),

  // Logs
  listLogs: (filters: {
    from?: string;
    to?: string;
    role?: string;
    flagged?: boolean;
    ignorance?: boolean;
    page?: number;
    limit?: number;
  }): Promise<AdminQueryLog[]> =>
    apiClient
      .get<AdminQueryLog[]>(ENDPOINTS.admin.logs, { params: filters })
      .then((r) => (Array.isArray(r.data) ? r.data : [])),

  getSessionLogs: (id: string): Promise<AdminQueryLog[]> =>
    apiClient.get<AdminQueryLog[]>(ENDPOINTS.admin.sessionLogs(id)).then((r) => r.data),

  // Guests
  listGuests: (active?: boolean, page?: number): Promise<{ tokens: GuestToken[]; total: number }> =>
    apiClient
      .get<{ tokens: GuestToken[]; total: number }>(ENDPOINTS.admin.guests, {
        params: {
          active: active === undefined ? undefined : String(active),
          page,
        },
      })
      .then((r) => r.data),

  createGuest: (data: {
    firstName: string;
    lastName: string;
    email: string;
    expiresAt: string;
  }): Promise<CreateGuestTokenResult> =>
    apiClient.post<CreateGuestTokenResult>(ENDPOINTS.admin.guests, data).then((r) => r.data),

  extendGuest: (id: string, expiresAt: string): Promise<ExtendGuestTokenResult> =>
    apiClient
      .patch<ExtendGuestTokenResult>(ENDPOINTS.admin.guestsByIdExtend(id), { expiresAt })
      .then((r) => r.data),

  revokeGuest: (id: string): Promise<{ deleted: boolean }> =>
    apiClient.delete<{ deleted: boolean }>(ENDPOINTS.admin.revokeGuest(id)).then((r) => r.data),
};

export default apiClient;
