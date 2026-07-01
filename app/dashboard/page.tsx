import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { NextMeetingWidget } from "./next-meeting-widget"
import { DashboardCharts } from "./dashboard-charts"
import { PastEventsList } from "./past-events-list"
import { Users, CalendarCheck, Clock, BookMarked } from "lucide-react"

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  let totalBookings = 0
  let pendingBookings = 0
  let approvedBookings = 0
  let rejectedBookings = 0
  let totalUsers = 0

  if (session.user.role === "SUPERADMIN" || session.user.role === "ADMIN") {
    totalBookings = await prisma.booking.count()
    pendingBookings = await prisma.booking.count({ where: { status: "PENDING" } })
    approvedBookings = await prisma.booking.count({ where: { status: "APPROVED" } })
    rejectedBookings = await prisma.booking.count({ where: { status: { in: ["REJECTED", "CANCELLED"] } } })
    if (session.user.role === "SUPERADMIN") {
      totalUsers = await prisma.user.count()
    }
  } else {
    totalBookings = await prisma.booking.count({ where: { userId: session.user.id } })
    pendingBookings = await prisma.booking.count({ where: { userId: session.user.id, status: "PENDING" } })
    approvedBookings = await prisma.booking.count({ where: { userId: session.user.id, status: "APPROVED" } })
    rejectedBookings = await prisma.booking.count({ where: { userId: session.user.id, status: { in: ["REJECTED", "CANCELLED"] } } })
  }

  // Fetch next upcoming meeting for the user
  const nextMeeting = await prisma.booking.findFirst({
    where: {
      userId: session.user.id,
      status: "APPROVED",
      endTime: { gt: new Date() } // Still ongoing or in future
    },
    orderBy: { startTime: 'asc' },
    select: { 
      purpose: true, 
      startTime: true, 
      endTime: true,
      user: { select: { name: true } }
    }
  })
  
  const serializedNextMeeting = nextMeeting ? {
    ...nextMeeting,
    startTime: nextMeeting.startTime.toISOString(),
    endTime: nextMeeting.endTime.toISOString(),
  } : null

  // Fetch past events
  const pastEvents = await prisma.booking.findMany({
    where: {
      endTime: { lt: new Date() },
      ...(session.user.role === "USER" ? { userId: session.user.id } : {}) // Admin sees all, User sees their own
    },
    take: 10,
    orderBy: { endTime: 'desc' },
    select: {
      id: true,
      purpose: true,
      startTime: true,
      endTime: true,
      status: true,
      user: { select: { name: true } }
    }
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serializedPastEvents = pastEvents.map((e: any) => ({
    ...e,
    startTime: e.startTime.toISOString(),
    endTime: e.endTime.toISOString(),
  }))

  const chartData = [
    { name: "Approved", value: approvedBookings, color: "bg-green-500" },
    { name: "Pending", value: pendingBookings, color: "bg-yellow-500" },
    { name: "Rejected/Cancelled", value: rejectedBookings, color: "bg-red-500" },
  ]

  return (
    <div className="p-8 space-y-8 bg-gray-50/50 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-lg">
          Welcome back, {session.user.name}.
        </p>
      </div>

      <NextMeetingWidget meeting={serializedNextMeeting} />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-0 bg-white ring-1 ring-gray-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-500">Total Bookings</CardTitle>
            <BookMarked className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{totalBookings}</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-0 bg-white ring-1 ring-gray-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-500">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{pendingBookings}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0 bg-white ring-1 ring-gray-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-500">Approved</CardTitle>
            <CalendarCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{approvedBookings}</div>
          </CardContent>
        </Card>

        {session.user.role === "SUPERADMIN" && (
          <Card className="shadow-sm border-0 bg-white ring-1 ring-gray-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-500">Total Users</CardTitle>
              <Users className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{totalUsers}</div>
            </CardContent>
          </Card>
        )}
      </div>

      <DashboardCharts data={chartData} title="Bookings Summary" />
      
      <PastEventsList events={serializedPastEvents} />
    </div>
  )
}
