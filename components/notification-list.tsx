"use client"

import type { Notification } from "@prisma/client"
import { Check, Trash2 } from "lucide-react"
import { markAsRead, markAllAsRead, deleteNotification } from "@/app/actions/notification"
import { Button } from "@/components/ui/button"
import { useTransition } from "react"
import { toast } from "sonner"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"

dayjs.extend(relativeTime)

export function NotificationList({ notifications }: { notifications: Notification[] }) {
  const [isPending, startTransition] = useTransition()

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <BellIcon className="h-12 w-12 mb-4 text-gray-300" />
        <p>No notifications yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-4">
        <Button
          variant="outline"
          disabled={isPending || !notifications.some(n => !n.isRead)}
          onClick={() => {
            startTransition(async () => {
              await markAllAsRead()
              toast.success("All notifications marked as read")
            })
          }}
        >
          <Check className="mr-2 h-4 w-4" />
          Mark all as read
        </Button>
      </div>

      <div className="space-y-2">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={`p-4 rounded-lg border flex items-start justify-between transition-colors ${notif.isRead ? "bg-white text-gray-600" : "bg-blue-50/50 border-blue-100 text-gray-900"
              }`}
          >
            <div className="flex flex-col gap-1 pr-4">
              <p className="text-sm">{notif.message}</p>
              <p className="text-xs text-gray-400">{dayjs(notif.createdAt).fromNow()}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!notif.isRead && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                  onClick={() => {
                    startTransition(async () => {
                      await markAsRead(notif.id)
                    })
                  }}
                  title="Mark as read"
                >
                  <Check className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                onClick={() => {
                  startTransition(async () => {
                    await deleteNotification(notif.id)
                    toast.success("Notification deleted")
                  })
                }}
                title="Delete notification"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function BellIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  )
}
