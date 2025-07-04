"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

// Fixed colors for each team position
const TEAM_COLORS = [
    { name: 'Blue', value: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },    // Team 1
    { name: 'Green', value: '#10b981', bg: '#ecfdf5', border: '#a7f3d0' },   // Team 2
    { name: 'Yellow', value: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },  // Team 3
    { name: 'Purple', value: '#8b5cf6', bg: '#faf5ff', border: '#c4b5fd' },  // Team 4
]

interface TeamTimerProps {
  teamName: string
  onTimeSubmit: (time: number) => void
  isRunning: boolean
  startTime: number | null
  onStop: () => void
  teamColor?: typeof TEAM_COLORS[0]
}

export function TeamTimer({ 
  teamName, 
  onTimeSubmit, 
  isRunning, 
  startTime, 
  onStop,
  teamColor = TEAM_COLORS[0]
}: TeamTimerProps) {
  const [time, setTime] = useState<number>(0)
  const [displayTime, setDisplayTime] = useState<number>(0)

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isRunning && startTime) {
      interval = setInterval(() => {
        const elapsedTime = (Date.now() - startTime) / 1000
        setDisplayTime(elapsedTime)
      }, 10) // Update every 10ms for smooth display
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isRunning, startTime])

  const handleStop = () => {
    const finalTime = displayTime
    setTime(finalTime)
    onTimeSubmit(finalTime)
    onStop()
  }

  return (
    <Card style={{ 
      backgroundColor: teamColor.bg,
      borderColor: teamColor.border,
      borderWidth: '2px'
    }}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="font-medium" style={{ color: teamColor.value }}>
            {teamName}
          </div>
          <div className="text-2xl font-bold" style={{ color: teamColor.value }}>
            {displayTime.toFixed(2)}s
          </div>
          <div className="flex gap-2">
            {isRunning ? (
              <Button 
                onClick={handleStop} 
                variant="destructive"
                style={{ 
                  backgroundColor: teamColor.value,
                  borderColor: teamColor.value,
                  color: 'white'
                }}
              >
                Stop Timer
              </Button>
            ) : (
              <Input
                type="number"
                value={time}
                onChange={(e) => {
                  const newTime = Number(e.target.value)
                  setTime(newTime)
                  onTimeSubmit(newTime)
                }}
                step="0.01"
                className="w-24"
                style={{ borderColor: teamColor.border }}
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
