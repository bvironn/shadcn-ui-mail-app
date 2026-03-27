import { defineMiddleware } from "astro:middleware"

import { getCredentials } from "@/lib/auth"

const PUBLIC_PATHS = ["/login", "/logout", "/api/auth/login"]

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url

  console.log(`[MW] ${context.request.method} ${pathname}`)

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    console.log("[MW] Public path, skipping auth")
    return next()
  }

  if (pathname.startsWith("/api/") || pathname === "/") {
    console.log("[MW] Protected path, checking session...")
    const creds = await getCredentials(context.session)
    console.log("[MW] Session creds found:", !!creds)

    if (!creds) {
      if (pathname.startsWith("/api/")) {
        console.log("[MW] API 401 - not authenticated")
        return Response.json({ error: "Not authenticated" }, { status: 401 })
      }
      console.log("[MW] Redirecting to /login")
      return context.redirect("/login")
    }
    console.log("[MW] Auth OK for", creds.email)
  }

  return next()
})
