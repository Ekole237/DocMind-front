import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { History, LogOut, Menu, X, Send, Bot } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { FeedbackModal } from "../../components/chat/FeedbackModal"
import { MessageBubble } from "../../components/chat/MessageBubble"
import { SourceCitation } from "../../components/chat/SourceCitation"
import { useAuth } from "../../hooks/useAuth"
import { useChat } from "./useChat"

// --- PRESENTATIONAL COMPONENTS ---

function ChatSidebar({
  isOpen,
  onClose,
  onHistoryClick,
  onLogout,
}: {
  isOpen: boolean
  onClose: () => void
  onHistoryClick: () => void
  onLogout: () => void
}) {
  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-card transition-transform md:static md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-14 items-center justify-between border-b border-border/50 px-4">
          <div className="flex items-center gap-2 font-semibold">
            <Bot className="h-5 w-5 text-primary" />
            <span>Doc Mind</span>
          </div>
          <button className="md:hidden" onClick={onClose} aria-label="Fermer le menu">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3"
            onClick={onHistoryClick}
          >
            <History className="h-4 w-4" />
            Historique
          </Button>
        </nav>

        <div className="border-t border-border/50 p-4">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </Button>
        </div>
      </aside>
      
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}
    </>
  )
}

function ChatHeader({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b border-border/50 bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <button
        className="md:hidden"
        onClick={onMenuClick}
        aria-label="Ouvrir le menu"
      >
        <Menu className="h-5 w-5 text-muted-foreground" />
      </button>
      <div className="flex flex-1 items-center justify-between">
        <h2 className="text-sm font-medium">Assistant RH</h2>
      </div>
    </header>
  )
}

// --- MAIN CONTAINER ---

export function ChatPage() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  const {
    messages,
    inputValue,
    setInputValue,
    inputError,
    setInputError,
    isLoading,
    rateLimited,
    feedbackModal,
    setFeedbackModal,
    scrollRef,
    handleSubmit,
    handleFeedback,
    MAX_LENGTH,
  } = useChat()

  return (
    <div className="flex h-screen bg-background font-sans text-foreground selection:bg-primary/20">
      <ChatSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onHistoryClick={() => navigate("/history")}
        onLogout={logout}
      />

      <main className="flex flex-1 flex-col overflow-hidden relative">
        <ChatHeader onMenuClick={() => setSidebarOpen(true)} />

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto scroll-smooth" ref={scrollRef}>
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 pb-32 sm:p-6 sm:pb-36">
            {messages.length === 0 && !isLoading && (
              <div className="flex h-[50vh] flex-col items-center justify-center space-y-4 text-center opacity-0 animate-in fade-in duration-500">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Bot className="h-8 w-8" />
                </div>
                <div className="max-w-sm space-y-2">
                  <h3 className="text-xl font-semibold tracking-tight">Comment puis-je vous aider ?</h3>
                  <p className="text-sm text-muted-foreground">
                    Posez vos questions sur les documents de l'entreprise, je suis là pour vous accompagner.
                  </p>
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className="group relative flex flex-col gap-2">
                <MessageBubble
                  role={msg.role}
                  content={msg.content}
                  responseTimeMs={msg.role === "assistant" ? msg.responseTimeMs : undefined}
                />

                {msg.role === "assistant" && msg.source && (
                  <div className="pl-12">
                    <SourceCitation source={msg.source} />
                  </div>
                )}

                {msg.role === "assistant" && msg.queryLogId && !msg.isIgnorance && (
                  <div className="pl-12 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-muted-foreground hover:text-foreground"
                      disabled={msg.hasFeedback}
                      onClick={() =>
                        !msg.hasFeedback &&
                        setFeedbackModal({ isOpen: true, queryLogId: msg.queryLogId! })
                      }
                    >
                      {msg.hasFeedback ? "✓ Feedback envoyé" : "Signaler une erreur"}
                    </Button>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex flex-col gap-2">
                <MessageBubble role="assistant" content="" isLoading />
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background via-background to-transparent pt-6 pb-4">
          <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
            {rateLimited && (
              <p className="mb-2 text-center text-xs font-medium text-destructive">
                Limite atteinte — veuillez patienter quelques minutes.
              </p>
            )}
            
            <form
              onSubmit={handleSubmit}
              className={`relative flex items-end gap-2 rounded-2xl border bg-card p-1 shadow-sm transition-shadow focus-within:ring-1 focus-within:ring-ring ${
                inputError ? "border-destructive" : "border-input"
              }`}
            >
              <Input
                placeholder="Posez votre question..."
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value)
                  if (inputError) setInputError(null)
                }}
                disabled={isLoading || rateLimited}
                className="min-h-[44px] border-0 bg-transparent px-4 py-3 shadow-none focus-visible:ring-0 resize-none flex-1"
                autoFocus
                maxLength={MAX_LENGTH}
                autoComplete="off"
              />
              
              <div className="flex h-[44px] items-center pr-2">
                <Button
                  type="submit"
                  size="icon"
                  className="h-8 w-8 shrink-0 rounded-xl"
                  disabled={isLoading || rateLimited || !inputValue.trim()}
                >
                  <Send className="h-4 w-4" />
                  <span className="sr-only">Envoyer</span>
                </Button>
              </div>
            </form>
            
            {/* Footer / Error text */}
            <div className="mt-2 flex items-center justify-between px-2 text-[10px] text-muted-foreground">
              <span>
                {inputError ? (
                  <span className="text-destructive font-medium">{inputError}</span>
                ) : (
                  "L'assistant peut faire des erreurs. Vérifiez les informations importantes."
                )}
              </span>
              <span className={inputValue.length > MAX_LENGTH * 0.9 ? "text-destructive font-medium" : ""}>
                {inputValue.length} / {MAX_LENGTH}
              </span>
            </div>
          </div>
        </div>
      </main>

      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        queryLogId={feedbackModal.queryLogId}
        onClose={() => setFeedbackModal({ isOpen: false, queryLogId: "" })}
        onSubmit={handleFeedback}
      />
    </div>
  )
}
