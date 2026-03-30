import type { APIRoute } from "astro"

declare const __COMMIT_HASH__: string

export const GET: APIRoute = () => {
  return new Response(JSON.stringify({ commit: __COMMIT_HASH__ }), {
    headers: { "Content-Type": "application/json" },
  })
}
