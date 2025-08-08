"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import type { User, UserRole } from "@/lib/data"
import { LogOut, Settings, UserIcon, Shield } from "lucide-react"
import { useState } from "react"
import { useRefMode } from "@/components/ref-mode-context"

type UserNavProps = {
  user: User | null
  onLogin: (userId: string) => void
}

export function UserNav({ user, onLogin }: UserNavProps) {
  const [open, setOpen] = useState(false)
  const { isRefMode, toggleRefMode } = useRefMode()

  if (!user) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        Sign In
      </Button>
    )
  }

  // Get initials from name
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  // Get role badge text
  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case "referee":
        return "Referee"
      case "captain":
        return "Captain"
      case "player":
        return "Player"
      default:
        return "User"
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuCheckboxItem
            checked={isRefMode}
            onCheckedChange={toggleRefMode}
          >
            <Shield className="mr-2 h-4 w-4" />
            <span>Ref Mode</span>
          </DropdownMenuCheckboxItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
