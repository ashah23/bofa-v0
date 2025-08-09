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
import { useToast } from '@/hooks/use-toast'
import { useRefModeGuard } from "@/hooks/use-ref-mode-guard"
import { useRefMode } from "@/components/ref-mode-context"
import { ResetPasscodeDialog } from "@/components/reset-passcode-dialog"
import { DoubleEliminationStandingsReviewModal } from "@/components/double-elimination-standings-review-modal"

interface Match {
  match_id: number
  round: number
  match_number: number
  bracket: 'Winner' | 'Loser' | 'Final' | '9-12' | '11-12' | '9-10' | '7-8' | '5-6'
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
  is_hidden: boolean
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
    '9-12': Match[]
    '7-8': Match[]
    '5-6': Match[]
    '11-12': Match[]
    '9-10': Match[]
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
  const [showResetPasscodeDialog, setShowResetPasscodeDialog] = useState(false)
  const [showStandingsModal, setShowStandingsModal] = useState(false)
  const [updatingMatch, setUpdatingMatch] = useState(false)
  const [currentTab, setCurrentTab] = useState("bracket")
  const [eventStandings, setEventStandings] = useState<any[]>([])
  const { toast } = useToast()
  const { guardRefModeAsync } = useRefModeGuard()
  const { isRefMode } = useRefMode()

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/events/${eventId}/double-elimination-matches`)
      if (!response.ok) {
        throw new Error('Failed to fetch double elimination data')
      }
      const result = await response.json()
      setData(result)

      // Fetch event standings if event is completed
      if (event.event_status === 'COMPLETED') {
        const eventStandingsData = await fetchEventStandings()
        setEventStandings(eventStandingsData)
      }
    } catch (error) {
      console.error('Error fetching double elimination data:', error)
      setError('Failed to load tournament data')
      toast({
        title: 'Error',
        description: 'Failed to load tournament data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchEventStandings = async (): Promise<any[]> => {
    try {
      const response = await fetch(`/api/events/${eventId}/standings`)
      if (!response.ok) {
        throw new Error('Failed to fetch event standings')
      }
      const result = await response.json()
      return result.standings || []
    } catch (error) {
      console.error('Error fetching event standings:', error)
      return []
    }
  }

  useEffect(() => {
    fetchData()
  }, [eventId])

  const updateMatchResult = async (matchId: number, winnerId: number, loserId: number) => {
    try {
      await guardRefModeAsync(async () => {
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
          toast({
            title: "Error",
            description: 'Failed to update match: ' + result.error,
            variant: "destructive"
          })
        }
      }, "update match result")
    } finally {
      setUpdatingMatch(false)
    }
  }

  const resetSingleMatch = async (matchId: number) => {
    try {
      await guardRefModeAsync(async () => {
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
          toast({
            title: "Error",
            description: 'Failed to reset match: ' + result.error,
            variant: "destructive"
          })
        }
      }, "reset match")
    } finally {
      setResettingMatch(null)
    }
  }

  const resetEntireBracket = async () => {
    setShowResetPasscodeDialog(true)
  }

  const resetEntireBracketConfirm = async () => {
    try {
      await guardRefModeAsync(async () => {
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
          toast({
            title: "Error",
            description: 'Failed to reset bracket: ' + result.error,
            variant: "destructive"
          })
        }
      }, "reset bracket")
    } finally {
      setResettingBracket(false)
    }
  }

  const completeEvent = async () => {
    try {
      await guardRefModeAsync(async () => {
        // Calculate standings based on match results
        const standings = calculateFinalStandings()
        
        const response = await fetch(`/api/events/${eventId}/complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ standings })
        })

        const result = await response.json()

        if (result.success) {
          toast({
            title: "Success",
            description: 'Tournament completed successfully!',
            variant: "default"
          })
          // Refresh the data to show standings
          await fetchData()
          // Switch to standings tab
          setCurrentTab("standings")
        } else {
          toast({
            title: "Error",
            description: 'Failed to complete tournament: ' + result.error,
            variant: "destructive"
          })
        }
      }, "complete event")
    } catch (error) {
      console.error('Error completing event:', error)
      toast({
        title: "Error",
        description: 'Failed to complete tournament: ' + (error instanceof Error ? error.message : 'Unknown error'),
        variant: "destructive"
      })
    }
  }

  const calculateFinalStandings = () => {
    if (!data) return []

    const standings: Array<{ rank: number; teamId: number; teamName: string }> = []
    
    // Get all matches for reference
    const allMatches = [
      ...(data.matches.winner || []),
      ...(data.matches.loser || []),
      ...(data.matches.final || []),
      ...(data.matches['9-12'] || []),
      ...(data.matches['7-8'] || []),
      ...(data.matches['5-6'] || []),
      ...(data.matches['11-12'] || []),
      ...(data.matches['9-10'] || [])
    ]

    // Helper function to get match by ID
    const getMatch = (matchId: number) => allMatches.find(m => m.match_id === matchId)
    
    // Helper function to get team name by ID
    const getTeamName = (teamId: number) => {
      const match = allMatches.find(m => m.team1_id === teamId || m.team2_id === teamId)
      if (match?.team1_id === teamId) return match.team1_name || `Team ${teamId}`
      if (match?.team2_id === teamId) return match.team2_name || `Team ${teamId}`
      return `Team ${teamId}`
    }

    // Determine which final match was the last one played
    const finalMatch28 = getMatch(28)
    const finalMatch29 = getMatch(29)
    
    let championId: number | null = null
    let runnerUpId: number | null = null

    if (finalsRound2Visible && finalMatch29?.winner_id) {
      // Finals Round 2 was played - winner is champion, loser is runner-up
      championId = finalMatch29.winner_id
      runnerUpId = finalMatch29.loser_id
    } else if (finalMatch28?.winner_id) {
      // Only Finals Round 1 was played - winner is champion, loser is runner-up
      championId = finalMatch28.winner_id
      runnerUpId = finalMatch28.loser_id
    }

    if (championId) {
      standings.push({
        rank: 1,
        teamId: championId,
        teamName: getTeamName(championId)
      })
    }

    if (runnerUpId) {
      standings.push({
        rank: 2,
        teamId: runnerUpId,
        teamName: getTeamName(runnerUpId)
      })
    }

    // Add remaining teams based on specific match results
    const match21 = getMatch(21) // L21
    const match20 = getMatch(20) // L20
    const match27 = getMatch(27) // W27, L27
    const match26 = getMatch(26) // W26, L26
    const match25 = getMatch(25) // W25, L25
    const match24 = getMatch(24) // W24, L24

    if (match21?.loser_id) {
      standings.push({
        rank: 3,
        teamId: match21.loser_id,
        teamName: getTeamName(match21.loser_id)
      })
    }

    if (match20?.loser_id) {
      standings.push({
        rank: 4,
        teamId: match20.loser_id,
        teamName: getTeamName(match20.loser_id)
      })
    }

    if (match27?.winner_id) {
      standings.push({
        rank: 5,
        teamId: match27.winner_id,
        teamName: getTeamName(match27.winner_id)
      })
    }

    if (match27?.loser_id) {
      standings.push({
        rank: 6,
        teamId: match27.loser_id,
        teamName: getTeamName(match27.loser_id)
      })
    }

    if (match26?.winner_id) {
      standings.push({
        rank: 7,
        teamId: match26.winner_id,
        teamName: getTeamName(match26.winner_id)
      })
    }

    if (match26?.loser_id) {
      standings.push({
        rank: 8,
        teamId: match26.loser_id,
        teamName: getTeamName(match26.loser_id)
      })
    }

    if (match25?.winner_id) {
      standings.push({
        rank: 9,
        teamId: match25.winner_id,
        teamName: getTeamName(match25.winner_id)
      })
    }

    if (match25?.loser_id) {
      standings.push({
        rank: 10,
        teamId: match25.loser_id,
        teamName: getTeamName(match25.loser_id)
      })
    }

    if (match24?.winner_id) {
      standings.push({
        rank: 11,
        teamId: match24.winner_id,
        teamName: getTeamName(match24.winner_id)
      })
    }

    if (match24?.loser_id) {
      standings.push({
        rank: 12,
        teamId: match24.loser_id,
        teamName: getTeamName(match24.loser_id)
      })
    }

    return standings
  }

  const getBracketName = (bracket: string) => {
    switch (bracket) {
      case 'Winner': return 'Winner\'s Bracket'
      case 'Loser': return 'Loser\'s Bracket'
      case 'Final': return 'Finals'
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
    const isFinal = match.bracket === 'Final' ? 1 : 0
    const round = Math.abs(match.round)
    return isFinal * 1000 + round * 100 + match.match_number

  }

  const sortMatchesByPlayOrder = (matches: Match[]) => {
    // Group matches by status
    const readyMatches = matches.filter(match => match.team1_id && match.team2_id && !match.winner_id)
    const pendingMatches = matches.filter(match => !match.team1_id || !match.team2_id)
    const completedMatches = matches.filter(match => match.winner_id)

    // Sort each group
    const sortedReadyMatches = readyMatches.sort((a, b) => a.match_id - b.match_id)
    const sortedPendingMatches = pendingMatches.sort((a, b) => a.match_id - b.match_id)
    const sortedCompletedMatches = completedMatches.sort((a, b) => b.match_id - a.match_id)

    // Return in order: Ready, Pending, Completed
    return [...sortedReadyMatches, ...sortedPendingMatches, ...sortedCompletedMatches]
  }

  const getCourtNumber = (matchId: number) => {
    // Court number is determined by match ID modulo 3, with 0 becoming 3
    const court = matchId % 3
    return court === 0 ? 3 : court
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
    (data?.matches.final.length || 0) +
    (data?.matches['9-12'].length || 0) +
    (data?.matches['7-8'].length || 0) +
    (data?.matches['5-6'].length || 0) +
    (data?.matches['11-12'].length || 0) +
    (data?.matches['9-10'].length || 0)

  const completedMatches = (data?.matches.winner?.filter(m => m.winner_id).length || 0) +
    (data?.matches.loser?.filter(m => m.winner_id).length || 0) +
    (data?.matches.final?.filter(m => m.winner_id).length || 0) +
    (data?.matches['9-12']?.filter(m => m.winner_id).length || 0) +
    (data?.matches['7-8']?.filter(m => m.winner_id).length || 0) +
    (data?.matches['5-6']?.filter(m => m.winner_id).length || 0) +
    (data?.matches['11-12']?.filter(m => m.winner_id).length || 0) +
    (data?.matches['9-10']?.filter(m => m.winner_id).length || 0)

  const allMatches = [
    ...(data?.matches.winner || []),
    ...(data?.matches.loser || []),
    ...(data?.matches.final || []),
    ...(data?.matches['9-12'] || []),
    ...(data?.matches['7-8'] || []),
    ...(data?.matches['5-6'] || []),
    ...(data?.matches['11-12'] || []),
    ...(data?.matches['9-10'] || [])
  ]

  const sortedMatches = sortMatchesByPlayOrder(allMatches)

  // Check if all visible matches are completed
  const visibleMatches = allMatches.filter(match => !match.is_hidden)
  const completedVisibleMatches = visibleMatches.filter(match => match.winner_id)
  const allVisibleMatchesCompleted = visibleMatches.length > 0 && completedVisibleMatches.length === visibleMatches.length

  // Check if Finals Round 2 is visible (meaning Finals Round 1 was won by team2)
  const finalsRound2Visible = data?.matches.final?.some(match => match.round === 2 && !match.is_hidden) || false

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
      <Tabs defaultValue={event.event_status === 'COMPLETED' ? "standings" : "bracket"} className="w-full" value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className={`grid w-full ${event.event_status === 'COMPLETED' ? 'grid-cols-2' : 'grid-cols-2'}`}>
          {event.event_status === 'COMPLETED' ? (
            <>
              <TabsTrigger value="standings" className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Final Standings
              </TabsTrigger>
              <TabsTrigger value="bracket" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Tournament Bracket
              </TabsTrigger>
            </>
          ) : (
            <>
              <TabsTrigger value="bracket" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Bracket View
              </TabsTrigger>
              <TabsTrigger value="matches" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Manage Matches
              </TabsTrigger>
            </>
          )}
        </TabsList>

        {/* Final Standings Tab (only shown when completed) */}
        {event.event_status === 'COMPLETED' && (
          <TabsContent value="standings" className="space-y-4">
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

              {/* Reset Event Button (only shown when completed) */}
              {isRefMode && (
                <Card>
                  <CardHeader>
                    <CardTitle>Tournament Management</CardTitle>
                    <CardDescription>Advanced tournament controls</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="destructive"
                      disabled={resettingBracket}
                      onClick={() => setShowResetPasscodeDialog(true)}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      {resettingBracket ? 'Resetting...' : 'Reset Entire Tournament'}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        )}

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
                      <Card key={match.match_id} className={`border-l-4 ${match.winner_id ? 'border-l-green-500 bg-green-50/30' : 'border-l-blue-500'} hover:shadow-md transition-all duration-200`}>
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            {/* Header with match info and status */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  {status.icon}
                                  <div>
                                    <h3 className="font-semibold text-base">
                                      {getBracketName(match.bracket)} - Match {match.match_number}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                      Round {Math.abs(match.round)} • Court {getCourtNumber(match.match_id)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              {match.winner_name && (
                                <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Completed
                                </Badge>
                              )}
                            </div>

                            {/* Teams section */}
                            <div className="bg-white rounded-lg p-4 border">
                              <div className="flex items-center justify-center gap-4">
                                <div className="flex-1 text-center">
                                  <Link
                                    href={match.team1_id ? `/teams/${match.team1_id}` : '#'}
                                    className={`text-lg font-semibold hover:text-primary hover:underline transition-colors ${match.team1_name ? 'text-blue-600' : 'text-gray-500'}`}
                                  >
                                    {match.team1_name || 'TBD'}
                                  </Link>
                                </div>
                                <div className="text-muted-foreground font-medium">vs</div>
                                <div className="flex-1 text-center">
                                  <Link
                                    href={match.team2_id ? `/teams/${match.team2_id}` : '#'}
                                    className={`text-lg font-semibold hover:text-primary hover:underline transition-colors ${match.team2_name ? 'text-blue-600' : 'text-gray-500'}`}
                                  >
                                    {match.team2_name || 'TBD'}
                                  </Link>
                                </div>
                              </div>
                              {match.winner_name && (
                                <div className="mt-3 pt-3 border-t border-gray-200 text-center">
                                  <p className="text-sm text-green-600 font-medium">
                                    Winner: 
                                    <Link
                                      href={match.winner_id ? `/teams/${match.winner_id}` : '#'}
                                      className="hover:text-primary hover:underline transition-colors ml-1 font-semibold"
                                    >
                                      {match.winner_name}
                                    </Link>
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Actions section */}
                            <div className="flex items-center justify-center gap-3 pt-2">
                              {isPlayable && (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      disabled={updatingMatch}
                                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
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

                              {match.winner_id && isRefMode && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={resettingMatch === match.match_id}
                                      className="border-red-200 text-red-600 hover:bg-red-50 px-4 py-2"
                                    >
                                      <RotateCcw className="h-3 w-3 mr-1" />
                                      {resettingMatch === match.match_id ? 'Resetting...' : 'Reset'}
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Reset Match</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to reset this match? This will clear the winner and loser, remove teams from the next matches, and allow the match to be replayed.
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
            {isRefMode && (
              <Card>
                <CardHeader>
                  <CardTitle>Tournament Management</CardTitle>
                  <CardDescription>Advanced tournament controls</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="destructive"
                    disabled={resettingBracket}
                    onClick={() => setShowResetPasscodeDialog(true)}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {resettingBracket ? 'Resetting...' : 'Reset Entire Bracket'}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Complete Event */}
            {isRefMode && allVisibleMatchesCompleted && (
              <Card>
                <CardHeader>
                  <CardTitle>Complete Tournament</CardTitle>
                  <CardDescription>Finalize the tournament and calculate final standings</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="default"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => setShowStandingsModal(true)}
                  >
                    <Trophy className="h-4 w-4 mr-2" />
                    Complete Event & Calculate Standings
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <ResetPasscodeDialog
        isOpen={showResetPasscodeDialog}
        onClose={() => setShowResetPasscodeDialog(false)}
        onConfirm={resetEntireBracketConfirm}
        title="Reset Double Elimination Tournament"
        description="This will reset the entire tournament, clearing all match results, team assignments, and points. The event will be set back to 'Scheduled' status. This action cannot be undone."
        actionName="reset"
      />

      <DoubleEliminationStandingsReviewModal
        isOpen={showStandingsModal}
        onClose={() => setShowStandingsModal(false)}
        eventId={eventId}
        onComplete={() => {
          setShowStandingsModal(false)
          // Refresh the data to show updated standings
          fetchData()
          // Switch to standings tab
          setCurrentTab("standings")
        }}
        initialStandings={calculateFinalStandings()}
      />
    </div>
  )
} 