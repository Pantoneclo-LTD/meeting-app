"use client"

import { useState, useMemo } from "react"
import { APP_CONFIG } from "@/lib/config"
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
} from '@tanstack/react-table'
import dayjs from "dayjs"
import { Button } from "@/components/ui/button"
import { updateBookingStatus, deleteBooking, deleteBookings } from "@/app/actions/booking"
import { toast } from "sonner"
import { utils, writeFile } from "xlsx"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

type BookingRow = {
  id: string
  purpose: string
  status: string
  startTime: string
  endTime: string
  user: { name: string, email: string, team?: string | null }
}

const columnHelper = createColumnHelper<BookingRow>()

export function BookingTable({ initialBookings, userRole }: { initialBookings: BookingRow[], userRole: string }) {
  const [bookings, setBookings] = useState(initialBookings)
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
  const [searchQuery, setSearchQuery] = useState("")
  const [filterTeam, setFilterTeam] = useState("ALL")
  const [filterStartDate, setFilterStartDate] = useState("")
  const [filterEndDate, setFilterEndDate] = useState("")
  const [filterStatus, setFilterStatus] = useState("ALL")

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      // Search text
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (!b.user.name.toLowerCase().includes(query) && !b.purpose.toLowerCase().includes(query)) {
          return false
        }
      }

      // Team filter
      if (filterTeam !== "ALL" && b.user.team !== filterTeam) {
        return false
      }

      // Status filter
      if (filterStatus !== "ALL" && b.status !== filterStatus) {
        return false
      }

      // Date range filter
      if (filterStartDate) {
        if (dayjs(b.startTime).isBefore(dayjs(filterStartDate), 'day')) return false
      }
      if (filterEndDate) {
        if (dayjs(b.endTime).isAfter(dayjs(filterEndDate), 'day')) return false
      }

      return true
    })
  }, [bookings, searchQuery, filterTeam, filterStartDate, filterEndDate, filterStatus])

  const handleStatusUpdate = async (id: string, status: "APPROVED" | "REJECTED" | "CANCELLED") => {
    try {
      await updateBookingStatus(id, status)
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b))
      toast.success(`Booking ${status.toLowerCase()} successfully`)
    } catch (e: unknown) {
      toast.error((e as Error).message || "Failed to update status")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this booking?")) return
    try {
      await deleteBooking(id)
      setBookings(prev => prev.filter(b => b.id !== id))
      toast.success("Booking deleted successfully")
    } catch (e: unknown) {
      toast.error((e as Error).message || "Failed to delete booking")
    }
  }

  const handleBulkDelete = async () => {
    const selectedIds = Object.keys(rowSelection).filter(id => rowSelection[id])
    if (selectedIds.length === 0) return
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} bookings?`)) return

    try {
      await deleteBookings(selectedIds)
      setBookings(prev => prev.filter(b => !selectedIds.includes(b.id)))
      setRowSelection({})
      toast.success("Bookings deleted successfully")
    } catch (e: unknown) {
      toast.error((e as Error).message || "Failed to delete bookings")
    }
  }

  const columns = [
    ...(userRole === "SUPERADMIN" ? [
      columnHelper.display({
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            className="rounded border-gray-300"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            className="rounded border-gray-300"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
          />
        ),
      })
    ] : []),
    columnHelper.accessor('user.name', {
      header: 'User',
      cell: info => info.getValue(),
    }),
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
        return (
          <div className="flex space-x-2">
            {info.row.original.status === "PENDING" && (
              <>
                <Button size="sm" variant="default" onClick={() => handleStatusUpdate(info.row.original.id, "APPROVED")}>Approve</Button>
                <Button size="sm" variant="destructive" onClick={() => handleStatusUpdate(info.row.original.id, "REJECTED")}>Reject</Button>
              </>
            )}
            {userRole === "SUPERADMIN" && (
              <Button size="sm" variant="destructive" onClick={() => handleDelete(info.row.original.id)}>Delete</Button>
            )}
          </div>
        )
      },
    }),
  ]

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filteredBookings,
    columns,
    state: {
      rowSelection,
    },
    getRowId: row => row.id,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const exportExcel = () => {
    const ws = utils.json_to_sheet(filteredBookings.map(b => ({
      Date: dayjs(b.startTime).format("YYYY-MM-DD"),
      Time: `${dayjs(b.startTime).format("HH:mm")} - ${dayjs(b.endTime).format("HH:mm")}`,
      User: b.user.name,
      Purpose: b.purpose,
      Status: b.status
    })))
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, "Bookings")
    writeFile(wb, "bookings_export.xlsx")
  }

  const exportPDF = () => {
    const doc = new jsPDF()
    doc.text("Meeting Room Bookings", 14, 15)

    const tableData = filteredBookings.map(b => [
      dayjs(b.startTime).format("YYYY-MM-DD"),
      `${dayjs(b.startTime).format("HH:mm")} - ${dayjs(b.endTime).format("HH:mm")}`,
      b.user.name,
      b.purpose,
      b.status
    ])

    autoTable(doc, {
      head: [['Date', 'Time', 'User', 'Purpose', 'Status']],
      body: tableData,
      startY: 20
    })

    doc.save("bookings_export.pdf")
  }

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-white p-4 rounded-md border">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase">Search</label>
          <input
            type="text"
            placeholder="Name or Purpose..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full mt-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase">Team</label>
          <select
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
            className="w-full mt-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Teams</option>
            {APP_CONFIG.PREDEFINED_TEAMS.map(team => (
              <option key={team} value={team}>{team}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full mt-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase">Start Date</label>
          <input
            type="date"
            value={filterStartDate}
            onChange={(e) => setFilterStartDate(e.target.value)}
            className="w-full mt-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase">End Date</label>
          <input
            type="date"
            value={filterEndDate}
            onChange={(e) => setFilterEndDate(e.target.value)}
            className="w-full mt-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500 font-medium">Showing {filteredBookings.length} booking(s)</span>
        <div className="space-x-2">
          {userRole === "SUPERADMIN" && Object.keys(rowSelection).filter(id => rowSelection[id]).length > 0 && (
            <Button variant="destructive" onClick={handleBulkDelete}>
              Delete Selected ({Object.keys(rowSelection).filter(id => rowSelection[id]).length})
            </Button>
          )}
          <Button variant="outline" onClick={exportExcel}>Export Excel</Button>
          <Button variant="outline" onClick={exportPDF}>Export PDF</Button>
        </div>
      </div>

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
