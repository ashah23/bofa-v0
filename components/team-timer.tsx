"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

interface TeamTimerProps {
  teamName: string
  onTimeSubmit: (time: number) => void
  isRunning: boolean
  startTime: number | null
  onStop: () => void
}

export function TeamTimer({ teamName, onTimeSubmit, isRunning, startTime, onStop }: TeamTimerProps) {
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
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="font-medium">{teamName}</div>
          <div className="text-2xl font-bold">{displayTime.toFixed(2)}s</div>
          <div className="flex gap-2">
            {isRunning ? (
              <Button onClick={handleStop} variant="destructive">
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
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
