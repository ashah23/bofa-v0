"use client"

import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import Link from "next/link"
import { Beer } from "lucide-react"
import { UserNav } from "@/components/user-nav"
import { type User, currentUser, setCurrentUser } from "@/lib/data"
import { useState, useEffect } from "react"

const inter = Inter({ subsets: ["latin"] })

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // In a real app, this would check for an authenticated session
    setUser(currentUser)
  }, [])

  const handleLogin = (userId: string) => {
    const loggedInUser = setCurrentUser(userId)
    setUser(loggedInUser)
  }

  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex items-center justify-between">
              <Link href="/" className="flex items-center space-x-2">
                <Beer className="h-6 w-6 text-amber-600" />
                <span className="text-xl font-bold">Beer Olympics</span>
              </Link>
              <div className="flex items-center space-x-6">
                <Link href="/standings" className="text-sm font-medium hover:underline">
                  Standings
                </Link>
                <Link href="/events" className="text-sm font-medium hover:underline">
                  Events
                </Link>
                <Link href="/teams" className="text-sm font-medium hover:underline">
                  Teams
                </Link>
                <UserNav user={user} onLogin={handleLogin} />
              </div>
            </nav>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  )
}
