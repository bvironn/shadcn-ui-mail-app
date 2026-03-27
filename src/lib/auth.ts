import type { AstroGlobal } from "astro"

import type { MailCredentials } from "@/types/auth.types"

const SESSION_KEY = "mail_credentials"

export async function getCredentials(
  session: AstroGlobal["session"]
): Promise<MailCredentials | null> {
  console.log("[AUTH] getCredentials called, session exists:", !!session)
  if (!session) return null

  try {
    const creds = await session.get(SESSION_KEY)
    console.log("[AUTH] session.get result:", creds ? "found" : "empty")
    if (!creds) return null
    return creds as MailCredentials
  } catch (err) {
    console.error("[AUTH] session.get error:", err)
    return null
  }
}

export async function setCredentials(
  session: AstroGlobal["session"],
  creds: MailCredentials
): Promise<void> {
  console.log("[AUTH] setCredentials called, session exists:", !!session)
  if (!session) throw new Error("Sessions not available")

  try {
    await session.set(SESSION_KEY, creds)
    console.log("[AUTH] session.set OK")

    // Verify it was actually saved
    const verify = await session.get(SESSION_KEY)
    console.log("[AUTH] Verify after set:", verify ? "found" : "NOT FOUND")
  } catch (err) {
    console.error("[AUTH] session.set error:", err)
    throw err
  }
}

export async function clearCredentials(
  session: AstroGlobal["session"]
): Promise<void> {
  console.log("[AUTH] clearCredentials called")
  if (!session) return
  await session.destroy()
}
