import type { APIRoute } from "astro"

import { getCredentials } from "@/lib/auth"
import { searchMessages } from "@/lib/mail/imap"
import { searchMailSchema } from "@/lib/validations/mail.schema"

export const GET: APIRoute = async ({ url, session }) => {
  const creds = await getCredentials(session)
  if (!creds) return Response.json({ error: "Not authenticated" }, { status: 401 })

  try {
    const params = Object.fromEntries(url.searchParams)
    const parsed = searchMailSchema.safeParse(params)

    if (!parsed.success) {
      return Response.json({ error: parsed.error.message }, { status: 400 })
    }

    const { folder, query, field } = parsed.data
    const messages = await searchMessages(creds, folder, query, field)

    return Response.json({ messages })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search failed"
    return Response.json({ error: message }, { status: 500 })
  }
}
