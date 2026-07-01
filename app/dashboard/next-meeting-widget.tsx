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
    <Card className={`col-span-full shadow-lg overflow-hidden border-0 ${isAlert ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white' : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'}`}>
      <CardHeader className="pb-2 border-b border-white/20 bg-black/10">
        <CardTitle className="text-xl font-bold flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <span>Upcoming: {meeting.purpose}</span>
          </div>
          {isAlert && !isStarted && (
            <span className="text-xs bg-white text-red-600 px-3 py-1.5 rounded-full font-bold uppercase tracking-wider animate-pulse shadow-md">
              Starting Soon
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-2">
          <div className="flex flex-col">
            <span className="text-sm text-white/70 font-medium uppercase tracking-wider">Start Time</span>
            <span className="text-2xl font-bold">{startTime.format('h:mm A')}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-sm text-white/70 font-medium uppercase tracking-wider">Status</span>
            <span className="text-lg font-semibold bg-black/20 px-4 py-1 rounded-full backdrop-blur-sm">{statusText}</span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-sm text-white/70 font-medium uppercase tracking-wider">End Time</span>
            <span className="text-2xl font-bold">{endTime.format('h:mm A')}</span>
          </div>
        </div>
        
        {/* Interactive Progress Bar with Popover */}
        <div className="relative group cursor-help mt-6">
          {/* Custom Popover */}
          <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200 bottom-full left-1/2 -translate-x-1/2 mb-3 w-72 p-4 bg-white text-gray-900 text-sm rounded-lg shadow-2xl pointer-events-none z-10 flex flex-col space-y-2 border">
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 border-8 border-transparent border-t-white drop-shadow-md" />
            <p><span className="text-gray-500 font-semibold">Name:</span> <span className="font-medium">{meeting.user?.name || "Unknown"}</span></p>
            <p><span className="text-gray-500 font-semibold">Purpose:</span> <span className="font-medium">{meeting.purpose}</span></p>
            <div className="h-px bg-gray-100 my-1"></div>
            <p><span className="text-gray-500 font-semibold">Start:</span> {startTime.format('MMM D, YYYY h:mm A')}</p>
            <p><span className="text-gray-500 font-semibold">End:</span> {endTime.format('MMM D, YYYY h:mm A')}</p>
          </div>

          <div className="h-6 w-full bg-black/10 rounded-full overflow-hidden border border-white/20 backdrop-blur-sm shadow-inner">
            <div 
              className={`h-full transition-all duration-1000 ease-linear ${isStarted ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'bg-white/40'}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
        {!isStarted && !isEnded && (
          <p className="text-sm text-white/70 mt-3 text-center font-medium">
            The progress bar will fill once the meeting begins.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
