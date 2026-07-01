import { getNotifications } from "@/app/actions/notification"
import { NotificationList } from "@/components/notification-list"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Notifications | Meeting App",
  description: "View your notifications",
}

export default async function NotificationsPage() {
  const notifications = await getNotifications()

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto w-full">
      <h1 className="text-2xl font-bold mb-6">Notifications</h1>
      <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6 min-h-[500px]">
        <NotificationList notifications={notifications} />
      </div>
    </div>
  )
}
