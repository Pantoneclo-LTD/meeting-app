"use client"

import { useState, useMemo } from "react"
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
import { Eye, ChevronDown } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { BookingDetailsDialog } from "@/components/ui/booking-dialogues/booking-details-dialog"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"

type BookingRow = {
  id: string
  purpose: string
  status: string
  startTime: string
  endTime: string
  user: {
    name: string
    email: string
  }
}

const columnHelper = createColumnHelper<BookingRow>()

export function UserBookingTable({
  initialBookings,
  defaultOpenBooking = null,
  userRole = "USER",
  defaultStatus
}: {
  initialBookings: BookingRow[]
  defaultOpenBooking?: BookingRow | null
  userRole?: string
  defaultStatus?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session } = useSession()
  const [bookings, setBookings] = useState(initialBookings)
  const [filterStatus, setFilterStatus] = useState(defaultStatus || "ALL")
  const [selectedBooking, setSelectedBooking] = useState<BookingRow | null>(defaultOpenBooking)

  const filteredBookings = useMemo(() => {
    if (filterStatus === "ALL") return bookings
    return bookings.filter(b => b.status === filterStatus)
  }, [bookings, filterStatus])

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
      cell: info => {
        const val = info.getValue() as string;
        return val.length > 30 ? val.substring(0, 30) + '...' : val;
      },
    }),
    columnHelper.accessor('startTime', {
      header: 'Date & Time',
      cell: info => {
        const start = dayjs(info.getValue())
        const end = dayjs(info.row.original.endTime)
        return (
          <div className="text-xs md:text-sm">
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
        const endTime = info.row.original.endTime
        const isExpired = endTime ? dayjs(endTime).isBefore(dayjs()) : false

        let displayStatus = status
        let color = "bg-gray-100 text-gray-800"
        
        if (isExpired) {
          if (status === "APPROVED") {
            displayStatus = "Done"
            color = "bg-green-100 text-green-800"
          } else {
            displayStatus = "Expired"
            color = "bg-slate-100 text-slate-800"
          }
        } else {
          if (status === "APPROVED") color = "bg-green-100 text-green-800"
          if (status === "PENDING") color = "bg-yellow-100 text-yellow-800"
          if (status === "REJECTED" || status === "CANCELLED") color = "bg-red-100 text-red-800"
        }

        return (
          <>
            {/* Desktop Status */}
            <span className={`hidden md:inline-block px-2 py-1 rounded text-xs font-medium ${color}`}>{displayStatus}</span>
            {/* Mobile Status (reduced size more) */}
            <span className={`inline-block md:hidden px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider ${color}`}>{displayStatus}</span>
          </>
        )
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: info => {
        const booking = info.row.original
        const isExpired = booking.endTime ? dayjs(booking.endTime).isBefore(dayjs()) : false
        return (
          <>
            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-1.5">
              <Button
                size="icon-sm"
                variant="outline"
                title="View Details"
                onClick={() => setSelectedBooking(booking)}
                className="text-gray-500 hover:text-gray-900 border-gray-200 hover:border-gray-300 h-8 w-8"
              >
                <Eye className="size-4" />
              </Button>
              {booking.status === "PENDING" && !isExpired && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCancel(booking.id)}
                  className="h-8 px-3 text-xs"
                >
                  Cancel Request
                </Button>
              )}
            </div>

            {/* Mobile Actions (Dropdown) */}
            <div className="flex md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 px-2 text-xs flex items-center gap-1 font-semibold border-slate-200 bg-white">
                    Actions <ChevronDown className="size-3.5 text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36 bg-white border border-slate-100 shadow-lg rounded-lg p-1">
                  <DropdownMenuItem
                    onClick={() => setSelectedBooking(booking)}
                    className="flex items-center gap-2 text-xs font-semibold px-2 py-1.5 hover:bg-slate-50 rounded-md cursor-pointer text-slate-700"
                  >
                    <Eye className="size-3.5 text-slate-400" /> View Details
                  </DropdownMenuItem>
                  {booking.status === "PENDING" && !isExpired && (
                    <DropdownMenuItem
                      onClick={() => handleCancel(booking.id)}
                      className="flex items-center gap-2 text-xs font-semibold px-2 py-1.5 hover:bg-rose-50 text-rose-600 rounded-md cursor-pointer"
                    >
                      Cancel Request
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        )
      },
    }),
  ]

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filteredBookings,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <div className="space-y-4">
      <div className="flex gap-2 bg-white p-3 rounded-lg border border-gray-100 max-w-xs shadow-xs">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="block w-full rounded-md border border-gray-200 bg-white py-1.5 pl-3 pr-8 text-xs font-semibold text-gray-955 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="ALL">All Bookings</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="border rounded-md bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-xs md:text-sm text-left">
            <thead className="bg-gray-50 border-b">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => {
                    const isDateTime = header.id === 'startTime';
                    return (
                      <th
                        key={header.id}
                        className={cn(
                          "p-2 md:p-3 font-semibold text-gray-700",
                          isDateTime && "whitespace-nowrap w-full md:w-auto md:whitespace-normal"
                        )}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="p-2 md:p-3 text-center text-gray-500">
                    No bookings found. You can book a room from the Calendar.
                  </td>
                </tr>
              )}
              {table.getRowModel().rows.map(row => (
                <tr key={row.id} className="border-b hover:bg-gray-50">
                  {row.getVisibleCells().map(cell => {
                    const isDateTime = cell.column.id === 'startTime';
                    return (
                      <td
                        key={cell.id}
                        className={cn(
                          "p-2 md:p-3",
                          isDateTime && "whitespace-nowrap md:whitespace-normal"
                        )}
                      >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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

      <BookingDetailsDialog
        isOpen={!!selectedBooking}
        onClose={() => {
          setSelectedBooking(null)
          router.replace(pathname, { scroll: false })
        }}
        booking={selectedBooking}
        userRole={userRole}
        currentUserId={session?.user?.id}
        onStatusChange={(newStatus) => {
          if (selectedBooking) {
            setBookings(prev => prev.map(b => b.id === selectedBooking.id ? { ...b, status: newStatus } : b))
          }
        }}
      />
    </div>
  )
}
