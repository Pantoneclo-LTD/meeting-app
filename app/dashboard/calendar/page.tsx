"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import { getBookingsForCalendar, createBooking } from "@/app/actions/booking"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import dayjs from "dayjs"
import { useSession } from "next-auth/react"
import { APP_CONFIG } from "@/lib/config"

export default function CalendarPage() {
  const queryClient = useQueryClient()
  const [dateRange, setDateRange] = useState({ start: new Date().toISOString(), end: new Date().toISOString() })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [purpose, setPurpose] = useState("")
  const [preparationTime, setPreparationTime] = useState("10")

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false)

  const { data: session } = useSession()
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPERADMIN"

  const { data: bookings = [] } = useQuery({
    queryKey: ["bookings", dateRange],
    queryFn: () => getBookingsForCalendar(dateRange.start, dateRange.end),
  })

  const backgroundEvents = APP_CONFIG.BANGLADESH_HOLIDAYS.map(dateStr => ({
    start: dateStr,
    display: 'background',
    backgroundColor: '#fee2e2', // light red
    allDay: true,
  }))

  const pastEvent = {
    start: '1970-01-01T00:00:00',
    end: new Date().toISOString(),
    display: 'background',
    backgroundColor: '#f3f4f6', // gray-100
  }

  const calendarEvents = [...bookings, ...backgroundEvents, pastEvent]

  const createMutation = useMutation({
    mutationFn: createBooking,
    onSuccess: () => {
      toast.success("Booking request submitted successfully.")
      queryClient.invalidateQueries({ queryKey: ["bookings"] })
      setIsDialogOpen(false)
      setPurpose("")
      setPreparationTime(APP_CONFIG.DEFAULT_PREP_TIME_MINUTES.toString())
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create booking")
    }
  })

  const handleDatesSet = (arg: { startStr: string, endStr: string }) => {
    setDateRange({ start: arg.startStr, end: arg.endStr })
  }

  const selectAllow = (selectInfo: { start: Date, end: Date }) => {
    if (selectInfo.end <= new Date()) return false
    if (selectInfo.start.getDay() === 5 || selectInfo.end.getDay() === 5) return false

    const startStr = dayjs(selectInfo.start).format('YYYY-MM-DD')
    const endStr = dayjs(selectInfo.end).format('YYYY-MM-DD')
    if (APP_CONFIG.BANGLADESH_HOLIDAYS.includes(startStr) || APP_CONFIG.BANGLADESH_HOLIDAYS.includes(endStr)) return false

    return true
  }

  const [customStartTime, setCustomStartTime] = useState<string>("")
  const [customEndTime, setCustomEndTime] = useState<string>("")

  // Update custom times when a slot is clicked
  const handleSelectSlot = (arg: { start: Date, end: Date }) => {
    const toLocalFormat = (date: Date) => {
      const pad = (n: number) => n.toString().padStart(2, '0')
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
    }
    setCustomStartTime(toLocalFormat(arg.start))
    setCustomEndTime(toLocalFormat(arg.end))
    setIsDialogOpen(true)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEventClick = (arg: { event: any }) => {
    if (arg.event.display === "background") return
    setSelectedEvent(arg.event)
    setIsEventDetailsOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const start = new Date(customStartTime)
    const end = new Date(customEndTime)

    if (start < new Date()) {
      return toast.error("Cannot book a meeting in the past.")
    }
    if (start >= end) {
      return toast.error("End time must be after start time.")
    }
    if (start.getDay() === 5 || end.getDay() === 5) {
      return toast.error("Cannot book on a Friday.")
    }
    const startStr = dayjs(start).format('YYYY-MM-DD')
    const endStr = dayjs(end).format('YYYY-MM-DD')
    if (APP_CONFIG.BANGLADESH_HOLIDAYS.includes(startStr) || APP_CONFIG.BANGLADESH_HOLIDAYS.includes(endStr)) {
      return toast.error("Cannot book on a holiday.")
    }

    createMutation.mutate({
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      preparationTime: isAdmin ? (parseInt(preparationTime, 10) || APP_CONFIG.DEFAULT_PREP_TIME_MINUTES) : APP_CONFIG.DEFAULT_PREP_TIME_MINUTES,
      purpose,
    })
  }

  return (
    <div>

      <div className="p-4 h-full flex flex-col">
        <h1 className="text-2xl font-bold mb-4">Meeting Room Calendar</h1>
        <div className="flex-1 min-h-[600px]">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay"
            }}
            events={calendarEvents}
            selectable={true}
            selectAllow={selectAllow}
            selectMirror={true}
            dayMaxEvents={true}
            datesSet={handleDatesSet}
            select={handleSelectSlot}
            eventClick={handleEventClick}
            height="100%"
            allDaySlot={false}
            slotMinTime="08:00:00"
            slotMaxTime="20:00:00"
            businessHours={{
              daysOfWeek: [0, 1, 2, 3, 4, 6], // Excludes Friday (5)
              startTime: '08:00',
              endTime: '20:00',
            }}
          />
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book Meeting Room</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="datetime-local"
                  value={customStartTime}
                  min={dayjs().format('YYYY-MM-DDTHH:mm')}
                  onChange={e => setCustomStartTime(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="datetime-local"
                  value={customEndTime}
                  min={customStartTime || dayjs().format('YYYY-MM-DDTHH:mm')}
                  onChange={e => setCustomEndTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Meeting Purpose</Label>
              <Input
                value={purpose}
                onChange={e => setPurpose(e.target.value)}
                required
                placeholder="E.g., Team Sync, Client Call"
              />
            </div>

            {isAdmin && (
              <div className="space-y-2">
                <Label>Preparation Time (minutes)</Label>
                <Input
                  type="number"
                  min="0"
                  value={preparationTime}
                  onChange={e => setPreparationTime(e.target.value)}
                  required
                />
                <p className="text-xs text-gray-500">Buffer time added after the meeting.</p>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Submitting..." : "Book Room"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEventDetailsOpen} onOpenChange={setIsEventDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4 mt-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Purpose</h3>
                <p className="mt-1 text-base">{selectedEvent.extendedProps?.purpose || selectedEvent.title}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Start Time</h3>
                  <p className="mt-1">{dayjs(selectedEvent.start).format('MMM D, YYYY h:mm A')}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">End Time</h3>
                  <p className="mt-1">{dayjs(selectedEvent.end).format('MMM D, YYYY h:mm A')}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Booked By</h3>
                  <p className="mt-1">{selectedEvent.extendedProps?.userName}</p>
                  <p className="text-xs text-gray-500">{selectedEvent.extendedProps?.userEmail}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${selectedEvent.extendedProps?.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        selectedEvent.extendedProps?.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'}`}>
                      {selectedEvent.extendedProps?.status || 'UNKNOWN'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <Button variant="outline" onClick={() => setIsEventDetailsOpen(false)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
