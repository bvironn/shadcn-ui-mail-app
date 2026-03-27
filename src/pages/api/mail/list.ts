import type { APIRoute } from "astro"

import { getCredentials } from "@/lib/auth"
import { listMessages } from "@/lib/mail/imap"
import { listMailSchema } from "@/lib/validations/mail.schema"

export const GET: APIRoute = async ({ url, session }) => {
  const creds = await getCredentials(session)
  if (!creds) return Response.json({ error: "Not authenticated" }, { status: 401 })

  try {
    const params = Object.fromEntries(url.searchParams)
    const parsed = listMailSchema.safeParse(params)

    if (!parsed.success) {
      return Response.json({ error: parsed.error.message }, { status: 400 })
    }

    const { folder, page, limit } = parsed.data
    const result = await listMessages(creds, folder, page, limit)

    return Response.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list messages"
    return Response.json({ error: message }, { status: 500 })
  }
}
