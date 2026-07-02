import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { BookingTable } from "./booking-table"

type SearchParams = {
  status?: string
}

export default async function ManageBookingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    redirect("/dashboard")
  }

  const { status } = await searchParams

  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: { name: true, email: true, team: true }
      }
    }
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serializedBookings = bookings.map((b: any) => ({
    ...b,
    startTime: b.startTime.toISOString(),
    endTime: b.endTime.toISOString(),
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  }))

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Manage Bookings</h1>
      <BookingTable initialBookings={serializedBookings} userRole={session.user.role} defaultStatus={status} />
    </div>
  )
}
