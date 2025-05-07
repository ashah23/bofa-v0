"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { formatTime } from "@/lib/data"

interface TimerProps {
  isRunning: boolean
  onStart: () => void
  onStop: (time: number) => void
  onReset: () => void
}

export function Timer({ isRunning, onStart, onStop, onReset }: TimerProps) {
  const [time, setTime] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime((prevTime) => prevTime + 0.1)
      }, 100)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning])

  const handleStart = () => {
    onStart()
  }

  const handleStop = () => {
    onStop(time)
  }

  const handleReset = () => {
    setTime(0)
    onReset()
  }

  return (
    <Card className="p-4 flex flex-col items-center">
      <div className="text-4xl font-mono mb-4">{formatTime(time)}</div>
      <div className="flex gap-2">
        {!isRunning ? (
          <Button onClick={handleStart} disabled={isRunning}>
            Start
          </Button>
        ) : (
          <Button onClick={handleStop} variant="destructive">
            Stop
          </Button>
        )}
        <Button onClick={handleReset} variant="outline" disabled={isRunning && time > 0}>
          Reset
        </Button>
      </div>
    </Card>
  )
}
