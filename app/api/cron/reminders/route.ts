import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { env } from "@/lib/env"
import nodemailer from "nodemailer"
import { getReminderEmailHtml } from "@/lib/email-templates"

type ReminderBooking = {
  id: string
  purpose: string
  startTime: Date
  user: {
    name: string
    email: string
  }
}

const transport = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS
  }
})

// This route should be triggered via Cron every 1 minute
export async function GET() {
  try {
    const now = new Date()
    // Calculate windows for 15m and 30m reminders
    const in30MinsMin = new Date(now.getTime() + 29 * 60000)
    const in30MinsMax = new Date(now.getTime() + 31 * 60000)

    const in15MinsMin = new Date(now.getTime() + 14 * 60000)
    const in15MinsMax = new Date(now.getTime() + 16 * 60000)

    // 1. Fetch bookings for 30 min reminder
    const bookings30 = await prisma.$queryRaw<ReminderBooking[]>`
      SELECT b.id, b.purpose, b."startTime",
             json_build_object('name', u.name, 'email', u.email) as user
      FROM "Booking" b
      JOIN "User" u ON b."userId" = u.id
      WHERE b.status = 'APPROVED'
        AND b."reminder30Sent" = false
        AND b."startTime" >= ${in30MinsMin}
        AND b."startTime" <= ${in30MinsMax}
    `

    for (const booking of bookings30) {
      if (!booking.user?.email) continue
      try {
        await transport.sendMail({
          from: env.SMTP_FROM,
          to: booking.user.email,
          subject: `Meeting Reminder: ${booking.purpose} starts in 30 minutes`,
          html: getReminderEmailHtml(booking.user.name, booking.purpose, booking.startTime, 30)
        })
        
        await prisma.$executeRaw`
          UPDATE "Booking"
          SET "reminder30Sent" = true
          WHERE id = ${booking.id}
        `
      } catch (err) {
        console.error(`Failed to send 30m reminder to ${booking.user.email}`, err)
      }
    }

    // 2. Fetch bookings for 15 min reminder
    const bookings15 = await prisma.$queryRaw<ReminderBooking[]>`
      SELECT b.id, b.purpose, b."startTime",
             json_build_object('name', u.name, 'email', u.email) as user
      FROM "Booking" b
      JOIN "User" u ON b."userId" = u.id
      WHERE b.status = 'APPROVED'
        AND b."reminder15Sent" = false
        AND b."startTime" >= ${in15MinsMin}
        AND b."startTime" <= ${in15MinsMax}
    `

    for (const booking of bookings15) {
      if (!booking.user?.email) continue
      try {
        await transport.sendMail({
          from: env.SMTP_FROM,
          to: booking.user.email,
          subject: `Meeting Reminder: ${booking.purpose} starts in 15 minutes`,
          html: getReminderEmailHtml(booking.user.name, booking.purpose, booking.startTime, 15)
        })
        
        await prisma.$executeRaw`
          UPDATE "Booking"
          SET "reminder15Sent" = true
          WHERE id = ${booking.id}
        `
      } catch (err) {
        console.error(`Failed to send 15m reminder to ${booking.user.email}`, err)
      }
    }

    return NextResponse.json({
      success: true,
      sent30: bookings30.length,
      sent15: bookings15.length
    })
  } catch (error) {
    console.error("Cron Reminder Error:", error)
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 })
  }
}
