"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Medal, Award, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRefModeGuard } from "@/hooks/use-ref-mode-guard"
import Link from "next/link"

interface TeamStanding {
  rank: number
  teamId: number
  teamName: string
  disqualified?: boolean
}

interface DoubleEliminationStandingsReviewModalProps {
  isOpen: boolean
  onClose: () => void
  eventId: string
  onComplete: () => void
  initialStandings: TeamStanding[]
}

export function DoubleEliminationStandingsReviewModal({ 
  isOpen, 
  onClose, 
  eventId, 
  onComplete, 
  initialStandings 
}: DoubleEliminationStandingsReviewModalProps) {
  const [standings, setStandings] = useState<TeamStanding[]>([])
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()
  const { guardRefModeAsync } = useRefModeGuard()

  useEffect(() => {
    if (isOpen) {
      if (initialStandings.length > 0) {
        setStandings(initialStandings.map(standing => ({
          ...standing,
          disqualified: false
        })))
      } else {
        setStandings([])
      }
    }
  }, [isOpen, initialStandings])

  const toggleDisqualification = (teamId: number) => {
    const newStandings = [...standings]
    const teamIndex = newStandings.findIndex(standing => standing.teamId === teamId)

    if (teamIndex !== -1) {
      const team = newStandings[teamIndex]
      team.disqualified = !team.disqualified

      if (team.disqualified) {
        // Move disqualified team to the end
        newStandings.splice(teamIndex, 1)
        newStandings.push(team)
        team.rank = newStandings.length
      } else {
        // Move team back to their original position based on rank
        newStandings.splice(teamIndex, 1)
        const insertIndex = newStandings.findIndex(s => !s.disqualified && s.rank > team.rank)
        if (insertIndex !== -1) {
          newStandings.splice(insertIndex, 0, team)
        } else {
          newStandings.unshift(team)
        }
      }

      // Recalculate ranks for non-disqualified teams
      let currentRank = 1
      newStandings.forEach((team) => {
        if (!team.disqualified) {
          team.rank = currentRank
          currentRank++
        }
      })

      setStandings(newStandings)
    }
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
    if (standings.length === 0) {
      toast({
        title: "Error",
        description: "No standings available to save",
        variant: "destructive"
      })
      return
    }

    try {
      await guardRefModeAsync(async () => {
        setSubmitting(true)

        // Prepare standings data in the correct format for save-standings endpoint
        const standingsData = standings.map(standing => ({
          team_id: standing.teamId,
          rank: standing.rank,
          disqualified: standing.disqualified || false
        }))

        // Use the save-standings endpoint which properly handles disqualifications and points
        const response = await fetch(`/api/events/${eventId}/save-standings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ standings: standingsData })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to complete tournament')
        }

        toast({
          title: "Success",
          description: "Tournament completed and standings saved successfully",
        })

        onComplete()
        onClose()
      }, "complete double elimination tournament")
    } catch (error) {
      console.error('Error completing tournament:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to complete tournament",
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
            <Trophy className="h-5 w-5" />
            Review Final Tournament Standings
          </DialogTitle>
          <DialogDescription>
            Review team rankings based on tournament results. You can disqualify teams if needed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {standings.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <p className="text-muted-foreground">No standings available</p>
                <p className="text-sm text-muted-foreground">Complete all matches to generate standings</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
              {standings
                .sort((a, b) => a.rank - b.rank)
                .map((standing) => (
                <Card key={standing.teamId} className={`relative ${standing.disqualified ? 'border-red-200 bg-red-50' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {getRankIcon(standing.rank, standing.disqualified)}
                          <div>
                            <span className={`font-semibold ${standing.disqualified ? 'text-red-600 line-through' : ''}`}>
                              <Link
                                href={`/teams/${standing.teamId}`}
                                className="hover:text-primary hover:underline transition-colors"
                              >
                                {standing.teamName}
                              </Link>
                            </span>
                            {standing.disqualified && (
                              <Badge variant="destructive" className="text-xs ml-2">
                                DQ
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline" className="text-xs">
                            Rank {standing.rank}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant={standing.disqualified ? "default" : "outline"}
                          onClick={() => toggleDisqualification(standing.teamId)}
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
           )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || standings.length === 0}>
              {submitting ? "Completing..." : "Complete Tournament & Save Standings"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
