"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ScoreInputProps {
  teamId: string
  teamName: string
  currentScore?: number
  onScoreSubmit: (teamId: string, score: number) => void
  disabled?: boolean
}

export function ScoreInput({ teamId, teamName, currentScore = 0, onScoreSubmit, disabled = false }: ScoreInputProps) {
  const [score, setScore] = useState(currentScore.toString())
  const [isEditing, setIsEditing] = useState(false)

  const handleSubmit = () => {
    const numScore = Number.parseInt(score)
    if (!isNaN(numScore) && numScore >= 0) {
      onScoreSubmit(teamId, numScore)
      setIsEditing(false)
    }
  }

  return (
    <div className="flex flex-col space-y-2">
      <Label htmlFor={`score-${teamId}`}>{teamName}</Label>
      <div className="flex items-center space-x-2">
        {isEditing ? (
          <>
            <Input
              id={`score-${teamId}`}
              type="number"
              min="0"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              className="w-20"
              disabled={disabled}
            />
            <Button size="sm" onClick={handleSubmit} disabled={disabled}>
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={() => setIsEditing(false)} disabled={disabled}>
              Cancel
            </Button>
          </>
        ) : (
          <>
            <div className="w-20 h-10 flex items-center justify-center border rounded-md">{currentScore}</div>
            <Button size="sm" onClick={() => setIsEditing(true)} disabled={disabled}>
              Edit
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
