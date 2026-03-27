import { useState } from "react"
import { formatDistanceToNow } from "date-fns/formatDistanceToNow"
import { es } from "date-fns/locale/es"
import {
  Archive,
  ArchiveX,
  Flag,
  FlagOff,
  Forward,
  Inbox,
  Mail,
  MailOpen,
  Reply,
  ReplyAll,
  Star,
  Trash2,
  FolderInput,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import type { MailEnvelope } from "@/types/mail.types"
import { useMail } from "@/hooks/useMail"

interface MailListProps {
  items: MailEnvelope[]
  onReply?: (uid: number) => void
  onReplyAll?: (uid: number) => void
  onForward?: (uid: number) => void
}

export function MailList({ items, onReply, onReplyAll, onForward }: MailListProps) {
  const {
    state,
    selectMessage,
    deleteMessage,
    toggleRead,
    toggleFlagged,
    moveMessage,
    bulkDelete,
  } = useMail()
  const [selected, setSelected] = useState<Set<number>>(new Set())

  const toggleSelect = (uid: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(uid)) next.delete(uid)
      else next.add(uid)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === items.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(items.map((m) => m.uid)))
    }
  }

  const handleBulkDelete = async () => {
    if (selected.size === 0) return
    try {
      await bulkDelete(Array.from(selected))
      setSelected(new Set())
    } catch (err) {
      console.error("Bulk delete failed:", err)
    }
  }

  const handleMarkRead = async (uid: number, currentSeen: boolean) => {
    try {
      await toggleRead(uid, !currentSeen)
    } catch (err) {
      console.error("Failed to toggle read:", err)
    }
  }

  const handleToggleFlagged = async (uid: number, currentFlagged: boolean) => {
    try {
      await toggleFlagged(uid, !currentFlagged)
    } catch (err) {
      console.error("Failed to toggle flagged:", err)
    }
  }

  const handleMove = async (uid: number, destination: string) => {
    try {
      await moveMessage(uid, destination)
    } catch (err) {
      console.error("Failed to move message:", err)
    }
  }

  const handleDelete = async (uid: number) => {
    try {
      await deleteMessage(uid)
    } catch (err) {
      console.error("Failed to delete:", err)
    }
  }

  const handleReply = (uid: number) => {
    selectMessage(uid)
    onReply?.(uid)
  }

  const handleReplyAll = (uid: number) => {
    selectMessage(uid)
    onReplyAll?.(uid)
  }

  const handleForward = (uid: number) => {
    selectMessage(uid)
    onForward?.(uid)
  }

  const specialFolders = state.folders.reduce<Record<string, string>>((acc, f) => {
    if (f.specialUse) acc[f.specialUse] = f.path
    return acc
  }, {})

  const moveDestinations = [
    { key: "\\Inbox", label: "Bandeja de entrada", icon: Inbox },
    { key: "\\Archive", label: "Archivo", icon: Archive },
    { key: "\\Junk", label: "Spam", icon: ArchiveX },
    { key: "\\Trash", label: "Papelera", icon: Trash2 },
  ].filter((d) => {
    const folderPath = specialFolders[d.key]
    return folderPath && folderPath !== state.currentFolder
  })

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 border-b px-4 py-2 bg-muted/50">
          <Checkbox
            checked={selected.size === items.length}
            onCheckedChange={toggleAll}
          />
          <span className="text-xs text-muted-foreground">
            {selected.size} {selected.size === 1 ? "seleccionado" : "seleccionados"}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto gap-1.5 text-destructive hover:text-destructive h-7 text-xs"
            onClick={handleBulkDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Eliminar
          </Button>
        </div>
      )}
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-2 p-4 pt-2">
          {items.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Sin mensajes
            </div>
          )}
          {items.map((item) => (
            <ContextMenu key={item.uid}>
              <ContextMenuTrigger asChild>
                <div
                  className={cn(
                    "flex items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent w-full min-w-0",
                    state.selectedUid === item.uid && "bg-muted"
                  )}
                >
                  <Checkbox
                    className="mt-1 shrink-0"
                    checked={selected.has(item.uid)}
                    onCheckedChange={() => toggleSelect(item.uid)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button
                    className="flex items-start gap-3 min-w-0 flex-1 text-left"
                    onClick={() => selectMessage(item.uid)}
                  >
                    <Avatar className="h-9 w-9 shrink-0 mt-0.5">
                      <AvatarFallback
                        className="text-xs text-white"
                        style={{ backgroundColor: getAvatarColor(item.from.name || item.from.address) }}
                      >
                        {(item.from.name || item.from.address)
                          .split(" ")
                          .map((c) => c[0])
                          .join("")
                          .substring(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                      <div className="flex items-center min-w-0">
                        <span className={cn("truncate", !item.seen ? "font-bold" : "font-semibold")}>
                          {item.from.name || item.from.address}
                        </span>
                        {item.flagged && (
                          <Star className="ml-1 h-3 w-3 shrink-0 fill-yellow-400 text-yellow-400" />
                        )}
                        <span className="ml-auto shrink-0 pl-2 text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(item.date), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </span>
                      </div>
                      <div className={cn("truncate text-xs", !item.seen ? "font-semibold" : "font-medium")}>
                        {item.subject}
                      </div>
                      {item.preview && (
                        <div className="line-clamp-2 text-xs text-muted-foreground">
                          {item.preview.substring(0, 200)}
                        </div>
                      )}
                    </div>
                    {!item.seen && (
                      <span className="mt-2 flex h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                    )}
                  </button>
                </div>
              </ContextMenuTrigger>
            <ContextMenuContent className="w-56">
              <ContextMenuItem onClick={() => handleReply(item.uid)}>
                <Reply className="mr-2 h-4 w-4" />
                Responder
              </ContextMenuItem>
              <ContextMenuItem onClick={() => handleReplyAll(item.uid)}>
                <ReplyAll className="mr-2 h-4 w-4" />
                Responder a todos
              </ContextMenuItem>
              <ContextMenuItem onClick={() => handleForward(item.uid)}>
                <Forward className="mr-2 h-4 w-4" />
                Reenviar
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem onClick={() => handleToggleFlagged(item.uid, item.flagged)}>
                {item.flagged ? (
                  <>
                    <FlagOff className="mr-2 h-4 w-4" />
                    Quitar indicador
                  </>
                ) : (
                  <>
                    <Flag className="mr-2 h-4 w-4" />
                    Añadir indicador
                  </>
                )}
              </ContextMenuItem>
              <ContextMenuItem onClick={() => handleMarkRead(item.uid, item.seen)}>
                {item.seen ? (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Marcar como no leido
                  </>
                ) : (
                  <>
                    <MailOpen className="mr-2 h-4 w-4" />
                    Marcar como leido
                  </>
                )}
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuSub>
                <ContextMenuSubTrigger>
                  <FolderInput className="mr-2 h-4 w-4" />
                  Trasladar mensaje...
                </ContextMenuSubTrigger>
                <ContextMenuSubContent className="w-48">
                  {moveDestinations.map((dest) => (
                    <ContextMenuItem
                      key={dest.key}
                      onClick={() => handleMove(item.uid, specialFolders[dest.key]!)}
                    >
                      <dest.icon className="mr-2 h-4 w-4" />
                      {dest.label}
                    </ContextMenuItem>
                  ))}
                </ContextMenuSubContent>
              </ContextMenuSub>
              <ContextMenuItem onClick={() => handleMove(item.uid, specialFolders["\\Archive"] || "Archive")}>
                <Archive className="mr-2 h-4 w-4" />
                Archivar mensaje
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => handleDelete(item.uid)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Borrar mensaje
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        ))}
        </div>
      </ScrollArea>
    </div>
  )
}

const AVATAR_COLORS = [
  "#e74c3c", "#e67e22", "#f1c40f", "#2ecc71", "#1abc9c",
  "#3498db", "#9b59b6", "#e84393", "#6c5ce7", "#00b894",
  "#fd79a8", "#0984e3", "#d63031", "#e17055", "#636e72",
]

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}
