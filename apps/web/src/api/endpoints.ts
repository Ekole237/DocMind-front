export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

/**
 * @description Endpoints for the API.
 */
export const ENDPOINTS = {
  login: '/auth/login',
  activateGuest: (token: string) => `/auth/guest/activate?token=${token}`,
  requestMagicLink: 'auth/guest/magic-link',
  activateMagicLink: (token: string) => `/auth/guest/magic-link/activate?token=${token}`,
  chat: {
    sessions: '/chat/sessions',
    sessionLogs: (id: string) => `/chat/sessions/${id}/logs`,
  },
  admin: {
    dashboard: '/admin/dashboard',
    documents: '/admin/documents',
    documentsById: (id: string) => `/admin/documents/${id}`,
    documentsByIdIndex: (id: string) => `/admin/documents/${id}/index`,
    documentsByIdDisable: (id: string) => `/admin/documents/${id}/disable`,
    documentsByIdEnable: (id: string) => `/admin/documents/${id}/enable`,
    documentsByIdDelete: (id: string) => `/admin/documents/${id}`,
    reindex: '/admin/reindex',
    feedbacks: '/admin/feedbacks',
    feedbacksById: (id: string) => `/admin/feedbacks/${id}`,
    feedbacksByIdResolve: (id: string) => `/admin/feedbacks/${id}/resolve`,
    logs: '/admin/logs',
    guests: '/admin/guests',
    guestsById: (id: string) => `/admin/guests/${id}`,
    guestsByIdDelete: (id: string) => `/admin/guests/${id}`,
    guestsByIdExtend: (id: string) => `/admin/guests/${id}/extend`,
    revokeGuest: (id: string) => `/admin/guests/${id}/revoke`,
  },
} as const