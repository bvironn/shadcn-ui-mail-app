export interface MailAddress {
  name: string
  address: string
}

export interface MailEnvelope {
  uid: number
  messageId: string
  from: MailAddress
  to: MailAddress[]
  cc: MailAddress[]
  subject: string
  date: string
  seen: boolean
  flagged: boolean
  labels: string[]
  preview: string
}

export interface MailMessage extends MailEnvelope {
  text: string
  html: string
  replyTo: MailAddress[]
  inReplyTo: string | null
  references: string[]
}

export interface MailFolder {
  path: string
  name: string
  delimiter: string
  specialUse: string | null
  messagesCount: number
  unseenCount: number
}

export interface SendMailPayload {
  to: string[]
  cc?: string[]
  bcc?: string[]
  subject: string
  text?: string
  html?: string
  inReplyTo?: string
  references?: string[]
}
