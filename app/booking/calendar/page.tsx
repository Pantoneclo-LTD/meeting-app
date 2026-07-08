"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import dynamic from "next/dynamic"

const FullCalendar = dynamic(() => import("@fullcalendar/react"), {
  ssr: false,
  loading: () => (
    <div className="p-4 h-full flex flex-col justify-center items-center min-h-[600px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
    </div>
  )
})
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import { getBookingsForCalendar, createBooking } from "@/app/actions/booking"
import { toast } from "sonner"
import dayjs from "dayjs"
import { useSession } from "next-auth/react"
import { APP_CONFIG } from "@/lib/config"
import { BookingDetailsDialog } from "@/components/ui/booking-dialogues/booking-details-dialog"
import { BookingFormDialog } from "@/components/ui/booking-dialogues/booking-form-dialog"

const CALENDAR_VIEWS = {
  timeGridWeek: {
    type: "timeGrid",
    duration: { days: 7 },
    dateIncrement: { days: 7 },
    buttonText: "week",
    visibleRange: (currentDate: Date) => {
      const start = new Date(currentDate.valueOf());
      const end = new Date(currentDate.valueOf());
      end.setDate(start.getDate() + 7);
      return { start, end };
    }
  }
};

export default function CalendarPage() {
  const queryClient = useQueryClient()
  const [dateRange, setDateRange] = useState({ start: new Date().toISOString(), end: new Date().toISOString() })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date, end: Date } | null>(null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false)

  const { data: session } = useSession()

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
    backgroundColor: '#fee2e2', // light red (disabled like vacation)
  }

  const calendarEvents = [...bookings, ...backgroundEvents, pastEvent]

  const createMutation = useMutation({
    mutationFn: createBooking,
    onSuccess: () => {
      toast.success("Booking request submitted successfully.")
      queryClient.invalidateQueries({ queryKey: ["bookings"] })
      setIsDialogOpen(false)
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

  const handleSelectSlot = (arg: { start: Date, end: Date }) => {
    setSelectedSlot({ start: arg.start, end: arg.end })
    setIsDialogOpen(true)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEventClick = (arg: { event: any }) => {
    if (arg.event.display === "background") return
    setSelectedEvent(arg.event)
    setIsEventDetailsOpen(true)
  }

  return (
    <div>

      <div className="p-4 h-full flex flex-col">
        <h1 className="text-2xl font-bold mb-4">Studio Room Calendar</h1>
        <div className="flex-1 min-h-[600px]">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            firstDay={5}
            views={CALENDAR_VIEWS}
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
            selectLongPressDelay={100}
            eventLongPressDelay={0}
          />
        </div>
      </div>

      <BookingDetailsDialog
        isOpen={isEventDetailsOpen}
        onClose={() => setIsEventDetailsOpen(false)}
        booking={selectedEvent}
        userRole={session?.user?.role}
        currentUserId={session?.user?.id}
        onStatusChange={() => {
          queryClient.invalidateQueries({ queryKey: ["bookings"] })
        }}
      />

      <BookingFormDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        initialStartTime={selectedSlot?.start || null}
        initialEndTime={selectedSlot?.end || null}
        onSubmit={(data) => {
          createMutation.mutate({
            startTime: data.startTime,
            endTime: data.endTime,
            preparationTime: 0,
            purpose: data.purpose,
          })
        }}
        isPending={createMutation.isPending}
      />
    </div>
  )
}
