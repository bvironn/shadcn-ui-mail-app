import { defineConfig } from "astro/config"
import { execSync } from "child_process"
import react from "@astrojs/react"
import node from "@astrojs/node"
import tailwindcss from "@tailwindcss/vite"

const commitHash = execSync("git rev-parse --short HEAD").toString().trim()

export default defineConfig({
  output: "server",
  adapter: node({ mode: "standalone" }),
  server: { host: "0.0.0.0", port: 4321 },
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
    define: {
      __COMMIT_HASH__: JSON.stringify(commitHash),
    },
  },
})
