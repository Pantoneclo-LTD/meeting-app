"use client"

import { useState } from "react"
import { updateBookingStatus } from "@/app/actions/booking"
import { toast } from "sonner"
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

export function StatusChanger({
  bookingId,
  currentStatus,
  userRole,
}: {
  bookingId: string
  currentStatus: string
  userRole: string
}) {
  const [status, setStatus] = useState(currentStatus)
  const [loading, setLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<"APPROVED" | "REJECTED" | "CANCELLED" | null>(null)

  const isAdmin = userRole === "ADMIN" || userRole === "SUPERADMIN"

  if (!isAdmin) {
    return (
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
    )
  }

  const confirmStatusChange = async () => {
    if (!pendingStatus) return
    setLoading(true)
    try {
      await updateBookingStatus(bookingId, pendingStatus)
      setStatus(pendingStatus)
      toast.success(`Booking status updated to ${pendingStatus}`)
    } catch {
      toast.error("Failed to update booking status")
    } finally {
      setLoading(false)
      setConfirmOpen(false)
      setPendingStatus(null)
    }
  }

  const cancelStatusChange = () => {
    setConfirmOpen(false)
    setPendingStatus(null)
  }

  return (
    <div className="relative inline-block w-full sm:w-48">
      <select
        value={status}
        disabled={loading}
        onChange={(e) => {
          const nextStatus = e.target.value as "APPROVED" | "REJECTED" | "CANCELLED"
          setPendingStatus(nextStatus)
          setConfirmOpen(true)
        }}
        className="block w-full rounded-lg border border-gray-200 bg-white py-1.5 pl-3 pr-10 text-sm font-semibold text-gray-955 shadow-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
      >
        <option value="PENDING">PENDING</option>
        <option value="APPROVED">APPROVED</option>
        <option value="REJECTED">REJECTED</option>
        <option value="CANCELLED">CANCELLED</option>
      </select>

      <AlertDialog open={confirmOpen} onOpenChange={(open) => !open && cancelStatusChange()}>
        <AlertDialogContent className="bg-white rounded-xl shadow-lg border border-slate-100 p-6 max-w-md gap-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will change the status of this booking to <strong className="text-gray-955">{pendingStatus}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <AlertDialogCancel onClick={cancelStatusChange} className="px-4 py-2 border rounded-lg text-sm bg-white hover:bg-slate-50 font-semibold text-slate-700">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange} className="px-4 py-2 rounded-lg text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold">
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
