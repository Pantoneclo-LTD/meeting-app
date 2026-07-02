"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getNotifications() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  return prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    ...({ include: { booking: true } } as Record<string, unknown>)
  }) as unknown as Promise<Array<import("@prisma/client").Notification & { booking?: import("@prisma/client").Booking | null }>>
}

export async function getUnreadNotificationCount() {
  const session = await auth()
  if (!session?.user?.id) return 0

  return prisma.notification.count({
    where: { 
      userId: session.user.id,
      isRead: false
    }
  })
}

export async function markAsRead(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  await prisma.notification.update({
    where: { id, userId: session.user.id },
    data: { isRead: true }
  })
  
  revalidatePath("/dashboard/notifications")
}

export async function markAllAsRead() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  await prisma.notification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true }
  })
  
  revalidatePath("/dashboard/notifications")
}

export async function deleteNotification(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  await prisma.notification.delete({
    where: { id, userId: session.user.id }
  })
  
  revalidatePath("/dashboard/notifications")
}
