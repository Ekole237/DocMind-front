import { AlertCircle, Bot, Clock, RotateCcw, ServerCrash, User, WifiOff } from "lucide-react"
import type { ChatMessage } from "../../types"

interface MessageBubbleProps {
  role: "user" | "assistant"
  content: string
  responseTimeMs?: number
  isLoading?: boolean
  isError?: boolean
  errorType?: ChatMessage["errorType"]
  onRetry?: () => void
}

const ERROR_CONFIG = {
  network: {
    icon: WifiOff,
    title: "Connexion impossible",
    retryable: true,
  },
  server: {
    icon: ServerCrash,
    title: "Erreur serveur",
    retryable: true,
  },
  rate_limit: {
    icon: Clock,
    title: "Limite atteinte",
    retryable: false,
  },
  unknown: {
    icon: AlertCircle,
    title: "Erreur inattendue",
    retryable: true,
  },
} satisfies Record<NonNullable<ChatMessage["errorType"]>, { icon: React.ComponentType<{ className?: string }>; title: string; retryable: boolean }>

export function MessageBubble({
  role,
  content,
  responseTimeMs,
  isLoading,
  isError,
  errorType = "unknown",
  onRetry,
}: MessageBubbleProps) {
  const isUser = role === "user"

  if (isError) {
    const { icon: ErrorIcon, title, retryable } = ERROR_CONFIG[errorType]

    return (
      <div className="flex w-full justify-start">
        <div className="flex max-w-[85%] flex-row gap-4">
          {/* Avatar */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-destructive/10 border-destructive/25 text-destructive">
            <Bot className="h-5 w-5" />
          </div>

          {/* Error card */}
          <div className="rounded-2xl rounded-tl-sm border border-destructive/20 bg-destructive/[0.06] px-4 py-3.5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                <ErrorIcon className="h-3.5 w-3.5 text-destructive" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-snug text-destructive/90">{title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{content}</p>
                {retryable && onRetry && (
                  <button
                    onClick={onRetry}
                    className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-destructive/60 transition-colors hover:text-destructive"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Réessayer
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`flex max-w-[85%] gap-4 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        {/* Avatar */}
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
            isUser ? "bg-primary text-primary-foreground border-primary" : "bg-muted border-border"
          }`}
        >
          {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
        </div>

        {/* Message Content */}
        <div className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
          <div
            className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              isUser
                ? "bg-primary text-primary-foreground rounded-tr-sm"
                : "bg-muted text-foreground border border-border rounded-tl-sm"
            }`}
          >
            {isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" style={{ animationDelay: "0ms" }} />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" style={{ animationDelay: "150ms" }} />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" style={{ animationDelay: "300ms" }} />
                </span>
                <span className="text-xs">Réflexion...</span>
              </div>
            ) : (
              <p className="whitespace-pre-wrap break-words">{content}</p>
            )}
          </div>

          {/* Metadata */}
          {!isLoading && responseTimeMs !== undefined && (
            <span className="mt-1 px-1 text-[10px] text-muted-foreground">
              {responseTimeMs < 1000
                ? `${responseTimeMs}ms`
                : `${(responseTimeMs / 1000).toFixed(2)}s`}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
