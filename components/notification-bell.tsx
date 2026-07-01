"use client"

import { Bell } from "lucide-react"
import Link from "next/link"
import { getUnreadNotificationCount } from "@/app/actions/notification"
import { useQuery } from "@tanstack/react-query"

export function NotificationBell() {
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["unreadNotificationCount"],
    queryFn: () => getUnreadNotificationCount(),
    refetchInterval: 30000,
  })

  return (
    <Link href="/dashboard/notifications" className="relative p-2 hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center">
      <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
      {unreadCount > 0 && (
        <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 ring-2 ring-white dark:ring-gray-900"></span>
        </span>
      )}
    </Link>
  )
}
