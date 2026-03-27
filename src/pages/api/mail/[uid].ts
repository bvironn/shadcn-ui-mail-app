import type { APIRoute } from "astro"

import { getCredentials } from "@/lib/auth"
import { getMessage, toggleSeen, toggleFlagged, moveMessage, deleteMessage } from "@/lib/mail/imap"

export const GET: APIRoute = async ({ params, url, session }) => {
  const creds = await getCredentials(session)
  if (!creds) return Response.json({ error: "Not authenticated" }, { status: 401 })

  try {
    const uid = Number(params.uid)
    if (isNaN(uid)) return Response.json({ error: "Invalid UID" }, { status: 400 })

    const folder = url.searchParams.get("folder") || "INBOX"
    const message = await getMessage(creds, folder, uid)

    if (!message) return Response.json({ error: "Message not found" }, { status: 404 })

    return Response.json({ message })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch message"
    return Response.json({ error: message }, { status: 500 })
  }
}

export const PATCH: APIRoute = async ({ params, request, url, session }) => {
  const creds = await getCredentials(session)
  if (!creds) return Response.json({ error: "Not authenticated" }, { status: 401 })

  try {
    const uid = Number(params.uid)
    if (isNaN(uid)) return Response.json({ error: "Invalid UID" }, { status: 400 })

    const folder = url.searchParams.get("folder") || "INBOX"
    const body = await request.json()

    if (typeof body.seen === "boolean") {
      await toggleSeen(creds, folder, uid, body.seen)
    }

    if (typeof body.flagged === "boolean") {
      await toggleFlagged(creds, folder, uid, body.flagged)
    }

    if (typeof body.moveTo === "string") {
      await moveMessage(creds, folder, uid, body.moveTo)
    }

    return Response.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update message"
    return Response.json({ error: message }, { status: 500 })
  }
}

export const DELETE: APIRoute = async ({ params, url, session }) => {
  const creds = await getCredentials(session)
  if (!creds) return Response.json({ error: "Not authenticated" }, { status: 401 })

  try {
    const uid = Number(params.uid)
    if (isNaN(uid)) return Response.json({ error: "Invalid UID" }, { status: 400 })

    const folder = url.searchParams.get("folder") || "INBOX"
    await deleteMessage(creds, folder, uid)

    return Response.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete message"
    return Response.json({ error: message }, { status: 500 })
  }
}
