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
import { AppSidebar } from "@/components/app-sidebar"
import { Header } from "@/components/header"
import dayjs from "dayjs"

export default function CalendarPage() {
  const queryClient = useQueryClient()
  const [dateRange, setDateRange] = useState({ start: new Date().toISOString(), end: new Date().toISOString() })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date, end: Date } | null>(null)
  const [purpose, setPurpose] = useState("")
  const [preparationTime, setPreparationTime] = useState("10")

  const { data: bookings = [] } = useQuery({
    queryKey: ["bookings", dateRange],
    queryFn: () => getBookingsForCalendar(dateRange.start, dateRange.end),
  })

  const createMutation = useMutation({
    mutationFn: createBooking,
    onSuccess: () => {
      toast.success("Booking request submitted successfully.")
      queryClient.invalidateQueries({ queryKey: ["bookings"] })
      setIsDialogOpen(false)
      setPurpose("")
      setPreparationTime("10")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create booking")
    }
  })

  const handleDatesSet = (arg: { startStr: string, endStr: string }) => {
    setDateRange({ start: arg.startStr, end: arg.endStr })
  }

  const handleSelect = (arg: { start: Date, end: Date }) => {
    setSelectedSlot({ start: arg.start, end: arg.end })
    setIsDialogOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSlot) return

    createMutation.mutate({
      startTime: selectedSlot.start.toISOString(),
      endTime: selectedSlot.end.toISOString(),
      preparationTime: parseInt(preparationTime, 10) || 10,
      purpose,
    })
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <div className="flex-1 flex flex-col pl-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
          <div className="bg-white p-4 rounded-lg shadow-sm border h-full flex flex-col">
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
                events={bookings}
                selectable={true}
                selectMirror={true}
                dayMaxEvents={true}
                datesSet={handleDatesSet}
                select={handleSelect}
                height="100%"
                allDaySlot={false}
                slotMinTime="08:00:00"
                slotMaxTime="20:00:00"
              />
            </div>
          </div>
        </main>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book Meeting Room</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {selectedSlot && (
              <div className="text-sm text-gray-500 mb-4 bg-gray-50 p-3 rounded">
                <strong>Time:</strong> {dayjs(selectedSlot.start).format('MMM D, YYYY h:mm A')} - {dayjs(selectedSlot.end).format('h:mm A')}
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Meeting Purpose</Label>
              <Input 
                value={purpose} 
                onChange={e => setPurpose(e.target.value)} 
                required 
                placeholder="E.g., Team Sync, Client Call"
              />
            </div>

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

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Submitting..." : "Book Room"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
