"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import nodemailer from "nodemailer"
import { Booking, User } from "@prisma/client"
import { env } from "@/lib/env"

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
})

export async function createBooking(data: z.infer<typeof bookingSchema>) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const parsed = bookingSchema.parse(data)
  const newStart = new Date(parsed.startTime)
  const newEnd = new Date(parsed.endTime)
  const newEndWithPrep = new Date(newEnd.getTime() + parsed.preparationTime * 60000)

  if (newStart >= newEnd) {
    throw new Error("End time must be after start time")
  }

  // Find overlapping bookings
  const overlapping = await prisma.booking.findFirst({
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
    where: { role: "ADMIN" }
  })

  if (admins.length > 0) {
    const emailPromises = admins.map((admin: User) => 
      transport.sendMail({
        from: env.SMTP_FROM,
        to: admin.email,
        subject: "New Meeting Room Booking Request",
        text: `A new booking request has been submitted by ${booking.user.name} for ${parsed.purpose}. \n\nTime: ${newStart.toUTCString()} to ${newEnd.toUTCString()} \n\nPlease log in to approve or reject.`
      })
    )
    await Promise.allSettled(emailPromises)
  }

  revalidatePath('/dashboard')
  revalidatePath('/calendar')
  return booking
}

export async function updateBookingStatus(bookingId: string, status: "APPROVED" | "REJECTED" | "CANCELLED") {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } })
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

  revalidatePath('/dashboard')
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
    // If regular user and not their own booking, hide details
    const isOwner = b.userId === session.user.id
    const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPERADMIN"
    const canView = isOwner || isAdmin
    
    // Add preparation time to the visual event end time, or just show it separately
    const endWithPrep = new Date(b.endTime.getTime() + b.preparationTime * 60000)

    return {
      id: b.id,
      title: canView ? `${b.user.name} - ${b.purpose}` : 'Busy',
      start: b.startTime.toISOString(),
      end: b.endTime.toISOString(), // Standard end time
      extendedProps: {
        prepEnd: endWithPrep.toISOString(),
        status: b.status,
        purpose: canView ? b.purpose : null,
        owner: canView ? b.user.name : null
      },
      color: b.status === "PENDING" ? "#f59e0b" : "#10b981", // Orange vs Green
    }
  })
}
