"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Award, Medal, Trophy, Users, Clock, CheckCircle, XCircle, RotateCcw, RefreshCw, Eye, Settings } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { ReactBracketView } from "./react-bracket-view"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

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
  next_match_win_id: number | null
  next_match_win_slot: number | null
  next_match_lose_id: number | null
  next_match_lose_slot: number | null
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
  const [resettingMatch, setResettingMatch] = useState<number | null>(null)
  const [resettingBracket, setResettingBracket] = useState(false)
  const [updatingMatch, setUpdatingMatch] = useState(false)
  const [currentTab, setCurrentTab] = useState("bracket")

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

  useEffect(() => {
    fetchData()
  }, [eventId])

  const updateMatchResult = async (matchId: number, winnerId: number, loserId: number) => {
    try {
      setUpdatingMatch(true)
      const response = await fetch(`/api/events/${eventId}/double-elimination-matches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          matchId,
          winnerId,
          loserId
        })
      })

      const result = await response.json()

      if (result.success) {
        await fetchData() // Refresh the data
        // Ensure we stay on the matches tab
        setCurrentTab("matches")
      } else {
        alert('Failed to update match: ' + result.error)
      }
    } catch (err) {
      alert('Failed to update match')
      console.error('Error updating match:', err)
    } finally {
      setUpdatingMatch(false)
    }
  }

  const resetSingleMatch = async (matchId: number) => {
    try {
      setResettingMatch(matchId)
      const response = await fetch(`/api/events/${eventId}/double-elimination-matches`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ matchId })
      })

      const result = await response.json()

      if (result.success) {
        await fetchData() // Refresh the data
        // Ensure we stay on the matches tab
        setCurrentTab("matches")
      } else {
        alert('Failed to reset match: ' + result.error)
      }
    } catch (err) {
      alert('Failed to reset match')
      console.error('Error resetting match:', err)
    } finally {
      setResettingMatch(null)
    }
  }

  const resetEntireBracket = async () => {
    try {
      setResettingBracket(true)
      const response = await fetch(`/api/events/${eventId}/double-elimination-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const result = await response.json()

      if (result.success) {
        await fetchData() // Refresh the data
        // Ensure we stay on the matches tab
        setCurrentTab("matches")
      } else {
        alert('Failed to reset bracket: ' + result.error)
      }
    } catch (err) {
      alert('Failed to reset bracket')
      console.error('Error resetting bracket:', err)
    } finally {
      setResettingBracket(false)
    }
  }

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

  const getMatchPriority = (match: Match) => {
    // winners and losers brackets are higher priority than finals
    // round 1 is higher priority than round 2, which is higher than 3, etc
    const isFinal = match.bracket === 'F' ? 1 : 0
    const round = Math.abs(match.round)
    return isFinal * 1000 + round * 100 + match.match_number

  }

  const sortMatchesByPlayOrder = (matches: Match[]) => {
    return matches.sort((a, b) => {
      // First, prioritize matches that are ready to play
      const aReady = a.team1_id && a.team2_id && !a.winner_id
      const bReady = b.team1_id && b.team2_id && !b.winner_id

      if (aReady && !bReady) return -1
      if (!aReady && bReady) return 1

      // Then sort by priority
      return getMatchPriority(a) - getMatchPriority(b)
    })
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

  const allMatches = [
    ...(data?.matches.winner || []),
    ...(data?.matches.loser || []),
    ...(data?.matches.final || [])
  ]

  const sortedMatches = sortMatchesByPlayOrder(allMatches)

  return (
    <div className="space-y-6">
      {/* Event Header */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl">{event.event_name}</CardTitle>
              <CardDescription>Double Elimination Tournament</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <span className="font-semibold">Total Matches</span>
                </div>
                <p className="text-2xl font-bold mt-2">{totalMatches}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-semibold">Completed</span>
                </div>
                <p className="text-2xl font-bold mt-2">{completedMatches}</p>
                <p className="text-sm text-muted-foreground">
                  {totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0}% Complete
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <span className="font-semibold">Remaining</span>
                </div>
                <p className="text-2xl font-bold mt-2">{totalMatches - completedMatches}</p>
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
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="bracket" className="w-full" value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="bracket" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Bracket View
          </TabsTrigger>
          <TabsTrigger value="matches" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Manage Matches
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bracket" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Tournament Bracket</CardTitle>
              <CardDescription>Read-only view of the current tournament progress</CardDescription>
            </CardHeader>
            <CardContent>
              {data && (
                <div className="overflow-x-auto">
                  <ReactBracketView
                    data={data}
                    eventId={eventId}
                    onUpdateMatch={updateMatchResult}
                    readOnly={true}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matches" className="mt-6">
          <div className="space-y-6">
            {/* Standings */}
            {data?.standings && data.standings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Medal className="h-5 w-5" />
                    Tournament Standings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.standings.slice(0, 9).map((standing) => (
                      <Card key={standing.teamId}>
                        <CardContent className="p-4 sm:p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <Badge variant={standing.rank <= 3 ? "default" : "secondary"}>
                                #{standing.rank}
                              </Badge>
                              <span className="font-medium text-sm sm:text-base">
                                <Link
                                  href={`/teams/${standing.teamId}`}
                                  className="hover:text-primary hover:underline transition-colors"
                                >
                                  {standing.teamName}
                                </Link>
                              </span>
                            </div>
                            <div className="text-right">
                              <p className="text-sm sm:text-base font-semibold">{standing.wins}W - {standing.losses}L</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* All Matches */}
            <Card>
              <CardHeader>
                <CardTitle>All Matches</CardTitle>
                <CardDescription>Manage and update match results</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sortedMatches.map((match) => {
                    const status = getMatchStatus(match)
                    const isPlayable = match.team1_id && match.team2_id && !match.winner_id

                    return (
                      <Card key={match.match_id} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4 sm:p-6">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                              <div className="flex items-center gap-2">
                                {status.icon}
                                <div>
                                  <span className="text-sm sm:text-base font-medium">
                                    {getBracketName(match.bracket)} - Match {match.match_number}
                                  </span>
                                  <p className="text-xs text-muted-foreground">
                                    Round {Math.abs(match.round)}
                                  </p>
                                </div>
                              </div>
                              <div className="text-center sm:text-left">
                                <p className="text-sm sm:text-base">
                                  <span className={`font-semibold ${match.team1_name ? 'text-blue-600' : 'text-gray-600'}`}>
                                    <Link
                                      href={match.team1_id ? `/teams/${match.team1_id}` : '#'}
                                      className="hover:text-primary hover:underline transition-colors"
                                    >
                                      {match.team1_name || 'TBD'}
                                    </Link>
                                  </span>
                                  <span className="mx-2">vs</span>
                                  <span className={`font-semibold ${match.team2_name ? 'text-blue-600' : 'text-gray-600'}`}>
                                    <Link
                                      href={match.team2_id ? `/teams/${match.team2_id}` : '#'}
                                      className="hover:text-primary hover:underline transition-colors"
                                    >
                                      {match.team2_name || 'TBD'}
                                    </Link>
                                  </span>
                                </p>
                                {match.winner_name && (
                                  <p className="text-xs text-green-600 mt-1">
                                    Winner:
                                    <Link
                                      href={match.winner_id ? `/teams/${match.winner_id}` : '#'}
                                      className="hover:text-primary hover:underline transition-colors ml-1"
                                    >
                                      {match.winner_name}
                                    </Link>
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {isPlayable && (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      disabled={updatingMatch}
                                      className="text-xs sm:text-sm px-2 sm:px-3"
                                    >
                                      {updatingMatch ? 'Updating...' : 'Record Result'}
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Record Match Result</DialogTitle>
                                      <DialogDescription>
                                        Select the winner of this match
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <Button
                                          variant="outline"
                                          onClick={() => updateMatchResult(match.match_id, match.team1_id!, match.team2_id!)}
                                          disabled={updatingMatch}
                                          className="h-16 sm:h-20 flex flex-col items-center justify-center p-4"
                                        >
                                          <span className="font-semibold text-sm sm:text-base">{match.team1_name}</span>
                                          <span className="text-xs sm:text-sm text-muted-foreground">Wins</span>
                                        </Button>
                                        <Button
                                          variant="outline"
                                          onClick={() => updateMatchResult(match.match_id, match.team2_id!, match.team1_id!)}
                                          disabled={updatingMatch}
                                          className="h-16 sm:h-20 flex flex-col items-center justify-center p-4"
                                        >
                                          <span className="font-semibold text-sm sm:text-base">{match.team2_name}</span>
                                          <span className="text-xs sm:text-sm text-muted-foreground">Wins</span>
                                        </Button>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              )}

                              {match.winner_id && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={resettingMatch === match.match_id}
                                      className="text-xs sm:text-sm px-2 sm:px-3"
                                    >
                                      <RotateCcw className="h-3 w-3 mr-1" />
                                      {resettingMatch === match.match_id ? 'Resetting...' : 'Reset'}
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Reset Match</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to reset this match? This will:
                                        <ul className="list-disc list-inside mt-2">
                                          <li>Clear the winner and loser</li>
                                          <li>Remove teams from the next matches</li>
                                          <li>Allow the match to be replayed</li>
                                        </ul>
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => resetSingleMatch(match.match_id)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Reset Match
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Reset Entire Bracket */}
            <Card>
              <CardHeader>
                <CardTitle>Tournament Management</CardTitle>
                <CardDescription>Advanced tournament controls</CardDescription>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      disabled={resettingBracket}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      {resettingBracket ? 'Resetting...' : 'Reset Entire Bracket'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reset Entire Bracket</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to reset the entire tournament? This will:
                        <ul className="list-disc list-inside mt-2">
                          <li>Clear all match results</li>
                          <li>Reset team assignments in later rounds</li>
                          <li>Remove all points awarded for this event</li>
                          <li>Set event status back to "Scheduled"</li>
                        </ul>
                        <p className="mt-2 font-semibold text-red-600">
                          This action cannot be undone!
                        </p>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={resetEntireBracket}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Reset Entire Bracket
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 