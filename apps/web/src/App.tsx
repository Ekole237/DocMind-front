import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { ProtectedRoute } from "./components/ProtectedRoute"
import { AuthProvider } from "./contexts/AuthContext"
import { NotFoundPage } from "./pages/NotFoundPage"
import { UnauthorizedPage } from "./pages/UnauthorizedPage"
import { DashboardPage } from "./pages/admin/DashboardPage"
import { DocumentsPage } from "./pages/admin/DocumentsPage"
import { FeedbacksPage } from "./pages/admin/FeedbacksPage"
import { GuestsPage } from "./pages/admin/GuestsPage"
import { LogsPage } from "./pages/admin/LogsPage"
import { ActivateGuestPage } from "./pages/auth/ActivateGuestPage"
import { CallbackPage } from "./pages/auth/CallbackPage"
import { LoginPage } from "./pages/auth/LoginPage"
import { ChatPage } from "./pages/chat/ChatPage"
import { HistoryPage } from "./pages/chat/HistoryPage"

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Auth */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<CallbackPage />} />
          <Route path="/auth/guest/activate" element={<ActivateGuestPage />} />
          <Route path="/auth/guest/magic-link/activate" element={<ActivateGuestPage />} />

          {/* Chat — EMPLOYEE et GUEST */}
          <Route
            path="/chat"
            element={
              <ProtectedRoute allowedRoles={["employee", "guest"]}>
                <ChatPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute allowedRoles={["employee", "guest"]}>
                <HistoryPage />
              </ProtectedRoute>
            }
          />

          {/* Admin — ADMIN uniquement */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/documents"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <DocumentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/feedbacks"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <FeedbacksPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/logs"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <LogsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/guests"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <GuestsPage />
              </ProtectedRoute>
            }
          />

          {/* Errors */}
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="/404" element={<NotFoundPage />} />

          {/* Fallback */}
          <Route path="/" element={<Navigate to="/chat" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
