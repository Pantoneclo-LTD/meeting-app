"use client"

import { BookingDetailsDialog } from "@/components/booking-details-dialog"
import { useRouter } from "next/navigation"

export function BookingDialogWrapper({ 
  booking, 
  userRole, 
  currentUserId,
  baseRedirect
}: { 
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
