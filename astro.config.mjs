import { defineConfig } from "astro/config"
import react from "@astrojs/react"
import node from "@astrojs/node"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  output: "server",
  adapter: node({ mode: "standalone" }),
  integrations: [react()],
  session: {
    cookie: {
      name: "mail_session",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
      secure: false,
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
})
