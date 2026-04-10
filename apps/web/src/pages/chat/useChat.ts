import { useState, useRef, useEffect } from "react"
import type { AxiosError } from "axios"
import apiClient from "../../api/client"
import type { ApiError, ChatMessage, ChatResponse } from "../../types"

const MIN_LENGTH = 3
const MAX_LENGTH = 1000

function getFeedbackErrorMessage(err: unknown): string {
  const axiosErr = err as AxiosError<ApiError>
  const code = axiosErr.response?.data?.code
  if (code === "FEEDBACK_ALREADY_EXISTS") return "Un feedback a déjà été soumis pour cette réponse."
  if (code === "QUERY_LOG_NOT_FOUND") return "Réponse introuvable."
  return "Erreur lors de l'envoi du feedback."
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [inputError, setInputError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [rateLimited, setRateLimited] = useState(false)
  const [feedbackModal, setFeedbackModal] = useState<{ isOpen: boolean; queryLogId: string }>({
    isOpen: false,
    queryLogId: "",
  })
  
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  const sendMessage = async (text: string) => {
    const question = text.trim()

    setInputError(null)
    if (question.length < MIN_LENGTH) {
      setInputError(`La question doit contenir au moins ${MIN_LENGTH} caractères.`)
      return
    }
    if (question.length > MAX_LENGTH) {
      setInputError(`La question ne peut pas dépasser ${MAX_LENGTH} caractères.`)
      return
    }
    if (isLoading || rateLimited) return

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: question,
    }
    setMessages((prev) => [...prev, userMsg])
    setInputValue("")
    setIsLoading(true)

    try {
      const { data } = await apiClient.post<ChatResponse>("/chat/query", { question })

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.isIgnorance
          ? "Je n'ai pas trouvé d'information pertinente dans les documents disponibles."
          : data.answer,
        source: data.source,
        isIgnorance: data.isIgnorance,
        queryLogId: data.queryLogId,
        responseTimeMs: data.responseTimeMs,
        hasFeedback: false,
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (err) {
      const axiosErr = err as AxiosError
      if (axiosErr.response?.status === 429) {
        setRateLimited(true)
        setTimeout(() => setRateLimited(false), 60_000)
        const errorMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "⚠️ Trop de questions envoyées. Réessayez dans quelques minutes.",
        }
        setMessages((prev) => [...prev, errorMsg])
      } else {
        const errorMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "⚠️ Une erreur est survenue. Réessayez.",
        }
        setMessages((prev) => [...prev, errorMsg])
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await sendMessage(inputValue)
  }

  const handleFeedback = async (comment?: string) => {
    try {
      await apiClient.post("/chat/feedback", {
        queryLogId: feedbackModal.queryLogId,
        comment,
      })
      setMessages((prev) =>
        prev.map((m) =>
          m.queryLogId === feedbackModal.queryLogId ? { ...m, hasFeedback: true } : m
        )
      )
    } catch (err) {
      throw new Error(getFeedbackErrorMessage(err))
    }
  }

  return {
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
    sendMessage,
    handleFeedback,
    MAX_LENGTH,
  }
}
