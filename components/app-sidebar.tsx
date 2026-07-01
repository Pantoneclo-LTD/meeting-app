"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"

export function AppSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/calendar", label: "Book Meeting" },
    { href: "/dashboard/bookings", label: "My Bookings" },
    { href: "/dashboard/profile", label: "Profile" },
  ]

  if (session?.user?.role === "ADMIN" || session?.user?.role === "SUPERADMIN") {
    links.push({ href: "/dashboard/manage-bookings", label: "Manage Bookings" })
  }

  if (session?.user?.role === "SUPERADMIN") {
    links.push({ href: "/dashboard/users", label: "Manage Users" })
  }

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col h-screen fixed">
      <div className="p-6 font-bold text-xl border-b border-gray-800">
        Meeting App
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`block px-4 py-2 rounded transition-colors ${
              pathname === link.href ? "bg-gray-800" : "hover:bg-gray-800"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
