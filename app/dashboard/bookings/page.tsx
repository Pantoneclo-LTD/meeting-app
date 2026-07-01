import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { UserBookingTable } from "./user-booking-table"

export default async function UserBookingsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const bookings = await prisma.booking.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: { name: true, email: true }
      }
    }
  })

  // Serialize dates to pass to client component safely
  const serializedBookings = bookings.map(b => ({
    ...b,
    startTime: b.startTime.toISOString(),
    endTime: b.endTime.toISOString(),
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  }))

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">My Bookings</h1>
      <UserBookingTable initialBookings={serializedBookings} />
    </div>
  )
}
