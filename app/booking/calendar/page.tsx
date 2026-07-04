"use client"

import { useState, useRef, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import { getBookingsForCalendar, createBooking } from "@/app/actions/booking"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import dayjs from "dayjs"
import { useSession } from "next-auth/react"
import { APP_CONFIG } from "@/lib/config"
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, FileText } from "lucide-react"
import { BookingDetailsDialog } from "@/components/booking-details-dialog"
import { BookingConfirmDialog } from "@/components/booking-confirm-dialog"

export default function CalendarPage() {
  const queryClient = useQueryClient()
  const [dateRange, setDateRange] = useState({ start: new Date().toISOString(), end: new Date().toISOString() })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [purpose, setPurpose] = useState("")

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
      setIsConfirmDialogOpen(false)
      setPurpose("")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create booking")
      setIsConfirmDialogOpen(false)
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
  const [activeField, setActiveField] = useState<"start" | "end">("start")
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date())
  const [pickerHighlight, setPickerHighlight] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)
  const hourScrollRef = useRef<HTMLDivElement>(null)
  const minuteScrollRef = useRef<HTMLDivElement>(null)

  // Smoothly scroll hour & minute lists to show the currently selected value
  useEffect(() => {
    const scrollToSelected = (container: HTMLDivElement | null) => {
      if (!container) return
      const selected = container.querySelector<HTMLButtonElement>('[data-selected="true"]')
      if (selected) {
        selected.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    }
    // Small delay so React has rendered the updated selected state first
    const id = setTimeout(() => {
      scrollToSelected(hourScrollRef.current)
      scrollToSelected(minuteScrollRef.current)
    }, 50)
    return () => clearTimeout(id)
  }, [activeField, customStartTime, customEndTime])

  const scrollToPicker = () => {
    pickerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
    setPickerHighlight(true)
    setTimeout(() => setPickerHighlight(false), 700)
  }

  const toLocalFormat = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
  }

  // Update custom times when a slot is clicked
  const handleSelectSlot = (arg: { start: Date, end: Date }) => {
    setCustomStartTime(toLocalFormat(arg.start))
    setCustomEndTime(toLocalFormat(arg.end))
    setCalendarMonth(arg.start)
    setActiveField("start")
    setIsDialogOpen(true)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEventClick = (arg: { event: any }) => {
    if (arg.event.display === "background") return
    setSelectedEvent(arg.event)
    setIsEventDetailsOpen(true)
  }

  const handleConfirmBooking = () => {
    const start = new Date(customStartTime)
    const end = new Date(customEndTime)
    createMutation.mutate({
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      preparationTime: 0,
      purpose,
    })
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
    if (purpose.length > 255) {
      return toast.error("Purpose must be 255 characters or less.")
    }

    setIsConfirmDialogOpen(true)
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

      <Dialog 
        open={isDialogOpen} 
        onOpenChange={(open) => {
          if (!open && isConfirmDialogOpen) return
          setIsDialogOpen(open)
        }}
      >
        <DialogContent
          className="sm:max-w-[850px] p-0 overflow-hidden bg-white rounded-2xl shadow-xl border border-slate-100 gap-0"
          onInteractOutside={(e) => {
            if (isConfirmDialogOpen) {
              e.preventDefault()
            }
          }}
          onPointerDownOutside={(e) => {
            if (isConfirmDialogOpen) {
              e.preventDefault()
            }
          }}
          onEscapeKeyDown={(e) => {
            if (isConfirmDialogOpen) {
              e.preventDefault()
            }
          }}
        >
          <div className="p-6">
            <DialogTitle className="text-xl font-bold text-gray-950">Book Studio Room</DialogTitle>
            <p className="text-sm text-slate-500 mt-1">Reserve a time for your meeting.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 px-6 pb-6">
              {/* Left Column - Inputs */}
              <div className="lg:col-span-5 space-y-4">
                {/* Start Time */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Start Time</Label>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveField("start")
                      if (customStartTime) setCalendarMonth(new Date(customStartTime))
                      scrollToPicker()
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 bg-white border rounded-lg text-sm transition-all text-gray-955 font-semibold ${activeField === "start"
                      ? "border-blue-600 ring-2 ring-blue-500/20"
                      : "border-slate-200 hover:border-slate-300"
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="size-4 text-slate-400" />
                      <span>{customStartTime ? dayjs(customStartTime).format("MMM D, YYYY  h:mm A") : "Select start time"}</span>
                    </div>
                    <ChevronDown className="size-4 text-slate-400" />
                  </button>
                </div>

                {/* End Time */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">End Time</Label>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveField("end")
                      if (customEndTime) setCalendarMonth(new Date(customEndTime))
                      scrollToPicker()
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 bg-white border rounded-lg text-sm transition-all text-gray-955 font-semibold ${activeField === "end"
                      ? "border-blue-600 ring-2 ring-blue-500/20"
                      : "border-slate-200 hover:border-slate-300"
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="size-4 text-slate-400" />
                      <span>{customEndTime ? dayjs(customEndTime).format("MMM D, YYYY  h:mm A") : "Select end time"}</span>
                    </div>
                    <ChevronDown className="size-4 text-slate-400" />
                  </button>
                </div>

                {/* Purpose */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Meeting Purpose</Label>
                  <div className="relative">
                    <FileText className="absolute top-3.5 left-3.5 size-4 text-slate-400" />
                    <textarea
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      required
                      placeholder="E.g., Team Sync, Client Call, Project Planning..."
                      rows={4}
                      className={`w-full pl-10 pr-4 py-3 bg-white border rounded-lg text-sm font-medium text-gray-955 placeholder-slate-400 focus:outline-none resize-none transition-colors ${purpose.length > 255
                        ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        : "border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                        }`}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    {purpose.length > 255 ? (
                      <p className="text-xs text-red-500 font-medium">Purpose must be 255 characters or less.</p>
                    ) : (
                      <span />
                    )}
                    <span className={`text-xs font-medium ml-auto ${purpose.length > 255 ? "text-red-500" : "text-slate-400"
                      }`}>
                      {purpose.length}/255
                    </span>
                  </div>
                </div>

                {/* Prep Time
                {isAdmin && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Preparation Time (minutes)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={preparationTime}
                      onChange={e => setPreparationTime(e.target.value)}
                      required
                      className="bg-white border-slate-200 focus:border-blue-600 focus:ring-blue-600 rounded-lg text-sm font-semibold text-slate-900"
                    />
                    <p className="text-xs text-gray-500">Buffer time added after the meeting.</p>
                  </div>
                )} */}
              </div>

              {/* Right Column - Picker Widget */}
              <div
                ref={pickerRef}
                className={`lg:col-span-7 flex border rounded-xl overflow-hidden bg-white shadow-xs p-4 gap-4 justify-between h-[340px] transition-all duration-300 ${pickerHighlight ? "border-blue-400 ring-2 ring-blue-300/40" : "border-slate-100"}`}
              >
                {/* Calendar Side */}
                <div className="flex-1 select-none">
                  {/* Calendar Navigation Header */}
                  <div className="flex items-center justify-between mb-3 px-1">
                    <button
                      type="button"
                      onClick={() => setCalendarMonth(dayjs(calendarMonth).subtract(1, 'month').toDate())}
                      className="p-1 text-slate-400 hover:text-slate-950 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <ChevronLeft className="size-4" />
                    </button>
                    <span className="text-sm font-bold text-slate-800">
                      {dayjs(calendarMonth).format("MMMM YYYY")}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCalendarMonth(dayjs(calendarMonth).add(1, 'month').toDate())}
                      className="p-1 text-slate-400 hover:text-slate-950 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  </div>

                  {/* Weekdays */}
                  <div className="grid grid-cols-7 gap-1 text-center mb-1">
                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                      <span key={day} className="text-xs font-semibold text-slate-400">
                        {day}
                      </span>
                    ))}
                  </div>

                  {/* Days */}
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {(() => {
                      const startOfMonth = dayjs(calendarMonth).startOf('month')
                      const endOfMonth = dayjs(calendarMonth).endOf('month')
                      const startDayOfWeek = startOfMonth.day()
                      const daysList: dayjs.Dayjs[] = []

                      for (let i = startDayOfWeek - 1; i >= 0; i--) {
                        daysList.push(startOfMonth.subtract(i + 1, 'day'))
                      }
                      const totalDaysInMonth = startOfMonth.daysInMonth()
                      for (let i = 0; i < totalDaysInMonth; i++) {
                        daysList.push(startOfMonth.add(i, 'day'))
                      }
                      while (daysList.length < 42) {
                        daysList.push(endOfMonth.add(daysList.length - totalDaysInMonth - startDayOfWeek + 1, 'day'))
                      }

                      const activeDateStr = activeField === "start" ? customStartTime : customEndTime
                      const activeDateVal = dayjs(activeDateStr)

                      return daysList.map((day, idx) => {
                        const isCurrentMonth = day.month() === dayjs(calendarMonth).month()
                        const isSelected = day.isSame(activeDateVal, 'day')

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              const activeDate = activeField === "start" ? dayjs(customStartTime) : dayjs(customEndTime)
                              const newDate = day.hour(activeDate.hour()).minute(activeDate.minute())
                              const newDateStr = toLocalFormat(newDate.toDate())
                              if (activeField === "start") {
                                setCustomStartTime(newDateStr)
                              } else {
                                setCustomEndTime(newDateStr)
                              }
                            }}
                            className={`h-8 w-8 mx-auto flex items-center justify-center text-xs font-semibold rounded-full transition-all ${isSelected
                              ? "bg-blue-600 text-white font-bold"
                              : isCurrentMonth
                                ? "text-slate-900 hover:bg-slate-100 hover:text-slate-900"
                                : "text-slate-300 hover:bg-slate-55 hover:text-slate-400"
                              }`}
                          >
                            {day.date()}
                          </button>
                        )
                      })
                    })()}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const today = dayjs()
                      setCalendarMonth(today.toDate())
                      const activeDate = activeField === "start" ? dayjs(customStartTime) : dayjs(customEndTime)
                      const newDate = today.hour(activeDate.hour()).minute(activeDate.minute())
                      const newDateStr = toLocalFormat(newDate.toDate())
                      if (activeField === "start") {
                        setCustomStartTime(newDateStr)
                      } else {
                        setCustomEndTime(newDateStr)
                      }
                    }}
                    className="mt-3 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors block"
                  >
                    Today
                  </button>
                </div>

                {/* Vertical Divider */}
                <div className="w-[1px] bg-slate-100 self-stretch my-2 shrink-0" />

                {/* Time Picker Side */}
                {(() => {
                  const activeDateStr = activeField === "start" ? customStartTime : customEndTime
                  const activeDate = dayjs(activeDateStr)
                  const currentHour24 = activeDate.hour()
                  const currentMinute = activeDate.minute()
                  const isPM = currentHour24 >= 12
                  const currentHour12 = currentHour24 % 12 === 0 ? 12 : currentHour24 % 12

                  const handleHourSelect = (h12: number) => {
                    let newHour24 = h12
                    if (isPM && h12 !== 12) newHour24 += 12
                    if (!isPM && h12 === 12) newHour24 = 0
                    const newDate = activeDate.hour(newHour24)
                    const newDateStr = toLocalFormat(newDate.toDate())
                    if (activeField === "start") {
                      setCustomStartTime(newDateStr)
                    } else {
                      setCustomEndTime(newDateStr)
                    }
                  }

                  const handleMinuteSelect = (m: number) => {
                    const newDate = activeDate.minute(m)
                    const newDateStr = toLocalFormat(newDate.toDate())
                    if (activeField === "start") {
                      setCustomStartTime(newDateStr)
                    } else {
                      setCustomEndTime(newDateStr)
                    }
                  }

                  const handleAMPMSelect = (pm: boolean) => {
                    let newHour24 = currentHour12
                    if (pm && currentHour12 !== 12) newHour24 += 12
                    if (!pm && currentHour12 === 12) newHour24 = 0
                    const newDate = activeDate.hour(newHour24)
                    const newDateStr = toLocalFormat(newDate.toDate())
                    if (activeField === "start") {
                      setCustomStartTime(newDateStr)
                    } else {
                      setCustomEndTime(newDateStr)
                    }
                  }

                  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'))
                  const baseMinutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'))
                  const currentMinuteStr = currentMinute.toString().padStart(2, '0')
                  const minutes = baseMinutes.includes(currentMinuteStr)
                    ? baseMinutes
                    : [...baseMinutes, currentMinuteStr].sort((a, b) => parseInt(a, 10) - parseInt(b, 10))

                  return (
                    <div className="flex flex-col items-center select-none w-44 shrink-0">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Time</span>
                      <div className="flex items-center gap-1 mt-2 h-[220px]">
                        {/* Hours */}
                        <div className="flex flex-col items-center h-full">
                          <button
                            type="button"
                            onClick={() => {
                              const nextHour = currentHour12 === 1 ? 12 : currentHour12 - 1
                              handleHourSelect(nextHour)
                            }}
                            className="text-slate-400 hover:text-slate-600 p-1 transition-colors"
                          >
                            <ChevronUp className="size-4" />
                          </button>
                          <div ref={hourScrollRef} className="flex flex-col gap-1 my-1 overflow-y-auto max-h-[150px] w-10 py-1 scrollbar-none items-center">
                            {hours.map((h) => {
                              const isSelected = parseInt(h, 10) === currentHour12
                              return (
                                <button
                                  key={h}
                                  type="button"
                                  data-selected={isSelected ? "true" : "false"}
                                  onClick={() => handleHourSelect(parseInt(h, 10))}
                                  className={`w-8 h-8 flex items-center justify-center text-xs font-bold rounded-lg transition-colors shrink-0 ${isSelected
                                    ? "bg-blue-50 text-blue-600 border border-blue-200"
                                    : "text-slate-600 hover:bg-slate-50"
                                    }`}
                                >
                                  {h}
                                </button>
                              )
                            })}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const nextHour = currentHour12 === 12 ? 1 : currentHour12 + 1
                              handleHourSelect(nextHour)
                            }}
                            className="text-slate-400 hover:text-slate-600 p-1 transition-colors"
                          >
                            <ChevronDown className="size-4" />
                          </button>
                        </div>

                        {/* Separator */}
                        <span className="text-base font-bold text-slate-400 self-center -mt-2">:</span>

                        {/* Minutes */}
                        <div className="flex flex-col items-center h-full">
                          <button
                            type="button"
                            onClick={() => {
                              let nextMin = currentMinute - 5
                              if (nextMin < 0) nextMin = 55
                              handleMinuteSelect(nextMin)
                            }}
                            className="text-slate-400 hover:text-slate-600 p-1 transition-colors"
                          >
                            <ChevronUp className="size-4" />
                          </button>
                          <div ref={minuteScrollRef} className="flex flex-col gap-1 my-1 overflow-y-auto max-h-[150px] w-10 py-1 scrollbar-none items-center">
                            {minutes.map((m) => {
                              const isSelected = parseInt(m, 10) === currentMinute
                              return (
                                <button
                                  key={m}
                                  type="button"
                                  data-selected={isSelected ? "true" : "false"}
                                  onClick={() => handleMinuteSelect(parseInt(m, 10))}
                                  className={`w-8 h-8 flex items-center justify-center text-xs font-bold rounded-lg transition-colors shrink-0 ${isSelected
                                    ? "bg-blue-50 text-blue-600 border border-blue-200"
                                    : "text-slate-600 hover:bg-slate-55"
                                    }`}
                                >
                                  {m}
                                </button>
                              )
                            })}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              let nextMin = currentMinute + 5
                              if (nextMin >= 60) nextMin = 0
                              handleMinuteSelect(nextMin)
                            }}
                            className="text-slate-400 hover:text-slate-600 p-1 transition-colors"
                          >
                            <ChevronDown className="size-4" />
                          </button>
                        </div>

                        {/* AM/PM */}
                        <div className="flex flex-col border border-slate-200 rounded-lg overflow-hidden shrink-0 ml-1.5">
                          <button
                            type="button"
                            onClick={() => handleAMPMSelect(false)}
                            className={`px-2.5 py-1.5 text-xs font-bold transition-all ${!isPM ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
                              }`}
                          >
                            AM
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAMPMSelect(true)}
                            className={`px-2.5 py-1.5 text-xs font-bold border-t border-slate-200 transition-all ${isPM ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
                              }`}
                          >
                            PM
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="px-5 py-2 border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold text-sm bg-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-colors"
              >
                {createMutation.isPending ? "Submitting..." : "Done"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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

      <BookingConfirmDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={handleConfirmBooking}
        purpose={purpose}
        startTime={customStartTime}
        endTime={customEndTime}
        isPending={createMutation.isPending}
      />
    </div>
  )
}
