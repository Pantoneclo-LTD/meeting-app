import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { NextMeetingWidget } from "./next-meeting-widget"
import { DashboardCharts } from "./dashboard-charts"
import { PastEventsList } from "./past-events-list"
import { UpcomingBookingsList } from "./upcoming-bookings-list"
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
  let cancelledBookings = 0
  let totalUsers = 0

  if (session.user.role === "SUPERADMIN" || session.user.role === "ADMIN") {
    totalBookings = await prisma.booking.count()
    pendingBookings = await prisma.booking.count({ where: { status: "PENDING" } })
    approvedBookings = await prisma.booking.count({ where: { status: "APPROVED" } })
    rejectedBookings = await prisma.booking.count({ where: { status: "REJECTED" } })
    cancelledBookings = await prisma.booking.count({ where: { status: "CANCELLED" } })
    if (session.user.role === "SUPERADMIN") {
      totalUsers = await prisma.user.count()
    }
  } else {
    totalBookings = await prisma.booking.count({ where: { userId: session.user.id } })
    pendingBookings = await prisma.booking.count({ where: { userId: session.user.id, status: "PENDING" } })
    approvedBookings = await prisma.booking.count({ where: { userId: session.user.id, status: "APPROVED" } })
    rejectedBookings = await prisma.booking.count({ where: { userId: session.user.id, status: "REJECTED" } })
    cancelledBookings = await prisma.booking.count({ where: { userId: session.user.id, status: "CANCELLED" } })
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

  const isAdmin = session.user.role === "SUPERADMIN" || session.user.role === "ADMIN"

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let serializedUpcomingEvents: any[] = []

  if (isAdmin) {
    const upcomingEvents = await prisma.booking.findMany({
      where: {
        startTime: { gt: new Date() }
      },
      take: 5,
      orderBy: { startTime: 'asc' },
      select: {
        id: true,
        purpose: true,
        startTime: true,
        endTime: true,
        status: true,
        user: { select: { name: true, email: true } }
      }
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    serializedUpcomingEvents = upcomingEvents.map((e: any) => ({
      ...e,
      startTime: e.startTime.toISOString(),
      endTime: e.endTime.toISOString(),
    }))
  }

  const chartData = [
    { name: "Approved", value: approvedBookings, color: "bg-emerald-500" },
    { name: "Pending", value: pendingBookings, color: "bg-amber-500" },
    { name: "Rejected", value: rejectedBookings, color: "bg-rose-500" },
    { name: "Cancelled", value: cancelledBookings, color: "bg-gray-400" },
  ]

  const redirectBase = isAdmin ? "/dashboard/manage-bookings" : "/dashboard/bookings"

  return (
    <div className="p-8 space-y-8 bg-gray-50/50 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-lg">
            Welcome back, {session.user.name}.
          </p>
        </div>
        <div>
          <Link
            href="/dashboard/calendar"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#5B3EFA] to-[#AF2DF4] hover:opacity-95 text-white font-extrabold text-sm rounded-lg shadow-md transition-all tracking-wide"
          >
            <span className="text-lg font-black leading-none">+</span>
            <span>BOOK STUDIO</span>
          </Link>
        </div>
      </div>

      <NextMeetingWidget meeting={serializedNextMeeting} />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 xl:grid-cols-6">
        <Link href={redirectBase} className="block transition-all hover:-translate-y-0.5 hover:shadow-md rounded-xl">
          <Card className="h-full shadow-sm border-0 bg-white ring-1 ring-gray-100/80">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-500">Total Bookings</CardTitle>
              <BookMarked className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-gray-900">{totalBookings}</div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`${redirectBase}?status=PENDING`} className="block transition-all hover:-translate-y-0.5 hover:shadow-md rounded-xl">
          <Card className="h-full shadow-sm border-0 bg-white ring-1 ring-gray-100/80">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-500">Pending Approvals</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-gray-900">{pendingBookings}</div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`${redirectBase}?status=APPROVED`} className="block transition-all hover:-translate-y-0.5 hover:shadow-md rounded-xl">
          <Card className="h-full shadow-sm border-0 bg-white ring-1 ring-gray-100/80">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-500">Approved</CardTitle>
              <CalendarCheck className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-gray-900">{approvedBookings}</div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`${redirectBase}?status=REJECTED`} className="block transition-all hover:-translate-y-0.5 hover:shadow-md rounded-xl">
          <Card className="h-full shadow-sm border-0 bg-white ring-1 ring-gray-100/80">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-500">Rejected</CardTitle>
              <CalendarCheck className="h-4 w-4 text-rose-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-gray-900">{rejectedBookings}</div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`${redirectBase}?status=CANCELLED`} className="block transition-all hover:-translate-y-0.5 hover:shadow-md rounded-xl">
          <Card className="h-full shadow-sm border-0 bg-white ring-1 ring-gray-100/80">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-500">Cancelled</CardTitle>
              <CalendarCheck className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-gray-900">{cancelledBookings}</div>
            </CardContent>
          </Card>
        </Link>

        {session.user.role === "SUPERADMIN" && (
          <Link href="/dashboard/users" className="block transition-all hover:-translate-y-0.5 hover:shadow-md rounded-xl">
            <Card className="h-full shadow-sm border-0 bg-white ring-1 ring-gray-100/80">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-gray-500">Total Users</CardTitle>
                <Users className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-gray-900">{totalUsers}</div>
              </CardContent>
            </Card>
          </Link>
        )}
      </div>

      <DashboardCharts data={chartData} title="Bookings Summary" />

      {isAdmin && (
        <UpcomingBookingsList bookings={serializedUpcomingEvents} />
      )}

      <PastEventsList events={serializedPastEvents} />
    </div>
  )
}
