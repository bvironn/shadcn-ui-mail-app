import { useState, useEffect, useCallback, useRef, type ReactNode } from "react"

import type { MailEnvelope, MailMessage, MailFolder } from "@/types/mail.types"
import { MailContext } from "@/hooks/useMail"

interface MailProviderProps {
  children: ReactNode
}

export function MailProvider({ children }: MailProviderProps) {
  const [selectedUid, setSelectedUid] = useState<number | null>(null)
  const [selectedMessage, setSelectedMessage] = useState<MailMessage | null>(null)
  const [messages, setMessages] = useState<MailEnvelope[]>([])
  const [folders, setFolders] = useState<MailFolder[]>([])
  const [currentFolder, setCurrentFolder] = useState("INBOX")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [user, setUser] = useState<{ email: string; name: string } | null>(null)
  const foldersLoaded = useRef(false)
  const messageCache = useRef<Map<number, MailMessage>>(new Map())

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch("/api/auth/me")
        const data = await res.json()
        if (!data.authenticated) { window.location.href = "/login"; return }
        setUser({ email: data.email, name: data.name })
      } catch {
        window.location.href = "/login"
        return
      }

      if (!foldersLoaded.current) {
        fetch("/api/mail/folders")
          .then((r) => r.json())
          .then((data) => {
            if (data.folders) {
              setFolders(data.folders)
              foldersLoaded.current = true
            }
          })
          .catch(() => {})
      }
    }
    init()
  }, [])

  const fetchMessages = useCallback(async (folder: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/mail/list?folder=${encodeURIComponent(folder)}&limit=50`)
      if (res.status === 401) { window.location.href = "/login"; return }
      const data = await res.json()
      if (data.error) throw new Error(typeof data.error === "string" ? data.error : "Failed to fetch messages")
      setMessages(data.messages)
      setTotal(data.total)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch messages"
      setError(message)
      setMessages([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMessages(currentFolder)
  }, [currentFolder, fetchMessages])

  const selectMessage = useCallback((uid: number) => {
    setSelectedUid(uid)

    const cached = messageCache.current.get(uid)
    if (cached) {
      setSelectedMessage(cached)
      return
    }

    setSelectedMessage(null)
    fetch(`/api/mail/${uid}?folder=${encodeURIComponent(currentFolder)}`)
      .then((r) => {
        if (r.status === 401) { window.location.href = "/login"; return null }
        return r.json()
      })
      .then((data) => {
        if (!data || data.error) return
        messageCache.current.set(uid, data.message)
        setSelectedMessage(data.message)
      })
      .catch((err) => {
        console.error("Failed to fetch message:", err)
      })
  }, [currentFolder])

  const changeFolder = useCallback((folder: string) => {
    setCurrentFolder(folder)
    setSelectedUid(null)
    setSelectedMessage(null)
    messageCache.current.clear()
  }, [])

  const refreshMessages = useCallback(() => {
    messageCache.current.clear()
    fetchMessages(currentFolder)
    fetch("/api/mail/folders")
      .then((r) => r.json())
      .then((data) => { if (data.folders) setFolders(data.folders) })
      .catch(() => {})
  }, [currentFolder, fetchMessages])

  const sendReply = useCallback(async (text: string) => {
    if (!selectedMessage) return

    const res = await fetch("/api/mail/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: [selectedMessage.from.address],
        subject: selectedMessage.subject.startsWith("Re:")
          ? selectedMessage.subject
          : `Re: ${selectedMessage.subject}`,
        text,
        inReplyTo: selectedMessage.messageId,
        references: [selectedMessage.messageId],
      }),
    })

    const data = await res.json()
    if (data.error) throw new Error(typeof data.error === "string" ? data.error : "Failed to send")
  }, [selectedMessage])

  const sendNewMail = useCallback(async (to: string[], subject: string, text: string) => {
    const res = await fetch("/api/mail/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, text }),
    })

    const data = await res.json()
    if (data.error) throw new Error(typeof data.error === "string" ? data.error : "Failed to send")
  }, [])

  const handleDelete = useCallback(async (uid: number) => {
    const res = await fetch(`/api/mail/${uid}?folder=${encodeURIComponent(currentFolder)}`, {
      method: "DELETE",
    })
    const data = await res.json()
    if (data.error) throw new Error(data.error)

    messageCache.current.delete(uid)
    setMessages((prev) => prev.filter((m) => m.uid !== uid))
    if (selectedUid === uid) {
      setSelectedUid(null)
      setSelectedMessage(null)
    }
  }, [currentFolder, selectedUid])

  const toggleRead = useCallback(async (uid: number, seen: boolean) => {
    const res = await fetch(`/api/mail/${uid}?folder=${encodeURIComponent(currentFolder)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seen }),
    })
    const data = await res.json()
    if (data.error) throw new Error(data.error)

    setMessages((prev) =>
      prev.map((m) => (m.uid === uid ? { ...m, seen } : m))
    )
    setSelectedMessage((prev) =>
      prev && prev.uid === uid ? { ...prev, seen } : prev
    )

    const cached = messageCache.current.get(uid)
    if (cached) {
      messageCache.current.set(uid, { ...cached, seen })
    }
  }, [currentFolder])

  const toggleFlagged = useCallback(async (uid: number, flagged: boolean) => {
    const res = await fetch(`/api/mail/${uid}?folder=${encodeURIComponent(currentFolder)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flagged }),
    })
    const data = await res.json()
    if (data.error) throw new Error(data.error)

    setMessages((prev) =>
      prev.map((m) => (m.uid === uid ? { ...m, flagged } : m))
    )
    setSelectedMessage((prev) =>
      prev && prev.uid === uid ? { ...prev, flagged } : prev
    )

    const cached = messageCache.current.get(uid)
    if (cached) {
      messageCache.current.set(uid, { ...cached, flagged })
    }
  }, [currentFolder])

  const handleMove = useCallback(async (uid: number, destination: string) => {
    const res = await fetch(`/api/mail/${uid}?folder=${encodeURIComponent(currentFolder)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moveTo: destination }),
    })
    const data = await res.json()
    if (data.error) throw new Error(data.error)

    messageCache.current.delete(uid)
    setMessages((prev) => prev.filter((m) => m.uid !== uid))
    if (selectedUid === uid) {
      setSelectedUid(null)
      setSelectedMessage(null)
    }
  }, [currentFolder, selectedUid])

  return (
    <MailContext.Provider
      value={{
        state: {
          selectedUid,
          selectedMessage,
          messages,
          folders,
          currentFolder,
          loading,
          error,
          total,
          user,
        },
        selectMessage,
        changeFolder,
        refreshMessages,
        sendReply,
        sendNewMail,
        deleteMessage: handleDelete,
        toggleRead,
        toggleFlagged,
        moveMessage: handleMove,
      }}
    >
      {children}
    </MailContext.Provider>
  )
}
