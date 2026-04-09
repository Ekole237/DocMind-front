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
export interface Source {
  documentName: string
  lastModified: string
  driveUrl: string
  confidenceScore: number
}

export interface ChatQueryRequest {
  question: string
}

export interface ChatQueryResponse {
  answer: string
  isIgnorance: boolean
  source: Source | null
  queryLogId: string
  responseTimeMs: number
}

export interface ChatMessage {
  id: string
  question: string
  answer: string
  sourceDocName: string | null
  isFlagged: boolean
  isIgnorance: boolean
  timestamp: string
}

export interface ChatHistoryResponse {
  logs: ChatMessage[]
  total: number
  page: number
  limit: number
}

export interface FeedbackRequest {
  queryLogId: string
  comment?: string
}

export interface FeedbackResponse {
  id: string
  queryLogId: string
  status: "PENDING" | "RESOLVED"
  createdAt: string
}

// ============= ADMIN TYPES =============
export interface Dashboard {
  totalDocuments: number
  queriestoday: number
  pendingFeedbacks: number
  activeGuests: number
}

export interface Document {
  id: string
  name: string
  status: "INDEXED" | "PENDING" | "FAILED"
  createdAt: string
  updatedAt: string
}

export interface DocumentsResponse {
  documents: Document[]
  total: number
  page: number
  limit: number
}

export interface Feedback {
  id: string
  queryLogId: string
  question: string
  comment: string | null
  status: "PENDING" | "RESOLVED"
  createdAt: string
}

export interface FeedbacksResponse {
  feedbacks: Feedback[]
  total: number
  page: number
  limit: number
}

export interface LogEntry {
  id: string
  query: string
  answer: string
  userRole: string
  isFlagged: boolean
  sourceDocName: string | null
  timestamp: string
}

export interface LogsResponse {
  logs: LogEntry[]
  total: number
  page: number
  limit: number
}

export interface Guest {
  id: string
  email: string
  expirationDate: string
  status: "ACTIVE" | "EXPIRED"
  createdAt: string
}

export interface GuestsResponse {
  guests: Guest[]
  total: number
  page: number
  limit: number
}

// ============= ERROR TYPES =============
export interface ApiError {
  statusCode: number
  message: string
  code?: string
}
