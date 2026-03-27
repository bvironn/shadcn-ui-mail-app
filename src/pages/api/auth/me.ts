import type { APIRoute } from "astro"

import { getCredentials } from "@/lib/auth"

export const GET: APIRoute = async ({ session }) => {
  const creds = await getCredentials(session)

  if (!creds) {
    return Response.json({ authenticated: false }, { status: 401 })
  }

  return Response.json({
    authenticated: true,
    email: creds.email,
    name: creds.name,
  })
}
