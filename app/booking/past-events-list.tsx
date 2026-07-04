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
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 uppercase text-xs">
                  <th className="px-4 py-3 font-semibold rounded-tl-lg">Date</th>
                  <th className="px-4 py-3 font-semibold">Time</th>
                  <th className="px-4 py-3 font-semibold">Purpose</th>
                  <th className="px-4 py-3 font-semibold">Organizer</th>
                  <th className="px-4 py-3 font-semibold rounded-tr-lg">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium">{dayjs(event.startTime).format('MMM D, YYYY')}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {dayjs(event.startTime).format('h:mm A')} - {dayjs(event.endTime).format('h:mm A')}
                    </td>
                    <td className="px-4 py-3">{event.purpose}</td>
                    <td className="px-4 py-3">{event.user.name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold
                        ${event.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 
                          event.status === 'REJECTED' || event.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 
                          'bg-yellow-100 text-yellow-700'}`}>
                        {event.status}
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
