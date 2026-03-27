import { useRef, useEffect, useState } from "react"
import { format } from "date-fns/format"
import {
  Archive,
  ArchiveX,
  Forward,
  Inbox,
  Loader2,
  Mail,
  MailOpen,
  Reply,
  ReplyAll,
  Star,
  StarOff,
  Trash2,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useMail } from "@/hooks/useMail"

interface MailDisplayProps {
  onReply?: (defaults: { to?: string; subject?: string; body?: string }) => void
}

export function MailDisplay({ onReply }: MailDisplayProps) {
  const { state, deleteMessage, toggleRead, toggleFlagged, moveMessage } = useMail()
  const mail = state.selectedMessage

  const handleDelete = async () => {
    if (!mail) return
    try { await deleteMessage(mail.uid) } catch {}
  }

  const handleToggleRead = async () => {
    if (!mail) return
    try { await toggleRead(mail.uid, !mail.seen) } catch {}
  }

  const handleToggleFlagged = async () => {
    if (!mail) return
    try { await toggleFlagged(mail.uid, !mail.flagged) } catch {}
  }

  const handleMove = async (destination: string) => {
    if (!mail) return
    try { await moveMessage(mail.uid, destination) } catch {}
  }

  const handleReply = () => {
    if (!mail) return
    onReply?.({
      to: mail.from.address,
      subject: mail.subject.startsWith("Re:") ? mail.subject : `Re: ${mail.subject}`,
      body: `\n\n--- ${mail.from.name || mail.from.address} escribio ---\n${mail.text}`,
    })
  }

  const handleReplyAll = () => {
    if (!mail) return
    const allTo = [mail.from.address, ...mail.to.map((t) => t.address), ...mail.cc.map((c) => c.address)]
      .filter((v, i, a) => a.indexOf(v) === i)
      .join(", ")
    onReply?.({
      to: allTo,
      subject: mail.subject.startsWith("Re:") ? mail.subject : `Re: ${mail.subject}`,
      body: `\n\n--- ${mail.from.name || mail.from.address} escribio ---\n${mail.text}`,
    })
  }

  const handleForward = () => {
    if (!mail) return
    onReply?.({
      subject: mail.subject.startsWith("Fwd:") ? mail.subject : `Fwd: ${mail.subject}`,
      body: `\n\n---------- Mensaje reenviado ----------\nDe: ${mail.from.name || mail.from.address}\nFecha: ${format(new Date(mail.date), "PPpp")}\nAsunto: ${mail.subject}\n\n${mail.text}`,
    })
  }

  const hasSelection = state.selectedUid !== null

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center p-2">
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!hasSelection} onClick={handleToggleRead}>
                {mail?.seen ? <Mail className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />}
                <span className="sr-only">{mail?.seen ? "Marcar como no leido" : "Marcar como leido"}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{mail?.seen ? "Marcar como no leido" : "Marcar como leido"}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!hasSelection} onClick={handleToggleFlagged}>
                {mail?.flagged ? <StarOff className="h-4 w-4" /> : <Star className="h-4 w-4" />}
                <span className="sr-only">{mail?.flagged ? "Quitar estrella" : "Destacar"}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{mail?.flagged ? "Quitar estrella" : "Destacar"}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!hasSelection} onClick={() => handleMove("Archive")}>
                <Archive className="h-4 w-4" />
                <span className="sr-only">Archivar</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Archivar</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!hasSelection} onClick={() => handleMove("Junk")}>
                <ArchiveX className="h-4 w-4" />
                <span className="sr-only">Mover a spam</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Mover a spam</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!hasSelection} onClick={handleDelete}>
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Eliminar</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Eliminar</TooltipContent>
          </Tooltip>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!hasSelection} onClick={handleReply}>
                <Reply className="h-4 w-4" />
                <span className="sr-only">Responder</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Responder</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!hasSelection} onClick={handleReplyAll}>
                <ReplyAll className="h-4 w-4" />
                <span className="sr-only">Responder a todos</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Responder a todos</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!hasSelection} onClick={handleForward}>
                <Forward className="h-4 w-4" />
                <span className="sr-only">Reenviar</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reenviar</TooltipContent>
          </Tooltip>
        </div>
      </div>
      {state.selectedUid && !mail ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : mail ? (
        <div className="flex flex-1 flex-col min-h-0">
          <div className="flex items-center gap-3 px-4 py-2">
            <Avatar className="h-8 w-8">
              <AvatarImage alt={mail.from.name} />
              <AvatarFallback className="text-xs">
                {(mail.from.name || mail.from.address)
                  .split(" ")
                  .map((chunk) => chunk[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-2 min-w-0 text-sm">
              <span className="font-semibold truncate">{mail.from.name || mail.from.address}</span>
              <span className="text-xs text-muted-foreground truncate">&lt;{mail.from.address}&gt;</span>
              {mail.to.length > 0 && (
                <span className="text-xs text-muted-foreground truncate">
                  &rarr; {mail.to.map((t) => t.address).join(", ")}
                </span>
              )}
            </div>
            <span className="ml-auto shrink-0 text-xs text-muted-foreground">
              {format(new Date(mail.date), "PPpp")}
            </span>
          </div>
          <Separator />
          {mail.html ? (
            <div className="flex-1 min-h-0 overflow-auto">
              <MailIframe html={mail.html} />
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-auto p-4 text-sm whitespace-pre-wrap">
              {mail.text}
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 text-center text-muted-foreground">
          Selecciona un mensaje
        </div>
      )}
    </div>
  )
}

function MailIframe({ html }: { html: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isDark, setIsDark] = useState(
    () => document.documentElement.classList.contains("dark")
  )

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"))
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const doc = iframe.contentDocument
    if (!doc) return

    doc.open()
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            html {
              color-scheme: ${isDark ? "dark" : "light"};
            }
            body {
              margin: 0;
              font-family: ui-sans-serif, system-ui, sans-serif;
              font-size: 14px;
              line-height: 1.6;
              color: ${isDark ? "#e5e5e5" : "#1a1a1a"};
              background: ${isDark ? "#171717" : "white"};
              word-break: break-word;
            }
            body.dark-filter {
              filter: invert(0.88) hue-rotate(180deg);
            }
            body.dark-filter img,
            body.dark-filter video,
            body.dark-filter svg,
            body.dark-filter [background],
            body.dark-filter [style*="background"] {
              filter: invert(1) hue-rotate(180deg);
            }
            img { max-width: 100%; height: auto; }
            a { color: ${isDark ? "#60a5fa" : "#2563eb"}; }
            pre { overflow-x: auto; }
            table { max-width: 100%; }
          </style>
        </head>
        <body class="${isDark ? "dark-filter" : ""}">${html}</body>
      </html>
    `)
    doc.close()

    const resize = () => {
      if (iframe.contentDocument?.body) {
        iframe.style.height = iframe.contentDocument.body.scrollHeight + "px"
      }
    }

    iframe.addEventListener("load", resize)
    resize()

    return () => iframe.removeEventListener("load", resize)
  }, [html, isDark])

  return (
    <iframe
      ref={iframeRef}
      className="w-full border-0"
      sandbox="allow-same-origin"
      title="Contenido del correo"
      style={{ minHeight: 200 }}
    />
  )
}
