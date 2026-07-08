"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import dayjs from "dayjs"
import { CalendarX } from "lucide-react"

type PastEvent = {
  id: string
  purpose: string
  startTime: string
  endTime: string
  status: string
  user: { name: string }
}

export function PastEventsList({ events }: { events: PastEvent[] }) {
  return (
    <Card className="col-span-full shadow-sm">
      <CardHeader>
        <CardTitle>Recent Past Events</CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-gray-500">
            <CalendarX className="h-8 w-8 mb-4 text-gray-300" />
            <p>No past events found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs md:text-sm text-left">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 uppercase text-[10px] md:text-xs">
                  <th className="px-2 py-2 md:px-4 md:py-3 font-semibold rounded-tl-lg whitespace-nowrap">Date</th>
                  <th className="px-2 py-2 md:px-4 md:py-3 font-semibold whitespace-nowrap">Time</th>
                  <th className="px-2 py-2 md:px-4 md:py-3 font-semibold">Purpose</th>
                  <th className="px-2 py-2 md:px-4 md:py-3 font-semibold">Organizer</th>
                  <th className="px-2 py-2 md:px-4 md:py-3 font-semibold rounded-tr-lg whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-2 py-2 md:px-4 md:py-3 font-medium whitespace-nowrap">{dayjs(event.startTime).format('MMM D, YYYY')}</td>
                    <td className="px-2 py-2 md:px-4 md:py-3 text-gray-600 whitespace-nowrap">
                      {dayjs(event.startTime).format('h:mm A')} - {dayjs(event.endTime).format('h:mm A')}
                    </td>
                    <td className="px-2 py-2 md:px-4 md:py-3 max-w-[200px] truncate">{event.purpose}</td>
                    <td className="px-2 py-2 md:px-4 md:py-3 whitespace-nowrap">{event.user.name}</td>
                    <td className="px-2 py-2 md:px-4 md:py-3">
                      <span className={`px-1.5 py-0.5 md:px-2.5 md:py-0.5 rounded-full text-[10px] md:text-xs font-bold border uppercase tracking-wide
                        ${event.status === 'APPROVED' 
                          ? 'bg-emerald-100/70 text-emerald-800 border-emerald-200/50' 
                          : 'bg-slate-100 text-slate-800 border-slate-200/50'}`}>
                        {event.status === 'APPROVED' ? 'Done' : 'Expired'}
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
