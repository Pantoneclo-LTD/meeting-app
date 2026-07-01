"use client"

import { signOut, useSession } from "next-auth/react"

export function Header() {
  const { data: session } = useSession()

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-8 w-full sticky top-0 z-10">
      <div>
        {/* Breadcrumbs or page title could go here */}
      </div>
      <div className="flex items-center space-x-4">
        {session?.user && (
          <div className="text-sm font-medium">
            {session.user.name} <span className="text-gray-500">({session.user.role})</span>
          </div>
        )}
        <button 
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded transition"
        >
          Logout
        </button>
      </div>
    </header>
  )
}
