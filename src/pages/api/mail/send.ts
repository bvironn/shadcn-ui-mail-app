import type { APIRoute } from "astro"

import { getCredentials } from "@/lib/auth"
import { sendMail } from "@/lib/mail/smtp"
import { sendMailSchema } from "@/lib/validations/mail.schema"

export const POST: APIRoute = async ({ request, session }) => {
  const creds = await getCredentials(session)
  if (!creds) return Response.json({ error: "Not authenticated" }, { status: 401 })

  try {
    const body = await request.json()
    const parsed = sendMailSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json({ error: parsed.error.message }, { status: 400 })
    }

    const result = await sendMail(creds, parsed.data)
    return Response.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send message"
    return Response.json({ error: message }, { status: 500 })
  }
}
