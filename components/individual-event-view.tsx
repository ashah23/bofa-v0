'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Trophy, Medal, Award, Edit3, Save, X, Users } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

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
  const [editingPlayer, setEditingPlayer] = useState<number | null>(null)
  const [editScores, setEditScores] = useState<{ twos: number; fives: number; tens: number }>({
    twos: 0,
    fives: 0,
    tens: 0
  })
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

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

  const handleEdit = (player: Player) => {
    setEditingPlayer(player.player_id)
    setEditScores({
      twos: player.twos,
      fives: player.fives,
      tens: player.tens
    })
  }

  const handleSave = async (playerId: number) => {
    try {
      const response = await fetch(`/api/events/${eventId}/individual-scores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          playerId,
          twos: editScores.twos,
          fives: editScores.fives,
          tens: editScores.tens
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update score')
      }

      await fetchScores()
      setEditingPlayer(null)
      toast({
        title: 'Success',
        description: 'Score updated successfully'
      })
    } catch (error) {
      console.error('Error updating score:', error)
      toast({
        title: 'Error',
        description: 'Failed to update score',
        variant: 'destructive'
      })
    }
  }

  const handleCancel = () => {
    setEditingPlayer(null)
  }

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
        <Badge variant={event.event_status === 'COMPLETED' ? 'default' : 'secondary'}>
          {event.event_status}
        </Badge>
      </div>

      <Tabs defaultValue="team-standings" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="team-standings">Current Standings</TabsTrigger>
          <TabsTrigger value="top-performers">Top Performers</TabsTrigger>
          <TabsTrigger value="scores">Score Table</TabsTrigger>
        </TabsList>

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
                        <div className="font-semibold text-lg">{team.team_name}</div>
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
                  {players.map((player) => (
                    <TableRow key={player.player_id}>
                      <TableCell className="font-medium">{player.player_name}</TableCell>
                      <TableCell className="text-muted-foreground">{player.team_name || 'No Team'}</TableCell>
                      <TableCell className="text-center">
                        {editingPlayer === player.player_id ? (
                          <Input
                            type="number"
                            min="0"
                            value={editScores.twos}
                            onChange={(e) =>
                              setEditScores(prev => ({ ...prev, twos: parseInt(e.target.value) || 0 }))
                            }
                            className="w-20 text-center"
                          />
                        ) : (
                          player.twos
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {editingPlayer === player.player_id ? (
                          <Input
                            type="number"
                            min="0"
                            value={editScores.fives}
                            onChange={(e) =>
                              setEditScores(prev => ({ ...prev, fives: parseInt(e.target.value) || 0 }))
                            }
                            className="w-20 text-center"
                          />
                        ) : (
                          player.fives
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {editingPlayer === player.player_id ? (
                          <Input
                            type="number"
                            min="0"
                            value={editScores.tens}
                            onChange={(e) =>
                              setEditScores(prev => ({ ...prev, tens: parseInt(e.target.value) || 0 }))
                            }
                            className="w-20 text-center"
                          />
                        ) : (
                          player.tens
                        )}
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        {editingPlayer === player.player_id
                          ? editScores.twos * 2 + editScores.fives * 5 + editScores.tens * 10
                          : player.total_points}
                      </TableCell>
                      <TableCell className="text-center">
                        {editingPlayer === player.player_id ? (
                          <div className="flex gap-2 justify-center">
                            <Button
                              size="sm"
                              onClick={() => handleSave(player.player_id)}
                              className="h-8 w-8 p-0"
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancel}
                              className="h-8 w-8 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(player)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 