import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useMail } from "@/hooks/useMail"

interface ComposeDefaults {
  to?: string
  subject?: string
  body?: string
}

interface ComposeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaults?: ComposeDefaults
}

export function ComposeModal({ open, onOpenChange, defaults }: ComposeModalProps) {
  const { sendNewMail } = useMail()
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({ to: "", subject: "", body: "" })

  useEffect(() => {
    if (open) {
      setFormData({
        to: defaults?.to ?? "",
        subject: defaults?.subject ?? "",
        body: defaults?.body ?? "",
      })
    }
  }, [open, defaults])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSending(true)
    setError(null)

    const to = formData.to.split(",").map((s) => s.trim()).filter(Boolean)

    try {
      await sendNewMail(to, formData.subject, formData.body)
      setFormData({ to: "", subject: "", body: "" })
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send")
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) {
        setFormData({ to: "", subject: "", body: "" })
      }
      onOpenChange(newOpen)
    }}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Nuevo mensaje</DialogTitle>
        </DialogHeader>
        {error && (
          <div className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="to">Para</Label>
            <Input
              id="to"
              name="to"
              value={formData.to}
              onChange={(e) => setFormData({ ...formData, to: e.target.value })}
              placeholder="destinatario@ejemplo.com, otro@ejemplo.com"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="subject">Asunto</Label>
            <Input
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Asunto"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="body">Mensaje</Label>
            <Textarea
              id="body"
              name="body"
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              placeholder="Escribe tu mensaje..."
              className="min-h-48"
              required
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={sending}>
              {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
