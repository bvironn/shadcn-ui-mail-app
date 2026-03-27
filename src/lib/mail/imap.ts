import { ImapFlow } from "imapflow"
import type { FetchMessageObject } from "imapflow"

import type { MailCredentials } from "@/types/auth.types"
import type {
  MailAddress,
  MailEnvelope,
  MailFolder,
  MailMessage,
} from "@/types/mail.types"
import { getClient } from "@/lib/mail/pool"

function parseAddress(addr: { name?: string; address?: string } | undefined): MailAddress {
  return {
    name: addr?.name || "",
    address: addr?.address || "",
  }
}

function parseAddressList(
  list: { name?: string; address?: string }[] | undefined
): MailAddress[] {
  if (!list) return []
  return list.map(parseAddress)
}

function extractEnvelope(msg: FetchMessageObject): MailEnvelope {
  const envelope = msg.envelope
  const flags = msg.flags ?? new Set<string>()

  return {
    uid: msg.uid,
    messageId: envelope?.messageId || "",
    from: parseAddress(envelope?.from?.[0]),
    to: parseAddressList(envelope?.to),
    cc: parseAddressList(envelope?.cc),
    subject: envelope?.subject || "(No subject)",
    date: envelope?.date?.toISOString() || new Date().toISOString(),
    seen: flags.has("\\Seen"),
    flagged: flags.has("\\Flagged"),
    labels: [],
    preview: "",
  }
}

export async function verifyCredentials(creds: MailCredentials): Promise<boolean> {
  const client = new ImapFlow({
    host: creds.imapHost,
    port: creds.imapPort,
    secure: creds.imapPort === 993,
    auth: { user: creds.email, pass: creds.password },
    logger: false,
  })
  try {
    await client.connect()
    return true
  } catch {
    return false
  } finally {
    try { await client.logout() } catch { /* ignore */ }
  }
}

export async function listFolders(creds: MailCredentials): Promise<MailFolder[]> {
  const client = await getClient(creds)
  const mailboxes = await client.list()

  const folders: MailFolder[] = []

  for (const mailbox of mailboxes) {
    let messagesCount = 0
    let unseenCount = 0

    try {
      const status = await client.status(mailbox.path, {
        messages: true,
        unseen: true,
      })
      messagesCount = status.messages || 0
      unseenCount = status.unseen || 0
    } catch {
      // Some folders may not support status
    }

    const specialUse = "specialUse" in mailbox
      ? (mailbox.specialUse as string) ?? null
      : null

    folders.push({
      path: mailbox.path,
      name: mailbox.name,
      delimiter: mailbox.delimiter || "/",
      specialUse,
      messagesCount,
      unseenCount,
    })
  }

  return folders
}

export async function listMessages(
  creds: MailCredentials,
  folder: string,
  page: number,
  limit: number
): Promise<{ messages: MailEnvelope[]; total: number }> {
  const client = await getClient(creds)
  const lock = await client.getMailboxLock(folder)

  try {
    const mailbox = client.mailbox
    const total = mailbox && typeof mailbox === "object" && "exists" in mailbox
      ? (mailbox.exists as number)
      : 0

    if (total === 0) {
      return { messages: [], total: 0 }
    }

    const start = Math.max(1, total - (page * limit) + 1)
    const end = Math.max(1, total - ((page - 1) * limit))
    const range = `${start}:${end}`

    const messages: MailEnvelope[] = []

    for await (const msg of client.fetch(range, {
      envelope: true,
      flags: true,
    })) {
      messages.push(extractEnvelope(msg))
    }

    messages.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    return { messages, total }
  } finally {
    lock.release()
  }
}

export async function getMessage(
  creds: MailCredentials,
  folder: string,
  uid: number
): Promise<MailMessage | null> {
  const client = await getClient(creds)
  const lock = await client.getMailboxLock(folder)

  try {
    const msg = await client.fetchOne(String(uid), {
      envelope: true,
      flags: true,
      source: true,
    }, { uid: true })

    if (!msg) return null

    const base = extractEnvelope(msg)
    let text = ""
    let html = ""

    if (msg.source) {
      const { simpleParser } = await import("mailparser")
      const parsed = await simpleParser(msg.source)
      text = parsed.text || ""
      html = parsed.html || ""
    }

    return {
      ...base,
      replyTo: parseAddressList(msg.envelope?.replyTo),
      text,
      html,
      inReplyTo: msg.envelope?.inReplyTo || null,
      references: [],
    }
  } finally {
    lock.release()
  }
}

export async function toggleSeen(
  creds: MailCredentials,
  folder: string,
  uid: number,
  seen: boolean
): Promise<void> {
  const client = await getClient(creds)
  const lock = await client.getMailboxLock(folder)

  try {
    if (seen) {
      await client.messageFlagsAdd(String(uid), ["\\Seen"], { uid: true })
    } else {
      await client.messageFlagsRemove(String(uid), ["\\Seen"], { uid: true })
    }
  } finally {
    lock.release()
  }
}

export async function toggleFlagged(
  creds: MailCredentials,
  folder: string,
  uid: number,
  flagged: boolean
): Promise<void> {
  const client = await getClient(creds)
  const lock = await client.getMailboxLock(folder)

  try {
    if (flagged) {
      await client.messageFlagsAdd(String(uid), ["\\Flagged"], { uid: true })
    } else {
      await client.messageFlagsRemove(String(uid), ["\\Flagged"], { uid: true })
    }
  } finally {
    lock.release()
  }
}

export async function moveMessage(
  creds: MailCredentials,
  folder: string,
  uid: number,
  destination: string
): Promise<void> {
  const client = await getClient(creds)
  const lock = await client.getMailboxLock(folder)

  try {
    await client.messageMove(String(uid), destination, { uid: true })
  } finally {
    lock.release()
  }
}

export type SearchField = "from" | "subject" | "body"

export async function searchMessages(
  creds: MailCredentials,
  folder: string,
  query: string,
  field: SearchField
): Promise<MailEnvelope[]> {
  const client = await getClient(creds)
  const lock = await client.getMailboxLock(folder)

  try {
    const searchQuery: Record<string, string> = {}
    if (field === "from") searchQuery.from = query
    else if (field === "subject") searchQuery.subject = query
    else searchQuery.body = query

    const result = await client.search(searchQuery, { uid: true })
    const uids = Array.isArray(result) ? result : []

    if (uids.length === 0) return []

    const uidList = uids.slice(-100).join(",")
    const messages: MailEnvelope[] = []

    for await (const msg of client.fetch(uidList, {
      envelope: true,
      flags: true,
    }, { uid: true })) {
      messages.push(extractEnvelope(msg))
    }

    messages.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    return messages
  } finally {
    lock.release()
  }
}

export async function deleteMessage(
  creds: MailCredentials,
  folder: string,
  uid: number
): Promise<void> {
  const client = await getClient(creds)
  const lock = await client.getMailboxLock(folder)

  try {
    await client.messageFlagsAdd(String(uid), ["\\Deleted"], { uid: true })
    await client.messageDelete(String(uid), { uid: true })
  } finally {
    lock.release()
  }
}
