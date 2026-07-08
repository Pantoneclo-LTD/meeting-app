"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import { CalendarCheck } from "lucide-react"

dayjs.extend(utc)
dayjs.extend(timezone)

type UpcomingBooking = {
  id: string
  purpose: string
  startTime: string
  endTime: string
  status: string
  user: { name: string; email: string }
}

export function UpcomingBookingsList({ bookings }: { bookings: UpcomingBooking[] }) {
  return (
    <Card className="col-span-full shadow-sm border-0 bg-white ring-1 ring-gray-100">
      <CardHeader className="border-b border-gray-100/50 pb-4">
        <CardTitle className="text-lg font-bold text-gray-955 flex items-center gap-2">
          <CalendarCheck className="h-5 w-5 text-[#5B3EFA]" />
          Upcoming 5 Bookings (Admin View)
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-gray-500">
            <CalendarCheck className="h-8 w-8 mb-3 text-gray-300" />
            <p className="text-sm font-medium">No upcoming bookings scheduled.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs md:text-sm text-left">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 uppercase text-[10px] md:text-xs">
                  <th className="px-2 py-2 md:px-4 md:py-3 font-semibold rounded-tl-lg whitespace-nowrap">Date</th>
                  <th className="px-2 py-2 md:px-4 md:py-3 font-semibold whitespace-nowrap">Time (BST)</th>
                  <th className="px-2 py-2 md:px-4 md:py-3 font-semibold">Purpose</th>
                  <th className="px-2 py-2 md:px-4 md:py-3 font-semibold">Booked By</th>
                  <th className="px-2 py-2 md:px-4 md:py-3 font-semibold rounded-tr-lg whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-2 py-2 md:px-4 md:py-3 font-medium text-gray-955 whitespace-nowrap">
                      {dayjs(booking.startTime).tz("Asia/Dhaka").format('MMM D, YYYY')}
                    </td>
                    <td className="px-2 py-2 md:px-4 md:py-3 text-gray-650 font-medium whitespace-nowrap">
                      {dayjs(booking.startTime).tz("Asia/Dhaka").format('h:mm A')} - {dayjs(booking.endTime).tz("Asia/Dhaka").format('h:mm A')}
                    </td>
                    <td className="px-2 py-2 md:px-4 md:py-3 text-gray-955 font-semibold max-w-[200px] truncate">{booking.purpose}</td>
                    <td className="px-2 py-2 md:px-4 md:py-3 whitespace-nowrap">
                      <div className="font-medium text-gray-955">{booking.user.name}</div>
                      <div className="text-[10px] md:text-xs text-gray-500">{booking.user.email}</div>
                    </td>
                    <td className="px-2 py-2 md:px-4 md:py-3">
                      <span className={`inline-flex items-center px-1.5 py-0.5 md:px-2.5 md:py-0.5 rounded-full text-[10px] md:text-xs font-extrabold uppercase tracking-wide border ${
                        booking.status === 'APPROVED' ? 'bg-emerald-100/70 text-emerald-800 border-emerald-200/50' : 
                        booking.status === 'REJECTED' || booking.status === 'CANCELLED' ? 'bg-rose-100/70 text-rose-800 border-rose-200/50' : 
                        'bg-amber-100/70 text-amber-800 border-amber-200/50'
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
