import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { ProtectedRoute } from "./components/ProtectedRoute"
import { NotFoundPage } from "./pages/NotFoundPage"
import { UnauthorizedPage } from "./pages/UnauthorizedPage"
import { DashboardPage } from "./pages/admin/DashboardPage"
import { DocumentsPage } from "./pages/admin/DocumentsPage"
import { FeedbacksPage } from "./pages/admin/FeedbacksPage"
import { GuestsPage } from "./pages/admin/GuestsPage"
import { LogsPage } from "./pages/admin/LogsPage"
import { LoginPage } from "./pages/auth/LoginPage"
import { ChatPage } from "./pages/chat/ChatPage"
import { HistoryPage } from "./pages/chat/HistoryPage"

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Chat Routes */}
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <HistoryPage />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/documents"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <DocumentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/feedbacks"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <FeedbacksPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/logs"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <LogsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/guests"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <GuestsPage />
            </ProtectedRoute>
          }
        />

        {/* Error Pages */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/404" element={<NotFoundPage />} />

        {/* Fallback */}
        <Route path="/" element={<Navigate to="/chat" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
