import type { APIRoute } from "astro"

import { loginSchema } from "@/lib/validations/auth.schema"
import { verifyCredentials } from "@/lib/mail/imap"
import { setCredentials } from "@/lib/auth"
import type { MailCredentials } from "@/types/auth.types"

export const POST: APIRoute = async ({ request, session }) => {
  console.log("[LOGIN] POST /api/auth/login hit")

  try {
    const body = await request.json()
    console.log("[LOGIN] Body parsed:", { email: body.email, hasPassword: !!body.password, name: body.name })

    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      console.log("[LOGIN] Validation failed:", parsed.error.message)
      return Response.json({ error: parsed.error.message }, { status: 400 })
    }
    console.log("[LOGIN] Validation OK")

    const imapHost = process.env.IMAP_HOST
    const smtpHost = process.env.SMTP_HOST
    console.log("[LOGIN] Env vars:", { imapHost, smtpHost, imapPort: process.env.IMAP_PORT, smtpPort: process.env.SMTP_PORT })

    if (!imapHost || !smtpHost) {
      console.log("[LOGIN] Missing env vars!")
      return Response.json(
        { error: "Mail server not configured. Check IMAP_HOST and SMTP_HOST env vars." },
        { status: 500 }
      )
    }

    const creds: MailCredentials = {
      imapHost,
      imapPort: Number(process.env.IMAP_PORT || 993),
      smtpHost,
      smtpPort: Number(process.env.SMTP_PORT || 587),
      email: parsed.data.email,
      password: parsed.data.password,
      name: parsed.data.email.split("@")[0],
    }
    console.log("[LOGIN] Creds built, verifying IMAP connection...")

    const valid = await verifyCredentials(creds)
    console.log("[LOGIN] IMAP verify result:", valid)

    if (!valid) {
      return Response.json(
        { error: "Invalid credentials. Check your email and password." },
        { status: 401 }
      )
    }

    console.log("[LOGIN] Setting session... session object exists:", !!session)
    await setCredentials(session, creds)
    console.log("[LOGIN] Session set OK")

    return Response.json({
      email: creds.email,
      name: creds.name,
    })
  } catch (error) {
    console.error("[LOGIN] Error:", error)
    const message = error instanceof Error ? error.message : "Login failed"
    return Response.json({ error: message }, { status: 500 })
  }
}
