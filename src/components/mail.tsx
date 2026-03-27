import { useState, useRef } from "react"
import {
  Archive,
  ArchiveX,
  CircleUser,
  File,
  Inbox,
  Loader2,
  Mail,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  RefreshCw,
  Search,
  Send,
  Trash2,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { MailDisplay } from "@/components/mail-display"
import { MailList } from "@/components/mail-list"
import { Nav } from "@/components/nav"
import { AccountFooter } from "@/components/account-footer"
import { ComposeModal } from "@/components/compose-modal"
import { MailProvider } from "@/components/mail-provider"
import { useMail } from "@/hooks/useMail"

function MailContent() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [composeOpen, setComposeOpen] = useState(false)
  const [composeDefaults, setComposeDefaults] = useState<{
    to?: string
    subject?: string
    body?: string
  }>({})
  const { state, changeFolder, refreshMessages, searchMessages, clearSearch } = useMail()
  const [searchInput, setSearchInput] = useState("")
  const [searchFocused, setSearchFocused] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  const openCompose = (defaults: { to?: string; subject?: string; body?: string }) => {
    setComposeDefaults(defaults)
    setComposeOpen(true)
  }

  const handleReply = (uid: number) => {
    const msg = state.messages.find((m) => m.uid === uid)
    if (!msg) return
    openCompose({
      to: msg.from.address,
      subject: msg.subject.startsWith("Re:") ? msg.subject : `Re: ${msg.subject}`,
    })
  }
  const handleReplyAll = (uid: number) => {
    const msg = state.messages.find((m) => m.uid === uid)
    if (!msg) return
    const allTo = [msg.from.address, ...msg.to.map((t) => t.address)]
      .filter((v, i, a) => a.indexOf(v) === i)
      .join(", ")
    openCompose({
      to: allTo,
      subject: msg.subject.startsWith("Re:") ? msg.subject : `Re: ${msg.subject}`,
    })
  }
  const handleForward = (uid: number) => {
    const msg = state.messages.find((m) => m.uid === uid)
    if (!msg) return
    openCompose({
      subject: msg.subject.startsWith("Fwd:") ? msg.subject : `Fwd: ${msg.subject}`,
      body: `\n\n---------- Mensaje reenviado ----------\nDe: ${msg.from.name || msg.from.address}\nFecha: ${msg.date}\nAsunto: ${msg.subject}\n`,
    })
  }

  const FOLDER_ORDER = ["\\Inbox", "\\Drafts", "\\Sent", "\\Junk", "\\Trash", "\\Archive"] as const
  const iconMap: Record<string, typeof Inbox> = {
    "\\Inbox": Inbox,
    "\\Drafts": File,
    "\\Sent": Send,
    "\\Junk": ArchiveX,
    "\\Trash": Trash2,
    "\\Archive": Archive,
  }
  const nameMap: Record<string, string> = {
    "\\Inbox": "Bandeja de entrada",
    "\\Drafts": "Borradores",
    "\\Sent": "Enviados",
    "\\Junk": "Spam",
    "\\Trash": "Papelera",
    "\\Archive": "Archivado",
  }

  const folderNav = FOLDER_ORDER
    .map((key) => state.folders.find((f) => f.specialUse === key || (key === "\\Inbox" && f.path === "INBOX")))
    .filter(Boolean)
    .map((f) => ({
      title: (f!.specialUse && nameMap[f!.specialUse!]) || f!.name,
      label: f!.unseenCount > 0 ? String(f!.unseenCount) : "",
      icon: (f!.specialUse && iconMap[f!.specialUse!]) || Inbox,
      variant: (f!.path === state.currentFolder ? "default" : "ghost") as "default" | "ghost",
      path: f!.path,
    }))

  const defaultLinks = [
    { title: "Bandeja de entrada", label: "", icon: Inbox, variant: "default" as const },
    { title: "Borradores", label: "", icon: File, variant: "ghost" as const },
    { title: "Enviados", label: "", icon: Send, variant: "ghost" as const },
    { title: "Spam", label: "", icon: ArchiveX, variant: "ghost" as const },
    { title: "Papelera", label: "", icon: Trash2, variant: "ghost" as const },
    { title: "Archivado", label: "", icon: Archive, variant: "ghost" as const },
  ]

  const currentFolderName = state.currentFolder === "INBOX"
    ? "Bandeja de entrada"
    : folderNav.find((f) => f.path === state.currentFolder)?.title || state.currentFolder

  const totalMessages = state.total

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-full">
        {/* Sidebar - iCloud style */}
        <aside
          className={cn(
            "flex flex-col border-r transition-all duration-300 ease-in-out",
            isCollapsed ? "w-14" : "w-52"
          )}
        >
          {/* Top bar: toggle | Mail | refresh */}
          <div
            className={cn(
              "flex items-center px-2 py-2 border-b",
              isCollapsed ? "justify-center" : "justify-between"
            )}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                >
                  {isCollapsed ? (
                    <PanelLeftOpen className="h-4 w-4" />
                  ) : (
                    <PanelLeftClose className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {isCollapsed ? "Expandir" : "Colapsar"}
              </TooltipContent>
            </Tooltip>
            {!isCollapsed && (
              <>
                <span className="text-sm font-semibold">Mail</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={refreshMessages}
                      disabled={state.loading}
                    >
                      <RefreshCw className={cn("h-4 w-4", state.loading && "animate-spin")} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Actualizar</TooltipContent>
                </Tooltip>
              </>
            )}
          </div>

          {/* Compose button */}
          {!isCollapsed ? (
            <div className="px-3 py-3">
              <Button
                size="sm"
                className="w-full gap-2 font-medium shadow-sm"
                onClick={() => setComposeOpen(true)}
              >
                <Pencil className="h-4 w-4" />
                Redactar
              </Button>
            </div>
          ) : (
            <div className="flex justify-center py-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setComposeOpen(true)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Redactar</TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Buzones section */}
          <div className="flex-1 overflow-auto">
            {!isCollapsed && (
              <div className="px-3 pt-3 pb-1">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Buzones
                </span>
              </div>
            )}
            <Nav
              isCollapsed={isCollapsed}
              links={folderNav.length > 0 ? folderNav : defaultLinks}
              onLinkClick={(path) => changeFolder(path)}
            />
          </div>

          {/* Account footer */}
          {state.user && (
            <AccountFooter
              isCollapsed={isCollapsed}
              email={state.user.email}
              name={state.user.name}
            />
          )}
        </aside>

        {/* Mail list panel - iCloud style */}
        <div className="flex w-96 flex-col border-r">
          <Tabs defaultValue="all" className="flex h-full flex-col">
            {/* Folder header + count */}
            <div className="px-4 pt-3 pb-1 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-bold leading-tight">{currentFolderName}</h1>
                  <span className="text-xs text-muted-foreground">
                    {totalMessages} {totalMessages === 1 ? "mensaje" : "mensajes"}
                  </span>
                </div>
                <TabsList>
                  <TabsTrigger value="all" className="text-zinc-600 dark:text-zinc-200">
                    Todos
                  </TabsTrigger>
                  <TabsTrigger value="unread" className="text-zinc-600 dark:text-zinc-200">
                    No leidos
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>
            {/* Search */}
            <div className="relative p-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={searchRef}
                  placeholder="Buscar"
                  className="pl-8 pr-8 h-9"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchInput.trim()) {
                      searchMessages(searchInput.trim(), "subject")
                      setSearchFocused(false)
                    }
                    if (e.key === "Escape") {
                      setSearchInput("")
                      clearSearch()
                      searchRef.current?.blur()
                    }
                  }}
                />
                {(searchInput || state.searchResults) && (
                  <button
                    className="absolute right-2 top-2 p-0.5 rounded-sm hover:bg-muted"
                    onClick={() => {
                      setSearchInput("")
                      clearSearch()
                      searchRef.current?.focus()
                    }}
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                )}
              </div>

              {/* Suggestions dropdown */}
              {searchFocused && searchInput.trim() && !state.searchResults && (
                <div className="absolute left-3 right-3 top-full z-10 mt-1 rounded-md border bg-popover p-2 shadow-md">
                  <p className="px-2 pb-1.5 text-xs font-semibold text-muted-foreground">
                    Sugerencias
                  </p>
                  <button
                    className="flex w-full items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      searchMessages(searchInput.trim(), "from")
                      setSearchFocused(false)
                    }}
                  >
                    <CircleUser className="h-4 w-4 text-primary" />
                    <span>
                      El remitente incluye: <strong>{searchInput.trim()}</strong>
                    </span>
                  </button>
                  <button
                    className="flex w-full items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      searchMessages(searchInput.trim(), "subject")
                      setSearchFocused(false)
                    }}
                  >
                    <Mail className="h-4 w-4 text-primary" />
                    <span>
                      El asunto incluye: <strong>{searchInput.trim()}</strong>
                    </span>
                  </button>
                </div>
              )}
            </div>

            {state.searching ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : state.loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : state.error ? (
              <div className="p-4 text-center text-sm text-destructive">
                {state.error}
              </div>
            ) : state.searchResults ? (
              <div className="flex-1 overflow-hidden">
                <div className="px-4 py-2 text-xs text-muted-foreground border-b">
                  {state.searchResults.length} {state.searchResults.length === 1 ? "resultado" : "resultados"}
                  {" — "}
                  {state.searchField === "from" ? "remitente" : state.searchField === "subject" ? "asunto" : "mensaje"}
                  {': "'}
                  {state.searchQuery}
                  {'"'}
                </div>
                <MailList
                  items={state.searchResults}
                  onReply={handleReply}
                  onReplyAll={handleReplyAll}
                  onForward={handleForward}
                />
              </div>
            ) : (
              <>
                <TabsContent value="all" className="m-0 flex-1 overflow-hidden">
                  <MailList
                    items={state.messages}
                    onReply={handleReply}
                    onReplyAll={handleReplyAll}
                    onForward={handleForward}
                  />
                </TabsContent>
                <TabsContent value="unread" className="m-0 flex-1 overflow-hidden">
                  <MailList
                    items={state.messages.filter((m) => !m.seen)}
                    onReply={handleReply}
                    onReplyAll={handleReplyAll}
                    onForward={handleForward}
                  />
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>

        {/* Mail display panel */}
        <div className="flex flex-1 flex-col">
          <MailDisplay onReply={(defaults) => {
            setComposeDefaults(defaults)
            setComposeOpen(true)
          }} />
        </div>
      </div>

      <ComposeModal
        open={composeOpen}
        onOpenChange={(open) => {
          setComposeOpen(open)
          if (!open) setComposeDefaults({})
        }}
        defaults={composeDefaults}
      />
    </TooltipProvider>
  )
}

export function MailApp() {
  return (
    <MailProvider>
      <MailContent />
    </MailProvider>
  )
}
