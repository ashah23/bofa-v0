"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatTime } from "@/lib/data"

interface TeamTimerProps {
  teamId: string
  teamName: string
  isRunning: boolean
  onStop: (teamId: string, time: number) => void
  finishedTime?: number
}

export function TeamTimer({ teamId, teamName, isRunning, onStop, finishedTime }: TeamTimerProps) {
  const [isStopped, setIsStopped] = useState(finishedTime !== undefined)

  const handleStop = () => {
    if (!isRunning) return
    setIsStopped(true)
    onStop(teamId, Date.now())
  }

  return (
    <Card className={`${isStopped ? "bg-muted/50" : ""}`}>
      <CardHeader className="pb-2">
        <CardTitle>{teamName}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <div>
            {finishedTime !== undefined ? (
              <div className="font-mono text-lg">{formatTime(finishedTime)}</div>
            ) : (
              <div className="font-mono text-lg">--:--:--</div>
            )}
          </div>
          <Button
            onClick={handleStop}
            disabled={!isRunning || isStopped}
            variant={isStopped ? "outline" : "destructive"}
            size="sm"
          >
            {isStopped ? "Finished" : "Stop"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
