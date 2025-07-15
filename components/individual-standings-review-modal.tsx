"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronUp, ChevronDown, Trophy, Medal, Award, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface TeamStanding {
  team_id: number
  team_name: string
  total_points: number
  player_count: number
  twos: number
  fives: number
  tens: number
  rank?: number
  disqualified?: boolean
}

interface IndividualStandingsReviewModalProps {
  isOpen: boolean
  onClose: () => void
  eventId: string
  onComplete: () => void
}

export function IndividualStandingsReviewModal({ isOpen, onClose, eventId, onComplete }: IndividualStandingsReviewModalProps) {
  const [teamStandings, setTeamStandings] = useState<TeamStanding[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen) {
      fetchTeamStandings()
    }
  }, [isOpen, eventId])

  const fetchTeamStandings = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/events/${eventId}/team-standings`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch team standings')
      }

      const data = await response.json()
      // Sort teams by total points (highest first) and assign ranks
      const sortedTeams = (data.standings || []).sort((a: TeamStanding, b: TeamStanding) => b.total_points - a.total_points)
        .map((team: TeamStanding, index: number) => ({
          ...team,
          rank: index + 1
        }))
      
      setTeamStandings(sortedTeams)
    } catch (error) {
      console.error('Error fetching team standings:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch team standings",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const moveTeam = (fromIndex: number, direction: 'up' | 'down') => {
    if (direction === 'up' && fromIndex === 0) return
    if (direction === 'down' && fromIndex === teamStandings.length - 1) return

    const newStandings = [...teamStandings]
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1

    // Swap the teams
    const temp = newStandings[fromIndex]
    newStandings[fromIndex] = newStandings[toIndex]
    newStandings[toIndex] = temp

    // Update ranks (excluding disqualified teams)
    let currentRank = 1
    newStandings.forEach((team) => {
      if (!team.disqualified) {
        team.rank = currentRank
        currentRank++
      }
    })

    setTeamStandings(newStandings)
  }

  const toggleDisqualification = (teamId: number) => {
    const newStandings = [...teamStandings]
    const teamIndex = newStandings.findIndex(standing => standing.team_id === teamId)
    
    if (teamIndex !== -1) {
      const team = newStandings[teamIndex]
      team.disqualified = !team.disqualified
      
      if (team.disqualified) {
        // Set disqualified team to last place
        team.rank = teamStandings.length
      } else {
        // Re-insert based on total points
        const insertIndex = newStandings.findIndex(s => !s.disqualified && s.total_points < team.total_points)
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
      newStandings.forEach((team) => {
        if (!team.disqualified) {
          team.rank = currentRank
          currentRank++
        }
      })
      
      setTeamStandings(newStandings)
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
    try {
      setSubmitting(true)
      
      // Calculate points based on final rankings
      const point_values = [15, 12, 10, 8, 7, 6, 5, 4, 3, 2, 1, 0]
      
      // Clear existing points for this event
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/events/${eventId}/individual-scores`, {
        method: 'DELETE'
      })

      // Save new points based on final team rankings
      for (const team of teamStandings) {
        const points = team.disqualified ? 0 : (point_values[(team.rank || 1) - 1] || 0)
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/events/${eventId}/individual-scores`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            teamId: team.team_id,
            points: points,
            eventId: eventId
          })
        })
      }

      // Update event status to completed
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/events/${eventId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      toast({
        title: "Success",
        description: "Event completed and team standings saved successfully",
      })

      onComplete()
      onClose()
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
            <Trophy className="h-5 w-5" />
            Review Final Team Standings
          </DialogTitle>
          <DialogDescription>
            Review and adjust team rankings based on aggregated player scores. You can manually reorder teams if needed.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3">
              {teamStandings
                .sort((a, b) => (a.rank || 0) - (b.rank || 0))
                .map((team, index) => (
                <Card key={team.team_id} className={`relative ${team.disqualified ? 'border-red-200 bg-red-50' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {getRankIcon(team.rank || 1, team.disqualified)}
                          <div>
                            <span className={`font-semibold ${team.disqualified ? 'text-red-600 line-through' : ''}`}>
                              {team.team_name}
                            </span>
                            {team.disqualified && (
                              <Badge variant="destructive" className="text-xs ml-2">
                                DQ
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline" className="text-xs">
                            {team.total_points} pts
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {team.player_count} players • {team.twos} twos • {team.fives} fives • {team.tens} tens
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {!team.disqualified && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => moveTeam(index, 'up')}
                              disabled={index === 0}
                              className="h-8 w-8 p-0"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => moveTeam(index, 'down')}
                              disabled={index === teamStandings.length - 1}
                              className="h-8 w-8 p-0"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant={team.disqualified ? "default" : "outline"}
                          onClick={() => toggleDisqualification(team.team_id)}
                          className="h-8 px-2 text-xs"
                        >
                          {team.disqualified ? "Reinstate" : "DQ"}
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