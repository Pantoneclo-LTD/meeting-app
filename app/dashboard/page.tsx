import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  let totalBookings = 0
  let pendingBookings = 0
  let totalUsers = 0

  if (session.user.role === "SUPERADMIN") {
    totalBookings = await prisma.booking.count()
    pendingBookings = await prisma.booking.count({ where: { status: "PENDING" } })
    totalUsers = await prisma.user.count()
  } else if (session.user.role === "ADMIN") {
    totalBookings = await prisma.booking.count()
    pendingBookings = await prisma.booking.count({ where: { status: "PENDING" } })
  } else {
    totalBookings = await prisma.booking.count({ where: { userId: session.user.id } })
    pendingBookings = await prisma.booking.count({ where: { userId: session.user.id, status: "PENDING" } })
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session.user.name} ({session.user.role}).
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBookings}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingBookings}</div>
          </CardContent>
        </Card>

        {session.user.role === "SUPERADMIN" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
