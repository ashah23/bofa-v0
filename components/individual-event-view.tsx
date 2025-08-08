'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Trophy, Medal, Award, Edit3, Users, CheckCircle, RotateCcw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { EditScoreModal } from '@/components/edit-score-modal'
import { IndividualStandingsReviewModal } from '@/components/individual-standings-review-modal'
import Link from 'next/link'
import { useRefModeGuard } from "@/hooks/use-ref-mode-guard"
import { useRefMode } from "@/components/ref-mode-context"

interface Player {
  player_id: number
  player_name: string
  team_id?: number
  team_name?: string
  twos: number
  fives: number
  tens: number
  total_points: number
  id?: number
}

interface TeamStanding {
  team_id: number
  team_name: string
  total_points: number
  player_count: number
  twos: number
  fives: number
  tens: number
}

interface IndividualEventViewProps {
  event: {
    event_id: number
    event_name: string
    event_type: string
    event_status: string
  }
  eventId: string
}

export function IndividualEventView({ event, eventId }: IndividualEventViewProps) {
  const [players, setPlayers] = useState<Player[]>([])
  const [teamStandings, setTeamStandings] = useState<TeamStanding[]>([])
  const [eventStandings, setEventStandings] = useState<any[]>([])
  const [selectedTeam, setSelectedTeam] = useState<string>('all')
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [showStandingsModal, setShowStandingsModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [lastTap, setLastTap] = useState<{ playerId: number; time: number } | null>(null)
  const { toast } = useToast()
  const { guardRefModeAsync, guardRefMode } = useRefModeGuard()
  const { isRefMode } = useRefMode()

  useEffect(() => {
    fetchScores()
  }, [eventId])

  const fetchScores = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/events/${eventId}/individual-scores`)
      if (!response.ok) {
        throw new Error('Failed to fetch scores')
      }
      const data = await response.json()
      setPlayers(data.players || [])

      // Calculate team standings
      const teamData = await fetchTeamStandings()
      setTeamStandings(teamData)

      // Fetch event standings if event is completed
      if (event.event_status === 'COMPLETED') {
        const eventStandingsData = await fetchEventStandings()
        setEventStandings(eventStandingsData)
      }
    } catch (error) {
      console.error('Error fetching scores:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch player scores',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchTeamStandings = async (): Promise<TeamStanding[]> => {
    try {
      const response = await fetch(`/api/events/${eventId}/team-standings`)
      if (!response.ok) {
        throw new Error('Failed to fetch team standings')
      }
      const data = await response.json()
      return data.standings || []
    } catch (error) {
      console.error('Error fetching team standings:', error)
      return []
    }
  }

  const fetchEventStandings = async (): Promise<any[]> => {
    try {
      const response = await fetch(`/api/events/${eventId}/standings`)
      if (!response.ok) {
        throw new Error('Failed to fetch event standings')
      }
      const data = await response.json()
      return data.standings || []
    } catch (error) {
      console.error('Error fetching event standings:', error)
      return []
    }
  }

  const handleEdit = (player: Player) => {
    guardRefMode(() => {
      setEditingPlayer(player)
    }, "edit player scores")
  }

  const handleSave = () => {
    fetchScores()
  }

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset this event? This will remove all standings and points data and set the event back to in progress.')) {
      return
    }

    await guardRefModeAsync(async () => {
      const response = await fetch(`/api/events/${eventId}/individual-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to reset event')
      }

      toast({
        title: 'Success',
        description: 'Event reset successfully. The event is now back to in progress.',
      })

      // Refresh the page to show updated state
      window.location.reload()
    }, "reset event")
  }

  const handleRowClick = (player: Player) => {
    const now = Date.now()
    const DOUBLE_TAP_DELAY = 300 // milliseconds

    if (lastTap &&
      lastTap.playerId === player.player_id &&
      now - lastTap.time < DOUBLE_TAP_DELAY) {
      // Double tap detected
      guardRefMode(() => {
        setEditingPlayer(player)
        setLastTap(null) // Reset for next double tap
      }, "edit player scores")
    } else {
      // Single tap - just update the last tap
      setLastTap({ playerId: player.player_id, time: now })
    }
  }

  // Get unique teams for filtering
  const teams = Array.from(new Set(players.map(p => p.team_name).filter((name): name is string => Boolean(name))))

  // Filter players by selected team
  const filteredPlayers = selectedTeam === 'all'
    ? players
    : players.filter(player => player.team_name === selectedTeam)

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-4 w-4 text-yellow-500" />
      case 2:
        return <Medal className="h-4 w-4 text-gray-400" />
      case 3:
        return <Award className="h-4 w-4 text-amber-600" />
      default:
        return null
    }
  }

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <Badge className="bg-yellow-500 text-white">1st</Badge>
      case 2:
        return <Badge className="bg-gray-400 text-white">2nd</Badge>
      case 3:
        return <Badge className="bg-amber-600 text-white">3rd</Badge>
      default:
        return <Badge variant="secondary">{rank}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading scores...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{event.event_name}</h1>
          <p className="text-muted-foreground">Individual Event - Slam Dunk Challenge</p>
        </div>
        <div className="flex items-center gap-4">
          {event.event_status !== 'COMPLETED' && (
            <Button
              onClick={() => setShowStandingsModal(true)}
              variant="default"
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Complete Event & Calculate Standings
            </Button>
          )}
          {event.event_status === 'COMPLETED' && isRefMode && (
            <Button
              onClick={handleReset}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset Event
            </Button>
          )}
          <Badge variant={event.event_status === 'COMPLETED' ? 'default' : 'secondary'}>
            {event.event_status}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue={event.event_status === 'COMPLETED' ? "event-standings" : "team-standings"} className="w-full">
        <TabsList className={`grid w-full ${event.event_status === 'COMPLETED' ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {event.event_status === 'COMPLETED' ? (
            <>
              <TabsTrigger value="event-standings">Event Standings</TabsTrigger>
              <TabsTrigger value="top-performers">Top Performers</TabsTrigger>
            </>
          ) : (
            <>
              <TabsTrigger value="team-standings">Current Standings</TabsTrigger>
              <TabsTrigger value="top-performers">Top Performers</TabsTrigger>
              <TabsTrigger value="scores">Score Table</TabsTrigger>
            </>
          )}
        </TabsList>

        {/* Event Standings Tab (only shown when completed) */}
        {event.event_status === 'COMPLETED' && (
          <TabsContent value="event-standings" className="space-y-4">
            <div className="space-y-8">
              {/* Olympic Podium */}
              <div className="mb-8">
                <div className="relative h-[200px] w-full max-w-4xl mx-auto">
                  {/* Podium Base */}
                  <div className="absolute bottom-0 left-0 right-0 h-[200px] bg-gray-100 rounded-t-2xl" />

                  {/* Podium Steps */}
                  <div className="absolute bottom-0 left-0 right-0 h-[200px] flex justify-center items-end gap-4 px-8">
                    {/* 2nd Place */}
                    <div className="w-1/3 h-[160px] bg-gray-200 rounded-t-xl flex flex-col items-center justify-center relative">
                      <Award className="h-10 w-10 text-gray-400 mb-2" />
                      <Link
                        href={`/teams/${eventStandings[1]?.team_id}`}
                        className="font-bold text-gray-600 hover:text-gray-800 hover:underline transition-colors"
                      >
                        {eventStandings[1]?.team_name}
                      </Link>
                      <span className="text-sm text-gray-500">{eventStandings[1]?.point_value} pts</span>
                      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gray-200 px-4 py-1 rounded-full">
                        <span className="font-bold text-gray-600">2nd</span>
                      </div>
                    </div>

                    {/* 1st Place */}
                    <div className="w-1/3 h-[200px] bg-yellow-100 rounded-t-xl flex flex-col items-center justify-center relative">
                      <Trophy className="h-12 w-12 text-yellow-500 mb-2" />
                      <Link
                        href={`/teams/${eventStandings[0]?.team_id}`}
                        className="font-bold text-yellow-600 hover:text-yellow-800 hover:underline transition-colors"
                      >
                        {eventStandings[0]?.team_name}
                      </Link>
                      <span className="text-sm text-yellow-500">{eventStandings[0]?.point_value} pts</span>
                      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-yellow-100 px-4 py-1 rounded-full">
                        <span className="font-bold text-yellow-600">1st</span>
                      </div>
                    </div>

                    {/* 3rd Place */}
                    <div className="w-1/3 h-[120px] bg-amber-100 rounded-t-xl flex flex-col items-center justify-center relative">
                      <Award className="h-8 w-8 text-amber-700 mb-2" />
                      <Link
                        href={`/teams/${eventStandings[2]?.team_id}`}
                        className="font-bold text-amber-700 hover:text-amber-900 hover:underline transition-colors"
                      >
                        {eventStandings[2]?.team_name}
                      </Link>
                      <span className="text-sm text-amber-600">{eventStandings[2]?.point_value} pts</span>
                      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-amber-100 px-4 py-1 rounded-full">
                        <span className="font-bold text-amber-700">3rd</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Final Standings Table */}
              {eventStandings.length > 3 && (
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="h-12 px-4 text-left align-middle font-medium">Rank</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Team</th>
                        <th className="h-12 px-4 text-right align-middle font-medium">Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eventStandings.slice(3).map((standing: any) => (
                        <tr key={standing.team_id} className={`border-b transition-colors hover:bg-muted/50 ${standing.disqualified ? 'bg-red-50' : ''}`}>
                          <td className="p-4 align-middle">
                            {standing.disqualified ? (
                              <span className="text-red-600 font-bold">DQ</span>
                            ) : (
                              standing.rank
                            )}
                          </td>
                          <td className={`p-4 align-middle font-medium ${standing.disqualified ? 'text-red-600 line-through' : ''}`}>
                            <Link
                              href={`/teams/${standing.team_id}`}
                              className="hover:text-primary hover:underline transition-colors"
                            >
                              {standing.team_name}
                            </Link>
                          </td>
                          <td className="p-4 align-middle text-right">{standing.point_value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>
        )}

        {/* Current Standings Tab (only shown when not completed) */}
        {event.event_status !== 'COMPLETED' && (
          <TabsContent value="team-standings" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamStandings.map((team, index) => (
                <div key={team.team_id} className="relative">
                  {/* Rank Badge positioned on top of card */}
                  <div className="absolute -top-2 -left-2 z-10">
                    {getRankBadge(index + 1)}
                  </div>

                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="pt-2">
                        <div className="flex items-center justify-between mb-3">
                          <div className="font-semibold text-lg">
                            <Link
                              href={`/teams/${team.team_id}`}
                              className="hover:text-primary hover:underline transition-colors"
                            >
                              {team.team_name}
                            </Link>
                          </div>
                          <div className="text-xl font-bold text-primary">
                            {team.total_points} pts
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {team.twos} twos • {team.fives} fives • {team.tens} tens
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </TabsContent>
        )}

        <TabsContent value="top-performers" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {players.map((player, index) => (
              <div key={player.player_id} className="relative">
                {/* Rank Badge positioned on top of card */}
                <div className="absolute -top-2 -left-2 z-10">
                  {getRankBadge(index + 1)}
                </div>

                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold text-lg">{player.player_name}</div>
                        <div className="text-xl font-bold text-primary">
                          {player.total_points} pts
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        {player.team_name || 'No Team'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {player.twos} twos • {player.fives} fives • {player.tens} tens
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="scores" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit3 className="h-5 w-5" />
                Score Table
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Teams</SelectItem>
                    {teams.map((team) => (
                      <SelectItem key={team} value={team}>
                        {team}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead className="text-center">2-Pointers</TableHead>
                    <TableHead className="text-center">5-Pointers</TableHead>
                    <TableHead className="text-center">10-Pointers</TableHead>
                    <TableHead className="text-center">Total Points</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlayers.map((player) => (
                    <TableRow
                      key={player.player_id}
                      onClick={() => handleRowClick(player)}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <TableCell className="font-medium">{player.player_name}</TableCell>
                      <TableCell className="text-muted-foreground">{player.team_name || 'No Team'}</TableCell>
                      <TableCell className="text-center">{player.twos}</TableCell>
                      <TableCell className="text-center">{player.fives}</TableCell>
                      <TableCell className="text-center">{player.tens}</TableCell>
                      <TableCell className="text-center font-bold">{player.total_points}</TableCell>
                      <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(player)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <EditScoreModal
        isOpen={editingPlayer !== null}
        onClose={() => setEditingPlayer(null)}
        player={editingPlayer}
        eventId={eventId}
        onSave={handleSave}
      />

      <IndividualStandingsReviewModal
        isOpen={showStandingsModal}
        onClose={() => setShowStandingsModal(false)}
        eventId={eventId}
        onComplete={() => {
          setShowStandingsModal(false)
          // Refresh the page to show updated standings
          window.location.reload()
        }}
      />
    </div>
  )
} 