"use client"

import { BookingDetailsDialog } from "@/components/ui/booking-dialogues/booking-details-dialog"
import { useRouter } from "next/navigation"

export function BookingDialogWrapper({
  booking,
  userRole,
  currentUserId,
  baseRedirect
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  booking: any
  userRole: string
  currentUserId: string
  baseRedirect: string
}) {
  const router = useRouter()

  return (
    <BookingDetailsDialog
      isOpen={true}
      onClose={() => router.push(baseRedirect)}
      booking={booking}
      userRole={userRole}
      currentUserId={currentUserId}
      onStatusChange={() => {
        router.refresh()
      }}
    />
  )
}
