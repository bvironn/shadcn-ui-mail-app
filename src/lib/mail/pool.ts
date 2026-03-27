import { ImapFlow } from "imapflow"

import type { MailCredentials } from "@/types/auth.types"

interface PoolEntry {
  client: ImapFlow
  lastUsed: number
  connecting: Promise<void> | null
}

const pool = new Map<string, PoolEntry>()

const IDLE_TIMEOUT = 5 * 60 * 1000

function poolKey(creds: MailCredentials): string {
  return `${creds.email}@${creds.imapHost}:${creds.imapPort}`
}

async function ensureConnected(entry: PoolEntry, creds: MailCredentials): Promise<ImapFlow> {
  if (entry.connecting) {
    await entry.connecting
    return entry.client
  }

  if (!entry.client.usable) {
    const connectPromise = entry.client.connect()
    entry.connecting = connectPromise
    try {
      await connectPromise
    } finally {
      entry.connecting = null
    }
  }

  entry.lastUsed = Date.now()
  return entry.client
}

export async function getClient(creds: MailCredentials): Promise<ImapFlow> {
  const key = poolKey(creds)
  let entry = pool.get(key)

  if (entry) {
    try {
      return await ensureConnected(entry, creds)
    } catch {
      pool.delete(key)
    }
  }

  const client = new ImapFlow({
    host: creds.imapHost,
    port: creds.imapPort,
    secure: creds.imapPort === 993,
    auth: { user: creds.email, pass: creds.password },
    logger: false,
    emitLogs: false,
  })

  entry = { client, lastUsed: Date.now(), connecting: null }
  pool.set(key, entry)

  const connectPromise = client.connect()
  entry.connecting = connectPromise
  try {
    await connectPromise
  } finally {
    entry.connecting = null
  }

  client.on("close", () => {
    pool.delete(key)
  })

  client.on("error", () => {
    pool.delete(key)
  })

  return client
}

export function removeClient(creds: MailCredentials): void {
  const key = poolKey(creds)
  const entry = pool.get(key)
  if (entry) {
    pool.delete(key)
    try { entry.client.logout() } catch { /* ignore */ }
  }
}

// Cleanup idle connections
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of pool) {
    if (now - entry.lastUsed > IDLE_TIMEOUT) {
      pool.delete(key)
      try { entry.client.logout() } catch { /* ignore */ }
    }
  }
}, 60_000)
