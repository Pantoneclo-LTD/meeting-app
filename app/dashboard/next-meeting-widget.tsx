"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import dayjs from "dayjs"
import { Clock } from "lucide-react"

type NextMeetingProps = {
  meeting: {
    purpose: string
    startTime: string
    endTime: string
    user?: { name: string }
  } | null
}

export function NextMeetingWidget({ meeting }: NextMeetingProps) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    if (!meeting) return
    const interval = setInterval(() => {
      setNow(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [meeting])

  if (!meeting) {
    return (
      <Card className="col-span-full md:col-span-2 lg:col-span-3 bg-gray-50 border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center p-8 text-gray-500">
          <Clock className="h-8 w-8 mb-4 text-gray-400" />
          <p>No upcoming meetings found.</p>
        </CardContent>
      </Card>
    )
  }

  const startTime = dayjs(meeting.startTime)
  const endTime = dayjs(meeting.endTime)
  const totalDuration = endTime.diff(startTime)
  
  // Calculate time until meeting starts
  const timeUntilStart = startTime.diff(dayjs(now))
  const isStarted = timeUntilStart <= 0
  
  // Calculate time remaining in meeting (if started)
  const timeRemainingInMeeting = endTime.diff(dayjs(now))
  const isEnded = timeRemainingInMeeting <= 0

  let statusText = ""
  let progressPercent = 0
  let isAlert = false

  if (isEnded) {
    statusText = "Meeting has ended."
    progressPercent = 100
  } else if (isStarted) {
    const elapsed = dayjs(now).diff(startTime)
    progressPercent = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100))
    const minutesLeft = Math.floor(timeRemainingInMeeting / 60000)
    const secondsLeft = Math.floor((timeRemainingInMeeting % 60000) / 1000)
    statusText = `In progress. Ends in ${minutesLeft}m ${secondsLeft}s`
  } else {
    // Not started yet
    const hoursLeft = Math.floor(timeUntilStart / 3600000)
    const minutesLeft = Math.floor((timeUntilStart % 3600000) / 60000)
    const secondsLeft = Math.floor((timeUntilStart % 60000) / 1000)
    
    if (hoursLeft > 0) {
      statusText = `Starts in ${hoursLeft}h ${minutesLeft}m`
    } else {
      statusText = `Starts in ${minutesLeft}m ${secondsLeft}s`
      if (minutesLeft < 15) {
        isAlert = true // Less than 15 minutes alert
      }
    }
  }

  return (
    <Card className={`col-span-full md:col-span-2 lg:col-span-3 shadow-md ${isAlert ? 'border-orange-500' : ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className={`h-5 w-5 ${isAlert ? 'text-orange-500' : 'text-blue-500'}`} />
            <span>Next Meeting: {meeting.purpose}</span>
          </div>
          {isAlert && !isStarted && (
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-bold animate-pulse">
              Starting Soon
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between text-sm mb-2 text-gray-600">
          <span>{startTime.format('h:mm A')}</span>
          <span className="font-medium text-gray-900">{statusText}</span>
          <span>{endTime.format('h:mm A')}</span>
        </div>
        
        {/* Interactive Progress Bar with Popover */}
        <div className="relative group cursor-help">
          {/* Custom Popover */}
          <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200 bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-4 bg-gray-900 text-white text-sm rounded shadow-xl pointer-events-none z-10 flex flex-col space-y-1">
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900" />
            <p><span className="text-gray-400 font-semibold">Name:</span> {meeting.user?.name || "Unknown"}</p>
            <p><span className="text-gray-400 font-semibold">Purpose:</span> {meeting.purpose}</p>
            <p><span className="text-gray-400 font-semibold">Start:</span> {startTime.format('MMM D, YYYY h:mm A')}</p>
            <p><span className="text-gray-400 font-semibold">End:</span> {endTime.format('MMM D, YYYY h:mm A')}</p>
          </div>

          <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden border">
            <div 
              className={`h-full transition-all duration-1000 ease-linear ${isStarted ? 'bg-blue-500' : 'bg-gray-300'}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
        {!isStarted && !isEnded && (
          <p className="text-xs text-gray-400 mt-2 text-center">
            The progress bar will fill once the meeting begins.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
