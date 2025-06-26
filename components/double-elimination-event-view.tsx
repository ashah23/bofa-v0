"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Award, Medal, Trophy, Users, Clock, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

interface Match {
  match_id: number
  round: number
  match_number: number
  bracket: 'W' | 'L' | 'F'
  team1_id: number | null
  team2_id: number | null
  winner_id: number | null
  loser_id: number | null
  team1_name: string | null
  team2_name: string | null
  winner_name: string | null
  loser_name: string | null
  played_at: string | null
}

interface Standing {
  rank: number
  teamId: number
  teamName: string
  losses: number
  wins: number
  lastMatchId: number
}

interface DoubleEliminationData {
  matches: {
    winner: Match[]
    loser: Match[]
    final: Match[]
  }
  standings: Standing[]
  eventId: number
}

interface DoubleEliminationEventViewProps {
  event: any
  eventId: string
}

export function DoubleEliminationEventView({ event, eventId }: DoubleEliminationEventViewProps) {
  const [data, setData] = useState<DoubleEliminationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/events/${eventId}/double-elimination-matches`)
        const result = await response.json()
        
        if (result.success) {
          setData(result)
        } else {
          setError(result.error || 'Failed to fetch tournament data')
        }
      } catch (err) {
        setError('Failed to fetch tournament data')
        console.error('Error fetching double elimination data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [eventId])

  const getBracketName = (bracket: string) => {
    switch (bracket) {
      case 'W': return 'Winner\'s Bracket'
      case 'L': return 'Loser\'s Bracket'
      case 'F': return 'Finals'
      default: return bracket
    }
  }

  const getMatchStatus = (match: Match) => {
    if (match.winner_id) {
      return { status: 'completed', icon: <CheckCircle className="h-4 w-4 text-green-500" /> }
    }
    if (match.team1_id && match.team2_id) {
      return { status: 'ready', icon: <Clock className="h-4 w-4 text-yellow-500" /> }
    }
    return { status: 'pending', icon: <XCircle className="h-4 w-4 text-gray-400" /> }
  }

  if (loading) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-3xl">{event.event_name}</CardTitle>
          <CardDescription>Loading tournament data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-3xl">{event.event_name}</CardTitle>
          <CardDescription>Double Elimination Tournament</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Tournament</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalMatches = (data?.matches.winner.length || 0) + 
                      (data?.matches.loser.length || 0) + 
                      (data?.matches.final.length || 0)
  
  const completedMatches = (data?.matches.winner?.filter(m => m.winner_id).length || 0) +
                          (data?.matches.loser?.filter(m => m.winner_id).length || 0) +
                          (data?.matches.final?.filter(m => m.winner_id).length || 0)

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-3xl">{event.event_name}</CardTitle>
            <CardDescription>Double Elimination Tournament</CardDescription>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" asChild>
              <Link href={`/events/${eventId}/bracket`}>
                View Bracket
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {/* Tournament Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <span className="font-semibold">Tournament Progress</span>
                </div>
                <p className="text-2xl font-bold mt-2">{completedMatches}/{totalMatches}</p>
                <p className="text-sm text-muted-foreground">Matches Completed</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  <span className="font-semibold">Teams</span>
                </div>
                <p className="text-2xl font-bold mt-2">{data?.standings.length || 0}</p>
                <p className="text-sm text-muted-foreground">Participating</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-purple-500" />
                  <span className="font-semibold">Current Leader</span>
                </div>
                <p className="text-lg font-bold mt-2">
                  {data?.standings[0] ? data.standings[0].teamName : 'TBD'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {data?.standings[0] ? `${data.standings[0].wins}W - ${data.standings[0].losses}L` : ''}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Standings */}
          {data?.standings && data.standings.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Medal className="h-5 w-5" />
                Tournament Standings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.standings.slice(0, 9).map((standing) => (
                  <Card key={standing.teamId}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={standing.rank <= 3 ? "default" : "secondary"}>
                            #{standing.rank}
                          </Badge>
                          <span className="font-medium">{standing.teamName}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{standing.wins}W - {standing.losses}L</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Recent Matches */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Recent Matches</h3>
            <div className="space-y-2">
              {[...(data?.matches.winner || []), ...(data?.matches.loser || []), ...(data?.matches.final || [])]
                .filter(match => match.winner_id)
                .sort((a, b) => new Date(b.played_at || '').getTime() - new Date(a.played_at || '').getTime())
                .slice(0, 5)
                .map((match) => {
                  const status = getMatchStatus(match)
                  return (
                    <Card key={match.match_id}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {status.icon}
                            <span className="text-sm font-medium">
                              {getBracketName(match.bracket)} - Match {match.match_number}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm">
                              <span className={`font-semibold ${match.winner_name ? 'text-green-600' : 'text-gray-600'}`}>
                                {match.winner_name || 'TBD'}
                              </span>
                              <span className="mx-2">def.</span>
                              <span className={`${match.loser_name ? 'text-red-600' : 'text-gray-600'}`}>
                                {match.loser_name || 'TBD'}
                              </span>
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            <Button asChild>
              <Link href={`/events/${eventId}/bracket`}>
                View Tournament Bracket
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/events/${eventId}/matches`}>
                View All Matches
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 