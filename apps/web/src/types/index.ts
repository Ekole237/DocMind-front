// ============= AUTH TYPES =============

// Payload décodé du JWT backend
export interface JwtUser {
  sub: string
  email: string
  role: "employee" | "admin" | "guest"
  role_level: number
  is_guest?: boolean
}

export interface LoginRequest {
  email: string
  password: string
}

// Le backend retourne un JWT brut (string), pas d'enveloppe JSON
export type AuthResponse = string

// ============= CHAT TYPES =============
export interface ChatSource {
  documentName: string
  lastModified: string
  driveUrl: string
  confidenceScore: number
}

export interface ChatResponse {
  answer: string
  isIgnorance: boolean
  source: ChatSource | null
  queryLogId: string
  responseTimeMs: number
}

export interface FeedbackRequest {
  queryLogId: string
  comment?: string
}

export interface FeedbackResponse {
  id: string
  queryLogId: string
  status: string
  createdAt: string
}

// Item retourné par GET /chat/history
export interface QueryLogSummary {
  id: string
  question: string
  answer: string
  sourceDocName: string | null
  isFlagged: boolean
  isIgnorance: boolean
  timestamp: string
}

export interface HistoryResponse {
  logs: QueryLogSummary[]
  total: number
  page: number
  limit: number
}

// Message UI — état local du ChatPage
export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  source?: ChatSource | null
  isIgnorance?: boolean
  queryLogId?: string
  hasFeedback?: boolean
  responseTimeMs?: number
}

// ============= ADMIN TYPES =============

export type DocumentStatus = "PENDING" | "INDEXED" | "DISABLED" | "ERROR"
export type FeedbackStatus = "PENDING" | "RESOLVED"
export type Confidentiality = "PUBLIC"

export interface DashboardMetrics {
  documentsIndexed: number
  documentsPending: number
  feedbacksPending: number
  queriesThisMonth: number
}

export interface AdminDocument {
  _id: string
  _title: string
  _driveUrl: string | null
  _filePath: string | null
  _mimeType: string | null
  _confidentiality: Confidentiality
  _status: DocumentStatus
  _chunkCount: number
  _lastModified: string
  _createdAt: string
}

export interface AdminFeedback {
  id: string
  queryLogId: string
  comment: string | null
  status: FeedbackStatus
  createdAt: string
}

export interface AdminQueryLog {
  id: string
  question: string
  answer: string
  role: string
  isGuest: boolean
  isIgnorance: boolean
  isFlagged: boolean
  sourceDocId: string | null
  sourceDocName: string | null
  sourceDriveUrl: string | null
  responseTimeMs: number
  timestamp: string
}

export interface GuestToken {
  _id: string
  _firstName: string
  _lastName: string
  _email: string
  _token: string
  _used: boolean
  _createdBy: string
  _expiresAt: string
  _createdAt: string
}

export interface CreateGuestTokenResult {
  id: string
  email: string
  expiresAt: string
  activateUrl: string
  createdAt: string
}

export interface ExtendGuestTokenResult {
  id: string
  email: string
  expiresAt: string
  activateUrl: string
}

// ============= ERROR TYPES =============
export interface ApiError {
  statusCode: number
  message: string
  code?: string
}
