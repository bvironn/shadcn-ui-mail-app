import { useState } from "react"
import { Loader2, Mail } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeToggle } from "@/components/theme-toggle"

export function LoginForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    try {
      const payload = {
        username: formData.get("username"),
        password: formData.get("password"),
      }
      console.log("[LOGIN-UI] Sending login request:", { username: payload.username, hasPassword: !!payload.password })

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "same-origin",
      })

      console.log("[LOGIN-UI] Response status:", res.status)
      console.log("[LOGIN-UI] Response headers set-cookie:", res.headers.get("set-cookie"))

      const data = await res.json()
      console.log("[LOGIN-UI] Response body:", data)

      if (!res.ok) {
        setError(data.error || "Login failed")
        return
      }

      console.log("[LOGIN-UI] Login OK, redirecting to /")
      window.location.href = "/"
    } catch {
      setError("Error de conexion. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Mail className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">Iniciar sesion</h1>
          <p className="text-sm text-muted-foreground">
            Ingresa tus credenciales de correo
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="username">Usuario</Label>
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="admin"
              autoComplete="username"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password">Contrasena</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Iniciar sesion
          </Button>
        </form>
      </div>
    </div>
  )
}
