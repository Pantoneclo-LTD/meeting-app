"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import { updateBookingStatus } from "@/app/actions/booking"
import { toast } from "sonner"
import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

dayjs.extend(utc)
dayjs.extend(timezone)

export function BookingDetailsDialog({
  isOpen,
  onClose,
  booking,
  userRole = "USER",
  currentUserId,
  onStatusChange,
}: {
  isOpen: boolean
  onClose: () => void
  booking: any
  userRole?: string
  currentUserId?: string
  onStatusChange?: (newStatus: string) => void
}) {
  const [localStatus, setLocalStatus] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState<{
    status: "APPROVED" | "REJECTED" | "CANCELLED" | null,
    open: boolean
  }>({
    status: null,
    open: false,
  })

  // Map fields flexibly to support both Prisma Booking rows and FullCalendar Event objects
  const id = booking?.id
  const purpose = booking?.purpose || booking?.extendedProps?.purpose || booking?.title || ""
  const startTime = booking?.startTime || booking?.start
  const endTime = booking?.endTime || booking?.end
  const status = localStatus || booking?.status || booking?.extendedProps?.status || "PENDING"
  const userName = booking?.user?.name || booking?.extendedProps?.owner || booking?.extendedProps?.userName || booking?.userName || "Unknown"
  const userEmail = booking?.user?.email || booking?.extendedProps?.userEmail || booking?.userEmail || ""

  const isAdmin = userRole === "ADMIN" || userRole === "SUPERADMIN"
  const isCreator = currentUserId && (booking?.userId === currentUserId || booking?.extendedProps?.userId === currentUserId)

  const options: string[] = []
  if (isAdmin) {
    options.push("APPROVED", "REJECTED")
  }
  if (isCreator) {
    options.push("CANCELLED")
  }

  const currentStatusClean = booking?.status || booking?.extendedProps?.status || "PENDING"
  const availableOptions = options.filter(opt => opt !== currentStatusClean)

  const confirmStatusChange = async () => {
    if (!id || !confirmOpen.status) return
    const originalStatus = booking.status || booking.extendedProps?.status || "PENDING"
    setLoading(true)
    try {
      await updateBookingStatus(id, confirmOpen.status)
      setLocalStatus(confirmOpen.status)
      toast.success(`Booking status updated to ${confirmOpen.status}`)
      if (onStatusChange) {
        onStatusChange(confirmOpen.status)
      }
      onClose?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to update booking status")
      setLocalStatus(originalStatus)
    } finally {
      setLoading(false)
      setConfirmOpen({ status: null, open: false })
    }
  }

  const cancelStatusChange = () => {
    const originalStatus = booking.status || booking.extendedProps?.status || "PENDING"
    setLocalStatus(originalStatus)
    setConfirmOpen({ status: null, open: false })
  }


  const onOpenChangeHandler = (newOpen: boolean) => {
    if (!newOpen) {
      onClose()
    } else {
      if (booking) {
        setLocalStatus(booking.status || booking.extendedProps?.status || "PENDING")
      }
    }
  }

  if (!booking) return null

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChangeHandler}>
        <DialogContent
          className="sm:max-w-[480px] p-6 gap-6 bg-white rounded-xl shadow-lg border border-slate-100"
        >
          <DialogHeader className="flex flex-row items-center justify-between pb-2">
            <DialogTitle className="text-xl font-bold text-gray-955">Booking Details</DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-slate-500">Purpose</h3>
              <p className="mt-1 text-lg font-bold text-gray-955">{purpose?.length > 255 ? purpose.substring(0, 255) + '...' : purpose}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-500">Start Time</h3>
                <p className="mt-1 text-base font-medium text-gray-955">
                  {startTime ? dayjs(startTime).tz("Asia/Dhaka").format("MMM D, YYYY h:mm A") : "-"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-500">End Time</h3>
                <p className="mt-1 text-base font-medium text-gray-955">
                  {endTime ? dayjs(endTime).tz("Asia/Dhaka").format("MMM D, YYYY h:mm A") : "-"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-500">Booked By</h3>
                <p className="mt-1 text-base font-medium text-gray-955">{userName}</p>
                {userEmail && <p className="text-xs text-gray-500 mt-0.5">{userEmail}</p>}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-500">Status</h3>
                <div className="mt-1">
                  {id && availableOptions.length > 0 ? (
                    <Select
                      value={currentStatusClean}
                      disabled={currentStatusClean === 'CANCELLED' || currentStatusClean === 'REJECTED'}
                      onValueChange={(val: any) => {
                        setConfirmOpen({ status: val, open: true })
                      }}
                    >
                      <SelectTrigger
                        disabled={loading}
                        className={cn("w-auto min-w-[130px] flex items-center justify-between gap-2 px-3 py-1.5 h-auto text-sm font-bold text-gray-955 bg-white border border-gray-200 rounded-lg shadow-xs hover:bg-slate-50 focus:outline-none focus:ring-0 [&>svg]:text-slate-500",
                          status === "APPROVED"
                            ? "bg-emerald-100/70 text-emerald-800 border-emerald-200/50"
                            : status === "PENDING"
                              ? "bg-amber-100/70 text-amber-800 border-amber-200/50"
                              : "bg-rose-100/70 text-rose-800 border-rose-200/50"
                        )}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-slate-100 rounded-lg shadow-md z-50">
                        {Array.from(new Set([currentStatusClean, ...options])).map((opt) => (
                          <SelectItem
                            key={opt}
                            value={opt}
                            disabled={opt === currentStatusClean}
                            className={cn("cursor-pointer font-semibold",
                              opt === "APPROVED" ? "text-emerald-700 focus:bg-emerald-50 focus:text-emerald-800 data-[disabled]:opacity-50" :
                                opt === "REJECTED" ? "text-rose-700 focus:bg-rose-50 focus:text-rose-800 data-[disabled]:opacity-50" :
                                  "text-slate-700 focus:bg-slate-50 focus:text-slate-800 data-[disabled]:opacity-50"
                            )}
                          >
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span
                      className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wide border ${status === "APPROVED"
                        ? "bg-emerald-100/70 text-emerald-800 border-emerald-200/50"
                        : status === "PENDING"
                          ? "bg-amber-100/70 text-amber-800 border-amber-200/50"
                          : "bg-rose-100/70 text-rose-800 border-rose-200/50"
                        }`}
                    >
                      {status}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <Button
                variant="outline"
                type="button"
                className="px-5 py-2 rounded-lg border-gray-200 text-gray-955 hover:bg-gray-50 font-bold text-sm bg-white shadow-xs"
                onClick={onClose}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen.open} onOpenChange={(open) => !open && cancelStatusChange()}>
        <AlertDialogContent className="bg-white rounded-xl shadow-lg border border-slate-100 p-6 max-w-md gap-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will change the status of this booking to <strong className="text-gray-955">{confirmOpen.status}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <AlertDialogCancel
              onClick={(e) => {
                e.stopPropagation()
                cancelStatusChange()
              }}
              className="px-4 py-2 border rounded-lg text-sm bg-white hover:bg-slate-50 font-semibold text-slate-700"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.stopPropagation()
                confirmStatusChange()
              }}
              className="px-4 py-2 rounded-lg text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
