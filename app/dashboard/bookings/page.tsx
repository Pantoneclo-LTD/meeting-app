import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { UserBookingTable } from "./user-booking-table"

type SearchParams = {
  bookingId?: string
  status?: string
}

export default async function UserBookingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const { bookingId, status } = await searchParams

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

  let defaultOpenBooking = null
  if (bookingId) {
    const found = serializedBookings.find(b => b.id === bookingId)
    if (found) {
      defaultOpenBooking = found
    } else {
      const dbBooking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          user: {
            select: { name: true, email: true }
          }
        }
      })
      if (dbBooking && (session.user.role === "SUPERADMIN" || session.user.role === "ADMIN" || dbBooking.userId === session.user.id)) {
        defaultOpenBooking = {
          ...dbBooking,
          startTime: dbBooking.startTime.toISOString(),
          endTime: dbBooking.endTime.toISOString(),
          createdAt: dbBooking.createdAt.toISOString(),
          updatedAt: dbBooking.updatedAt.toISOString(),
        }
      }
    }
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">My Bookings</h1>
      <UserBookingTable 
        initialBookings={serializedBookings} 
        defaultOpenBooking={defaultOpenBooking}
        userRole={session.user.role}
        defaultStatus={status}
      />
    </div>
  )
}
