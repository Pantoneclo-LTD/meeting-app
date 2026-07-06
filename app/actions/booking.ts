"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import nodemailer from "nodemailer"
import type { Booking, User } from "@prisma/client"
import { env } from "@/lib/env"
import { APP_CONFIG } from "@/lib/config"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
dayjs.extend(utc)
dayjs.extend(timezone)
import { getBookingStatusEmailHtml, getNewBookingAdminEmailHtml } from "@/lib/email-templates"

const transport = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS
  }
})

const bookingSchema = z.object({
  startTime: z.string().datetime(), // Expected in UTC
  endTime: z.string().datetime(), // Expected in UTC
  preparationTime: z.number().int().min(0).default(10),
  purpose: z.string().min(2),
}).refine((data) => {
  const start = new Date(data.startTime)
  const now = new Date()
  now.setMinutes(now.getMinutes() - 1) // 1 min grace
  return start >= now
}, { message: "Cannot book a meeting in the past", path: ["startTime"] })
  .refine((data) => new Date(data.startTime) < new Date(data.endTime), {
    message: "End time must be after start time",
    path: ["endTime"]
  })

export async function createBooking(data: z.infer<typeof bookingSchema>) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const parsed = bookingSchema.parse(data)
  const newStart = new Date(parsed.startTime)
  const newEnd = new Date(parsed.endTime)
  const newEndWithPrep = new Date(newEnd.getTime() + parsed.preparationTime * 60000)

  // Friday check (0 = Sunday, 5 = Friday)
  if (dayjs(newStart).day() === 5 || dayjs(newEnd).day() === 5) {
    throw new Error("Cannot book a meeting on a Friday (Off Day)")
  }

  // Holiday check
  const startDateStr = dayjs(newStart).format('YYYY-MM-DD')
  const endDateStr = dayjs(newEnd).format('YYYY-MM-DD')
  if (APP_CONFIG.BANGLADESH_HOLIDAYS.includes(startDateStr) || APP_CONFIG.BANGLADESH_HOLIDAYS.includes(endDateStr)) {
    throw new Error("Cannot book a meeting on a Holiday")
  }

  // Find overlapping bookings
  await prisma.booking.findFirst({
    where: {
      status: {
        in: ["PENDING", "APPROVED"]
      },
      AND: [
        {
          startTime: {
            lt: newEndWithPrep
          }
        },
        // We need to check against (existing.endTime + existing.preparationTime)
        // Since we can't easily do math in prisma where clause, we fetch potential overlaps 
        // and filter in memory, or we can use raw query.
        // For simplicity, fetch all active bookings on that day and filter in JS.
      ]
    }
  })

  // To properly handle overlap with prep time, let's fetch all active bookings 
  // that start before newEndWithPrep and end after some time.
  const allActiveBookings = await prisma.booking.findMany({
    where: {
      status: {
        in: ["PENDING", "APPROVED"]
      },
      startTime: {
        lt: newEndWithPrep
      }
    }
  })

  const hasOverlap = allActiveBookings.some((booking: Booking) => {
    const existingStart = booking.startTime
    const existingEndWithPrep = new Date(booking.endTime.getTime() + booking.preparationTime * 60000)

    return newStart < existingEndWithPrep && newEndWithPrep > existingStart
  })

  if (hasOverlap) {
    throw new Error("The selected time slot overlaps with an existing booking or its preparation time.")
  }

  const booking = await prisma.booking.create({
    data: {
      startTime: newStart,
      endTime: newEnd,
      preparationTime: parsed.preparationTime,
      purpose: parsed.purpose,
      userId: session.user.id
    },
    include: {
      user: true
    }
  })

  // Send Email to Admins
  const admins = await prisma.user.findMany({
    where: { role: { in: ["ADMIN"] } }
  })

  if (admins.length > 0) {
    await prisma.notification.createMany({
      data: admins.map((admin: User) => ({
        userId: admin.id,
        message: `New booking request from ${session.user.name || 'User'} for ${parsed.purpose}.`,
        bookingId: booking.id
      }))
    })
  }

  if (admins.length > 0) {
    const emailPromises = admins.map((admin: User) => {
      const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/booking/bookings/${booking.id}`
      return transport.sendMail({
        from: env.SMTP_FROM,
        to: admin.email,
        subject: "New Meeting Room Booking Request",
        html: getNewBookingAdminEmailHtml(
          admin.name || "Admin",
          booking.user.name || "User",
          parsed.purpose,
          newStart,
          newEnd,
          bookingUrl
        )
      })
    })
    await Promise.allSettled(emailPromises)
  }

  revalidatePath('/booking')
  revalidatePath('/calendar')
  return booking
}

export async function updateBookingStatus(bookingId: string, status: "APPROVED" | "REJECTED" | "CANCELLED") {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { user: true }
  })
  if (!booking) throw new Error("Booking not found")

  // Only Admin/Superadmin can approve/reject. Users can only cancel their own.
  if (status === "CANCELLED") {
    if (booking.userId !== session.user.id && session.user.role === "USER") {
      throw new Error("Unauthorized")
    }
  } else {
    if (session.user.role === "USER") {
      throw new Error("Unauthorized")
    }
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status }
  })

  // Create in-app notification
  const notificationMsg = status === "APPROVED"
    ? `Your booking for "${booking.purpose}" was approved.`
    : status === "REJECTED"
      ? `Your booking for "${booking.purpose}" was rejected.`
      : `Your booking for "${booking.purpose}" was cancelled.`

  await prisma.notification.create({
    data: {
      userId: booking.userId,
      message: notificationMsg,
      bookingId: booking.id,
    }
  })


  // generate booking url
  const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/booking/bookings/${booking.id}`

  // Send email to user if status is APPROVED or REJECTED
  if ((status === "APPROVED" || status === "REJECTED") && booking.user.email) {
    const attachments: { filename: string, content: string, contentType: string }[] = []

    if (status === "APPROVED") {
      const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Meeting App//EN
BEGIN:VEVENT
UID:${booking.id}@meetingapp.local
DTSTAMP:${dayjs().utc().format('YYYYMMDDTHHmmss\\Z')}
DTSTART:${dayjs(booking.startTime).utc().format('YYYYMMDDTHHmmss\\Z')}
DTEND:${dayjs(booking.endTime).utc().format('YYYYMMDDTHHmmss\\Z')}
SUMMARY:${booking.purpose}
DESCRIPTION:Your meeting room booking has been approved.
END:VEVENT
END:VCALENDAR`

      attachments.push({
        filename: 'invite.ics',
        content: icsContent,
        contentType: 'text/calendar; charset="utf-8"; method=REQUEST'
      })
    }

    try {
      await transport.sendMail({
        from: env.SMTP_FROM,
        to: booking.user.email,
        subject: `Meeting Booking ${status === "APPROVED" ? "Approved" : "Rejected"}`,
        html: getBookingStatusEmailHtml(
          booking.user.name || "User",
          status,
          booking.purpose,
          booking.startTime,
          booking.endTime,
          bookingUrl
        ),
        attachments
      })
    } catch (e) {
      console.error("Failed to send status update email:", e)
    }
  }

  revalidatePath('/booking')
  revalidatePath('/calendar')
}

export async function getBookingsForCalendar(startStr: string, endStr: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const startDate = new Date(startStr)
  const endDate = new Date(endStr)

  const bookings = await prisma.booking.findMany({
    where: {
      startTime: {
        gte: startDate,
        lte: endDate,
      },
      status: {
        in: ["APPROVED", "PENDING"] // Show pending as well so user can see it's blocked
      }
    },
    include: {
      user: {
        select: { name: true, id: true }
      }
    }
  })

  return bookings.map((b: Booking & { user: { name: string, id: string } }) => {
    // Add preparation time to the visual event end time, or just show it separately
    const endWithPrep = new Date(b.endTime.getTime() + b.preparationTime * 60000)

    return {
      id: b.id,
      title: `${b.user.name} - ${b.purpose}`,
      start: b.startTime.toISOString(),
      end: b.endTime.toISOString(), // Standard end time
      extendedProps: {
        userId: b.userId,
        prepEnd: endWithPrep.toISOString(),
        status: b.status,
        purpose: b.purpose,
        owner: b.user.name
      },
      color: b.status === "PENDING" ? "#f59e0b" : "#10b981", // Orange vs Green
    }
  })
}

export async function deleteBooking(bookingId: string) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "SUPERADMIN") throw new Error("Unauthorized")

  await prisma.booking.delete({
    where: { id: bookingId }
  })

  revalidatePath('/booking')
  revalidatePath('/booking/manage-bookings')
  revalidatePath('/calendar')
}

export async function deleteBookings(bookingIds: string[]) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "SUPERADMIN") throw new Error("Unauthorized")

  await prisma.booking.deleteMany({
    where: {
      id: { in: bookingIds }
    }
  })

  revalidatePath('/booking')
  revalidatePath('/booking/manage-bookings')
  revalidatePath('/calendar')
}
