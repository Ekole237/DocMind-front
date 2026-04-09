import { Bot, User } from "lucide-react"

interface MessageBubbleProps {
  role: "user" | "assistant"
  content: string
  responseTimeMs?: number
  isLoading?: boolean
}

export function MessageBubble({ role, content, responseTimeMs, isLoading }: MessageBubbleProps) {
  const isUser = role === "user"

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
