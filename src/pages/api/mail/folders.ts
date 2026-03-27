import type { APIRoute } from "astro"

import { getCredentials } from "@/lib/auth"
import { listFolders } from "@/lib/mail/imap"

export const GET: APIRoute = async ({ session }) => {
  const creds = await getCredentials(session)
  if (!creds) return Response.json({ error: "Not authenticated" }, { status: 401 })

  try {
    const folders = await listFolders(creds)
    return Response.json({ folders })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list folders"
    return Response.json({ error: message }, { status: 500 })
  }
}
