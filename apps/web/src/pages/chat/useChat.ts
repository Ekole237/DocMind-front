import { useState, useRef, useEffect } from "react"
import type { AxiosError } from "axios"
import apiClient from "../../api/client"
import type { ApiError, ChatMessage, ChatResponse } from "../../types"

const MIN_LENGTH = 3
const MAX_LENGTH = 1000
const LOCAL_STORAGE_KEY = "docmind_chat_messages"

function getFeedbackErrorMessage(err: unknown): string {
  const axiosErr = err as AxiosError<ApiError>
  const code = axiosErr.response?.data?.code
  if (code === "FEEDBACK_ALREADY_EXISTS") return "Un feedback a déjà été soumis pour cette réponse."
  if (code === "QUERY_LOG_NOT_FOUND") return "Réponse introuvable."
  return "Erreur lors de l'envoi du feedback."
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (e) {
      console.error("Erreur lors de la lecture des messages depuis le localStorage", e)
    }
    return []
  })
  const [inputValue, setInputValue] = useState("")
  const [inputError, setInputError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [rateLimited, setRateLimited] = useState(false)
  const [feedbackModal, setFeedbackModal] = useState<{ isOpen: boolean; queryLogId: string }>({
    isOpen: false,
    queryLogId: "",
  })

  const scrollRef = useRef<HTMLDivElement>(null)
  const lastQuestionRef = useRef<string>("")

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(messages))
  }, [messages])

  const clearSession = () => {
    setMessages([])
    localStorage.removeItem(LOCAL_STORAGE_KEY)
  }

  const executeQuery = async (question: string) => {
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
      const status = axiosErr.response?.status

      let errorType: ChatMessage["errorType"] = "unknown"
      let content = "Une erreur s'est produite. Réessayez."

      if (!axiosErr.response) {
        errorType = "network"
        content = "Vérifiez votre connexion internet et réessayez."
      } else if (status === 429) {
        errorType = "rate_limit"
        content = "Vous avez envoyé trop de questions. Patientez quelques minutes."
        setRateLimited(true)
        setTimeout(() => setRateLimited(false), 60_000)
      } else if (status && status >= 500) {
        errorType = "server"
        content = "Un problème est survenu de notre côté. Réessayez dans un instant."
      }

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content,
          isError: true,
          errorType,
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

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

    lastQuestionRef.current = question
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: question },
    ])
    setInputValue("")
    await executeQuery(question)
  }

  const retryLastMessage = async () => {
    if (!lastQuestionRef.current || isLoading || rateLimited) return
    setMessages((prev) => {
      const last = prev[prev.length - 1]
      return last?.isError ? prev.slice(0, -1) : prev
    })
    await executeQuery(lastQuestionRef.current)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
    retryLastMessage,
    handleFeedback,
    clearSession,
    MAX_LENGTH,
  }
}
