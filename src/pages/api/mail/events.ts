import type { APIRoute } from "astro"

import { getCredentials } from "@/lib/auth"
import { subscribe } from "@/lib/mail/idle"

export const GET: APIRoute = async ({ request, session }) => {
  const creds = await getCredentials(session)
  if (!creds) return Response.json({ error: "Not authenticated" }, { status: 401 })

  const folder = new URL(request.url).searchParams.get("folder") || "INBOX"

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()

      const send = (event: string, data: string) => {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${data}\n\n`))
        } catch { /* stream closed */ }
      }

      send("connected", JSON.stringify({ folder }))

      let cleanup: (() => void) | null = null

      try {
        cleanup = await subscribe(creds, folder, () => {
          send("newmail", JSON.stringify({ folder, timestamp: Date.now() }))
        })
      } catch {
        send("error", JSON.stringify({ message: "Failed to start IDLE" }))
        controller.close()
        return
      }

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"))
        } catch {
          clearInterval(heartbeat)
        }
      }, 30_000)

      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat)
        if (cleanup) cleanup()
        try { controller.close() } catch { /* already closed */ }
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  })
}
