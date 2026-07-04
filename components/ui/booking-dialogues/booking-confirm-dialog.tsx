"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"

dayjs.extend(utc)
dayjs.extend(timezone)

interface BookingConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  purpose: string
  startTime: string
  endTime: string
  isPending?: boolean
}

export function BookingConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  purpose,
  startTime,
  endTime,
  isPending = false,
}: BookingConfirmDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="sm:max-w-[480px] p-6 gap-6 bg-white rounded-xl shadow-lg border border-slate-100"
      >
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl font-bold text-gray-955">Confirm Booking Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-slate-500">Purpose</h3>
            <p className="mt-1 text-lg font-bold text-gray-955">
              {purpose?.length > 255 ? purpose.substring(0, 255) + '...' : purpose}
            </p>
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

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              variant="outline"
              type="button"
              className="px-5 py-2 rounded-lg border-gray-200 text-gray-955 hover:bg-gray-50 font-bold text-sm bg-white shadow-xs"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm shadow-xs transition-colors"
              onClick={onConfirm}
              disabled={isPending}
            >
              {isPending ? "Confirming..." : "Confirm"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
