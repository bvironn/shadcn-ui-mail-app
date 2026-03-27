import type { APIRoute } from "astro"

import { clearCredentials } from "@/lib/auth"

export const POST: APIRoute = async ({ session }) => {
  await clearCredentials(session)
  return Response.json({ success: true })
}
