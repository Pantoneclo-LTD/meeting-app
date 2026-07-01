"use client"

import { useState } from "react"
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
} from '@tanstack/react-table'
import dayjs from "dayjs"
import { Button } from "@/components/ui/button"
import { updateBookingStatus } from "@/app/actions/booking"
import { toast } from "sonner"

type BookingRow = {
  id: string
  purpose: string
  status: string
  startTime: string
  endTime: string
}

const columnHelper = createColumnHelper<BookingRow>()

export function UserBookingTable({ initialBookings }: { initialBookings: BookingRow[] }) {
  const [bookings, setBookings] = useState(initialBookings)

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this booking request?")) return
    try {
      await updateBookingStatus(id, "CANCELLED")
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: "CANCELLED" } : b))
      toast.success("Booking cancelled successfully")
    } catch (e: unknown) {
      toast.error((e as Error).message || "Failed to cancel booking")
    }
  }

  const columns = [
    columnHelper.accessor('purpose', {
      header: 'Purpose',
      cell: info => info.getValue(),
    }),
    columnHelper.accessor('startTime', {
      header: 'Date & Time',
      cell: info => {
        const start = dayjs(info.getValue())
        const end = dayjs(info.row.original.endTime)
        return (
          <div className="text-sm">
            <div>{start.format("MMM D, YYYY")}</div>
            <div className="text-gray-500">{start.format("h:mm A")} - {end.format("h:mm A")}</div>
          </div>
        )
      }
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: info => {
        const status = info.getValue()
        let color = "bg-gray-100 text-gray-800"
        if (status === "APPROVED") color = "bg-green-100 text-green-800"
        if (status === "PENDING") color = "bg-yellow-100 text-yellow-800"
        if (status === "REJECTED" || status === "CANCELLED") color = "bg-red-100 text-red-800"
        return <span className={`px-2 py-1 rounded text-xs font-medium ${color}`}>{status}</span>
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: info => {
        if (info.row.original.status !== "PENDING") return null
        return (
          <Button size="sm" variant="outline" onClick={() => handleCancel(info.row.original.id)}>
            Cancel Request
          </Button>
        )
      },
    }),
  ]

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: bookings,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <div className="space-y-4">
      <div className="border rounded-md bg-white">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id} className="p-3 font-semibold text-gray-700">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="p-4 text-center text-gray-500">
                  No bookings found. You can book a room from the Calendar.
                </td>
              </tr>
            )}
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="border-b hover:bg-gray-50">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="p-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex items-center justify-between p-3 border-t bg-gray-50">
          <div className="text-gray-500 text-sm">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </div>
          <div className="space-x-2">
            <Button size="sm" variant="outline" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Previous</Button>
            <Button size="sm" variant="outline" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
