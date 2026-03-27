import { createContext, useContext } from "react"

import type { MailEnvelope, MailMessage, MailFolder } from "@/types/mail.types"

interface UserInfo {
  email: string
  name: string
}

type SearchField = "from" | "subject" | "body"

interface MailState {
  selectedUid: number | null
  selectedMessage: MailMessage | null
  messages: MailEnvelope[]
  folders: MailFolder[]
  currentFolder: string
  loading: boolean
  error: string | null
  total: number
  user: UserInfo | null
  searchQuery: string
  searchField: SearchField
  searchResults: MailEnvelope[] | null
  searching: boolean
}

interface MailContextType {
  state: MailState
  selectMessage: (uid: number) => void
  changeFolder: (folder: string) => void
  refreshMessages: () => void
  sendReply: (text: string) => Promise<void>
  sendNewMail: (to: string[], subject: string, text: string) => Promise<void>
  deleteMessage: (uid: number) => Promise<void>
  toggleRead: (uid: number, seen: boolean) => Promise<void>
  toggleFlagged: (uid: number, flagged: boolean) => Promise<void>
  moveMessage: (uid: number, destination: string) => Promise<void>
  searchMessages: (query: string, field: SearchField) => Promise<void>
  clearSearch: () => void
  bulkDelete: (uids: number[]) => Promise<void>
}

export const MailContext = createContext<MailContextType | null>(null)

export function useMail() {
  const context = useContext(MailContext)
  if (!context) {
    throw new Error("useMail must be used within a MailProvider")
  }
  return context
}
