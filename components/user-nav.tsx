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
} from "@/components/ui/dropdown-menu"
import type { User, UserRole } from "@/lib/data"
import { LogOut, Settings, UserIcon } from "lucide-react"
import { useState } from "react"

type UserNavProps = {
  user: User | null
  onLogin: (userId: string) => void
}

export function UserNav({ user, onLogin }: UserNavProps) {
  const [open, setOpen] = useState(false)

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
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
            <p className="mt-1 text-xs font-medium text-muted-foreground">{getRoleBadge(user.role)}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <UserIcon className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <p className="text-xs font-medium">Switch User (Demo)</p>
          </DropdownMenuLabel>
          <DropdownMenuItem onClick={() => onLogin("user-1")}>
            <span>John (Player)</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onLogin("user-2")}>
            <span>Sarah (Captain)</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onLogin("user-6")}>
            <span>Alex (Referee)</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
