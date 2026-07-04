import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { BookingDialogWrapper } from "./booking-dialog-wrapper"

type RouteParams = {
  id: string
}

export default async function BookingDetailPage({ params }: { params: Promise<RouteParams> }) {
  const { id } = await params
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      user: {
        select: { name: true, email: true }
      }
    }
  })

  if (!booking) {
    notFound()
  }

  const isAuthorized =
    session.user.role === "SUPERADMIN" ||
    session.user.role === "ADMIN" ||
    booking.userId === session.user.id

  if (!isAuthorized) {
    redirect("/booking/bookings")
  }

  const baseRedirect = session.user.role === "USER" ? "/booking/bookings" : "/booking/manage-bookings"

  // Serialize booking to pass to client component safely
  const serializedBooking = {
    ...booking,
    startTime: booking.startTime.toISOString(),
    endTime: booking.endTime.toISOString(),
    createdAt: booking.createdAt.toISOString(),
    updatedAt: booking.updatedAt.toISOString(),
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <BookingDialogWrapper 
        booking={serializedBooking} 
        userRole={session.user.role} 
        currentUserId={session.user.id} 
        baseRedirect={baseRedirect}
      />
    </div>
  )
}
