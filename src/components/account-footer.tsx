import { LogOut, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ThemeToggle } from "@/components/theme-toggle"

interface AccountFooterProps {
  isCollapsed: boolean
  email: string
  name: string
}

export function AccountFooter({ isCollapsed, email, name }: AccountFooterProps) {
  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center gap-1 p-2">
        <ThemeToggle />
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <a href="/logout">
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <span>
                  <LogOut className="h-4 w-4" />
                  <span className="sr-only">Logout</span>
                </span>
              </Button>
            </a>
          </TooltipTrigger>
          <TooltipContent side="right">Cerrar sesion ({email})</TooltipContent>
        </Tooltip>
      </div>
    )
  }

  return (
    <div className="border-t p-3 space-y-2">
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{name || email.split("@")[0]}</p>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <ThemeToggle />
        <a href="/logout">
          <Button variant="ghost" size="sm" className="h-8 text-xs" asChild>
            <span>
              <LogOut className="mr-1 h-3 w-3" />
              Salir
            </span>
          </Button>
        </a>
      </div>
    </div>
  )
}
