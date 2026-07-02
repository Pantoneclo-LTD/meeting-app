import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import { APP_CONFIG } from "@/lib/config"

dayjs.extend(utc)
dayjs.extend(timezone)

export const getBookingStatusEmailHtml = (
  userName: string,
  status: "APPROVED" | "REJECTED" | "CANCELLED",
  purpose: string,
  startTime: Date,
  endTime: Date,
  bookingUrl?: string
) => {
  const isApproved = status === "APPROVED"
  const title = isApproved ? "Booking Approved!" : `Booking ${status}`
  const color = isApproved ? "#10b981" : "#ef4444" // Green vs Red

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h2 style="color: ${color}; text-align: center; font-size: 24px;">${title}</h2>
      <p style="font-size: 16px; color: #374151;">Hello ${userName},</p>
      <p style="font-size: 16px; color: #374151;">Your meeting room booking request for <strong>"${purpose}"</strong> has been <strong>${status.toLowerCase()}</strong>.</p>
      
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Start Time:</strong> ${dayjs(startTime).tz("Asia/Dhaka").format('MMMM D, YYYY h:mm A')} BST</p>
        <p style="margin: 5px 0;"><strong>End Time:</strong> ${dayjs(endTime).tz("Asia/Dhaka").format('MMMM D, YYYY h:mm A')} BST</p>
      </div>

      ${bookingUrl ? `<div style="text-align: center; margin: 30px 0;"><a href="${bookingUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Booking Details</a></div>` : ''}

      ${isApproved ? '<p style="font-size: 16px; color: #374151;">We have attached a calendar invite (.ics) to this email. You can open it to add this meeting to your preferred calendar app!</p>' : ''}
      
      <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 30px;">
        Thank you,<br/>
        ${APP_CONFIG.SITE_NAME}
      </p>
    </div>
  `
}

export const getNewBookingAdminEmailHtml = (
  adminName: string,
  userName: string,
  purpose: string,
  startTime: Date,
  endTime: Date,
  bookingUrl: string
) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h2 style="color: #4f46e5; text-align: center; font-size: 24px;">New Booking Request</h2>
      <p style="font-size: 16px; color: #374151;">Hello ${adminName},</p>
      <p style="font-size: 16px; color: #374151;">A new meeting room booking request has been submitted by <strong>${userName}</strong> for <strong>"${purpose}"</strong>.</p>
      
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Start Time:</strong> ${dayjs(startTime).tz("Asia/Dhaka").format('MMMM D, YYYY h:mm A')} BST</p>
        <p style="margin: 5px 0;"><strong>End Time:</strong> ${dayjs(endTime).tz("Asia/Dhaka").format('MMMM D, YYYY h:mm A')} BST</p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${bookingUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Review Request</a>
      </div>
      
      <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 30px;">
        Thank you,<br/>
        ${APP_CONFIG.SITE_NAME}
      </p>
    </div>
  `
}

export const getReminderEmailHtml = (
  userName: string,
  purpose: string,
  startTime: Date,
  minutesLeft: number
) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h2 style="color: #f59e0b; text-align: center; font-size: 24px;">Meeting Reminder</h2>
      <p style="font-size: 16px; color: #374151;">Hello ${userName},</p>
      <p style="font-size: 16px; color: #374151;">This is a friendly reminder that your upcoming meeting <strong>"${purpose}"</strong> will start in <strong>${minutesLeft} minutes</strong>.</p>
      
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: center;">
        <h3 style="margin: 0; color: #111827;">${dayjs(startTime).tz("Asia/Dhaka").format('h:mm A')} BST</h3>
        <p style="margin: 5px 0 0 0; color: #6b7280;">Please prepare and arrive on time.</p>
      </div>

      <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 30px;">
        Thank you,<br/>
        ${APP_CONFIG.SITE_NAME}
      </p>
    </div>
  `
}
