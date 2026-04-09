interface MessageBubbleProps {
  type: "user" | "assistant"
  content: string
  timestamp?: number // in milliseconds
  isLoading?: boolean
}

export function MessageBubble({ type, content, timestamp, isLoading }: MessageBubbleProps) {
  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  return (
    <div className={`flex ${type === "user" ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-md rounded-lg p-3 text-sm leading-relaxed ${
          type === "user"
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground border border-border"
        }`}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="inline-block h-3 w-3 animate-spin rounded-full border border-current border-t-transparent"></div>
            <span>Réflexion en cours...</span>
          </div>
        ) : (
          <div>
            <p>{content}</p>
            {timestamp !== undefined && (
              <p className="mt-1 text-xs opacity-70">(Réponse en {formatTime(timestamp)})</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
