import { ImapFlow } from "imapflow"

import type { MailCredentials } from "@/types/auth.types"

type IdleCallback = (folder: string) => void

interface IdleSession {
  client: ImapFlow
  folder: string
  listeners: Set<IdleCallback>
  stopping: boolean
}

const sessions = new Map<string, IdleSession>()

function sessionKey(creds: MailCredentials, folder: string): string {
  return `${creds.email}@${creds.imapHost}:${creds.imapPort}/${folder}`
}

async function startIdleLoop(session: IdleSession): Promise<void> {
  while (!session.stopping && session.listeners.size > 0) {
    try {
      if (!session.client.usable) break

      const lock = await session.client.getMailboxLock(session.folder)
      try {
        await session.client.idle()
      } finally {
        lock.release()
      }

      if (session.stopping) break

      for (const cb of session.listeners) {
        try { cb(session.folder) } catch { /* ignore */ }
      }
    } catch {
      break
    }
  }
}

export async function subscribe(
  creds: MailCredentials,
  folder: string,
  callback: IdleCallback
): Promise<() => void> {
  const key = sessionKey(creds, folder)
  let session = sessions.get(key)

  if (session) {
    session.listeners.add(callback)
    return () => unsubscribe(key, callback)
  }

  const client = new ImapFlow({
    host: creds.imapHost,
    port: creds.imapPort,
    secure: creds.imapPort === 993,
    auth: { user: creds.email, pass: creds.password },
    logger: false,
    emitLogs: false,
  })

  await client.connect()

  session = {
    client,
    folder,
    listeners: new Set([callback]),
    stopping: false,
  }
  sessions.set(key, session)

  client.on("close", () => {
    sessions.delete(key)
  })

  client.on("error", () => {
    sessions.delete(key)
  })

  client.on("exists", () => {
    for (const cb of session!.listeners) {
      try { cb(session!.folder) } catch { /* ignore */ }
    }
  })

  startIdleLoop(session)

  return () => unsubscribe(key, callback)
}

function unsubscribe(key: string, callback: IdleCallback): void {
  const session = sessions.get(key)
  if (!session) return

  session.listeners.delete(callback)

  if (session.listeners.size === 0) {
    session.stopping = true
    sessions.delete(key)
    try { session.client.logout() } catch { /* ignore */ }
  }
}
