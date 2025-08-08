"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Trophy, Medal, Award, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRefModeGuard } from "@/hooks/use-ref-mode-guard"

interface Standing {
  team_id: number
  team_name: string
  time: number
  rank: number
  disqualified?: boolean
}

interface StandingsReviewModalProps {
  isOpen: boolean
  onClose: () => void
  eventId: string
  onComplete: () => void
}

export function StandingsReviewModal({ isOpen, onClose, eventId, onComplete }: StandingsReviewModalProps) {
  const [standings, setStandings] = useState<Standing[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()
  const { guardRefModeAsync } = useRefModeGuard()

  useEffect(() => {
    if (isOpen) {
      fetchStandings()
    }
  }, [isOpen, eventId])

  const fetchStandings = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/events/${eventId}/calculate-standings`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch standings')
      }

      const data = await response.json()
      setStandings(data.standings)
    } catch (error) {
      console.error('Error fetching standings:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch standings",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleDisqualification = (teamId: number) => {
    const newStandings = [...standings]
    const teamIndex = newStandings.findIndex(standing => standing.team_id === teamId)
    
    if (teamIndex !== -1) {
      const team = newStandings[teamIndex]
      team.disqualified = !team.disqualified
      
      if (team.disqualified) {
        // Set disqualified team to last place (12th)
        team.rank = 12
      } else {
        // Re-insert based on time
        const insertIndex = newStandings.findIndex(s => !s.disqualified && s.time > team.time)
        if (insertIndex !== -1) {
          newStandings.splice(teamIndex, 1)
          newStandings.splice(insertIndex, 0, team)
        } else {
          newStandings.splice(teamIndex, 1)
          newStandings.unshift(team)
        }
      }
      
      // Recalculate ranks for non-disqualified teams
      let currentRank = 1
      newStandings.forEach((standing) => {
        if (!standing.disqualified) {
          standing.rank = currentRank
          currentRank++
        }
      })
      
      setStandings(newStandings)
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    const milliseconds = Math.floor((time % 1) * 100)
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`
  }

  const getRankIcon = (rank: number, disqualified?: boolean) => {
    if (disqualified) {
      return <XCircle className="h-5 w-5 text-red-500" />
    }
    
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />
      default:
        return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>
    }
  }

  const handleSubmit = async () => {
    try {
      await guardRefModeAsync(async () => {
        setSubmitting(true)
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/events/${eventId}/save-standings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ standings })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to save standings')
        }

        toast({
          title: "Success",
          description: "Event completed and standings saved successfully",
        })

        onComplete()
        onClose()
      }, "save event standings")
    } catch (error) {
      console.error('Error saving standings:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save standings",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Review Final Standings
          </DialogTitle>
          <DialogDescription>
            Review team rankings based on completion times. Rankings are automatically determined by finish times. You can only disqualify teams if needed.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3">
              {standings
                .sort((a, b) => a.rank - b.rank)
                .map((standing, index) => (
                <Card key={standing.team_id} className={`relative ${standing.disqualified ? 'border-red-200 bg-red-50' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {getRankIcon(standing.rank, standing.disqualified)}
                          <span className={`font-semibold ${standing.disqualified ? 'text-red-600 line-through' : ''}`}>
                            {standing.team_name}
                          </span>
                          {standing.disqualified && (
                            <Badge variant="destructive" className="text-xs">
                              DQ
                            </Badge>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {formatTime(standing.time)}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant={standing.disqualified ? "default" : "outline"}
                          onClick={() => toggleDisqualification(standing.team_id)}
                          className="h-8 px-2 text-xs"
                        >
                          {standing.disqualified ? "Reinstate" : "DQ"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Saving..." : "Complete Event & Save Standings"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 