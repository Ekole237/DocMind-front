import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { History, LogOut, Menu, Settings, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import apiClient from "../../api/client"
import { FeedbackModal } from "../../components/chat/FeedbackModal"
import { MessageBubble } from "../../components/chat/MessageBubble"
import { SourceCitation } from "../../components/chat/SourceCitation"
import { useAuth } from "../../hooks/useAuth"
import type { ChatQueryResponse } from "../../types"

interface Message {
  id: string
  type: "user" | "assistant"
  content: string
  timestamp?: number
  source?: ChatQueryResponse["source"]
  isIgnorance?: boolean
  queryLogId?: string
}

export function ChatPage() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [feedbackModal, setFeedbackModal] = useState<{ isOpen: boolean; queryLogId: string }>({
    isOpen: false,
    queryLogId: "",
  })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to latest message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return

    // Add user message
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      type: "user",
      content: inputValue,
    }
    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    try {
      // Call API
      const response = await apiClient.post<ChatQueryResponse>("/chat/query", {
        question: inputValue,
      })

      const { answer, isIgnorance, source, queryLogId, responseTimeMs } = response.data

      // Add assistant message
      const assistantMessage: Message = {
        id: `msg-${Date.now()}-ans`,
        type: "assistant",
        content: isIgnorance
          ? "Je n'ai pas trouvé d'information pertinente dans mes documents."
          : answer,
        timestamp: responseTimeMs,
        source: source || undefined,
        isIgnorance,
        queryLogId,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erreur lors de la requête"

      const errorMsg: Message = {
        id: `msg-${Date.now()}-err`,
        type: "assistant",
        content: `⚠️ ${errorMessage}`,
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }

  const handleFeedback = async (comment?: string) => {
    try {
      await apiClient.post("/chat/feedback", {
        queryLogId: feedbackModal.queryLogId,
        comment,
      })
    } catch (error) {
      throw error
    }
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-border bg-card transition-transform md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full p-4">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-lg font-semibold">Doc Mind</h1>
            <button
              className="md:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-label="Fermer le menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
              onClick={() => navigate("/history")}
            >
              <History className="h-4 w-4" />
              Historique
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Settings className="h-4 w-4" />
              Paramètres
            </Button>
          </nav>

          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-destructive hover:text-destructive"
            onClick={() => {
              logout()
              navigate("/login")
            }}
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </Button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b border-border bg-card px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              className="md:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Ouvrir le menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="flex-1 text-center font-semibold md:text-left">Chat - Assistant RH</h2>
          </div>
        </header>

        {/* Messages Area */}
        <div
          className="flex-1 overflow-y-auto p-4 space-y-2"
          ref={scrollRef}
        >
          {messages.length === 0 && (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Bienvenue!</h3>
                <p className="text-muted-foreground">
                  Posez une question pour commencer une conversation.
                </p>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id}>
              <MessageBubble
                type={msg.type}
                content={msg.content}
                timestamp={msg.timestamp}
                isLoading={false}
              />

              {msg.type === "assistant" && msg.source && (
                <div className="pl-2">
                  <SourceCitation source={msg.source} />
                </div>
              )}

              {msg.type === "assistant" && msg.queryLogId && !msg.isIgnorance && (
                <div className="mt-2 pl-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setFeedbackModal({
                        isOpen: true,
                        queryLogId: msg.queryLogId!,
                      })
                    }
                  >
                    Signaler
                  </Button>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <MessageBubble type="assistant" content="" isLoading={true} />
          )}
        </div>

        {/* Input Area */}
        <form
          onSubmit={handleSubmit}
          className="border-t border-border bg-card p-4"
        >
          <div className="flex gap-2">
            <Input
              placeholder="Posez une question..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
              className="flex-1"
              autoFocus
            />
            <Button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              size="default"
            >
              {isLoading ? "..." : "Envoyer"}
            </Button>
          </div>
        </form>
      </div>

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        queryLogId={feedbackModal.queryLogId}
        onClose={() => setFeedbackModal({ isOpen: false, queryLogId: "" })}
        onSubmit={handleFeedback}
      />

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
