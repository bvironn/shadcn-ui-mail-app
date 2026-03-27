import type { APIRoute } from "astro"

import { getCredentials } from "@/lib/auth"
import { deleteMessages } from "@/lib/mail/imap"

export const POST: APIRoute = async ({ request, session }) => {
  const creds = await getCredentials(session)
  if (!creds) return Response.json({ error: "Not authenticated" }, { status: 401 })

  try {
    const body = await request.json()
    const { folder, uids } = body

    if (!folder || !Array.isArray(uids) || uids.length === 0) {
      return Response.json({ error: "folder and uids[] are required" }, { status: 400 })
    }

    if (uids.some((u: unknown) => typeof u !== "number")) {
      return Response.json({ error: "uids must be numbers" }, { status: 400 })
    }

    await deleteMessages(creds, folder, uids)

    return Response.json({ success: true, deleted: uids.length })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete messages"
    return Response.json({ error: message }, { status: 500 })
  }
}
