"use client"

import { useState } from "react"
import { Bracket, IRoundProps, IRenderSeedProps, Seed, SeedItem, SeedTeam, SingleLineSeed } from "react-brackets"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Play, RotateCcw } from "lucide-react"
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

interface BracketData {
  matches: {
    winner: Match[]
    loser: Match[]
    final: Match[]
  }
  standings?: any[]
  eventId: number
}

interface ReactBracketViewProps {
  data: BracketData
  eventId: string
  onUpdateMatch: (matchId: number, winnerId: number, loserId: number) => Promise<void>
  readOnly?: boolean
}

export function ReactBracketView({ data, eventId, onUpdateMatch, readOnly = false }: ReactBracketViewProps) {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [updatingMatch, setUpdatingMatch] = useState(false)
  const [resettingMatch, setResettingMatch] = useState<number | null>(null)

  const updateMatchResult = async (matchId: number, winnerId: number, loserId: number) => {
    try {
      setUpdatingMatch(true)
      await onUpdateMatch(matchId, winnerId, loserId)
      setSelectedMatch(null)
    } catch (err) {
      console.error('Error updating match:', err)
    } finally {
      setUpdatingMatch(false)
    }
  }

  const resetMatch = async (matchId: number) => {
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
        // Refresh the data by calling the parent's refresh function
        window.location.reload()
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

  const getMatchStatus = (match: Match) => {
    if (match.winner_id) {
      return { status: 'completed', icon: '✅', color: 'text-green-600', bgColor: 'bg-green-50' }
    }
    if (match.team1_id && match.team2_id) {
      return { status: 'ready', icon: '⏰', color: 'text-yellow-600', bgColor: 'bg-yellow-50' }
    }
    return { status: 'pending', icon: '⏳', color: 'text-gray-400', bgColor: 'bg-gray-50' }
  }

  const getCourtNumber = (matchId: number) => {
    // Court number is determined by match ID modulo 3, with 0 becoming 3
    const court = matchId % 3
    return court === 0 ? 3 : court
  }

  // Transform matches into the format expected by react-brackets
  const transformMatchesToRounds = (matches: Match[], bracketType: string): IRoundProps[] => {
    if (!matches || matches.length === 0) return []

    // Group matches by round
    const matchesByRound = matches.reduce((acc, match) => {
      const round = Math.abs(match.round)
      if (!acc[round]) {
        acc[round] = []
      }
      acc[round].push(match)
      return acc
    }, {} as Record<number, Match[]>)

    // Convert to rounds format
    const rounds: IRoundProps[] = Object.keys(matchesByRound)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map((roundNum) => {
        const roundMatches = matchesByRound[parseInt(roundNum)]
        return {
          title: `${bracketType} - Round ${roundNum}`,
          seeds: roundMatches.map((match) => ({
            id: match.match_id,
            date: match.played_at ? new Date(match.played_at).toLocaleDateString() : 'TBD',
            teams: [
              { 
                name: match.team1_name || (match.team1_id ? `Team ${match.team1_id}` : 'TBD'),
                id: match.team1_id,
                isWinner: match.winner_id === match.team1_id
              },
              { 
                name: match.team2_name || (match.team2_id ? `Team ${match.team2_id}` : 'TBD'),
                id: match.team2_id,
                isWinner: match.winner_id === match.team2_id
              }
            ],
            match: match // Store the original match data
          }))
        }
      })

    return rounds
  }

  // Custom seed component for winner's bracket
  const WinnerBracketSeed = ({ seed, breakpoint, roundIndex, seedIndex }: IRenderSeedProps) => {
    const match = seed.match as Match
    const status = getMatchStatus(match)
    const isPlayable = match.team1_id && match.team2_id && !match.winner_id

    return (
      <Seed mobileBreakpoint={breakpoint} style={{ fontSize: 12 }}>
        <SeedItem className="border border-gray-200 rounded-lg p-3 shadow-sm">
          <div className="w-full">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 font-medium">Court {getCourtNumber(match.match_id)}</span>
              <span className={status.color}>{status.icon}</span>
            </div>
            
            <div className="space-y-2">
              <SeedTeam 
                className={`px-3 py-2 rounded-md border transition-colors ${
                  seed.teams[0]?.isWinner 
                    ? 'bg-green-100 border-green-300 text-green-800 font-semibold' 
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {seed.teams[0]?.name || 'TBD'}
              </SeedTeam>
              <SeedTeam 
                className={`px-3 py-2 rounded-md border transition-colors ${
                  seed.teams[1]?.isWinner 
                    ? 'bg-green-100 border-green-300 text-green-800 font-semibold' 
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {seed.teams[1]?.name || 'TBD'}
              </SeedTeam>
            </div>
            
            {!readOnly && (
              <div className="flex gap-1 mt-3">
                {isPlayable && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm" 
                        className="flex-1 text-xs"
                        onClick={() => setSelectedMatch(match)}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Record Result
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
                        <div className="grid grid-cols-2 gap-4">
                          <Button
                            variant="outline"
                            onClick={() => updateMatchResult(match.match_id, match.team1_id!, match.team2_id!)}
                            disabled={updatingMatch}
                          >
                            {seed.teams[0]?.name || 'TBD'} Wins
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => updateMatchResult(match.match_id, match.team2_id!, match.team1_id!)}
                            disabled={updatingMatch}
                          >
                            {seed.teams[1]?.name || 'TBD'} Wins
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
                        size="sm" 
                        variant="outline"
                        className="text-xs"
                        disabled={resettingMatch === match.match_id}
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        {resettingMatch === match.match_id ? '...' : 'Reset'}
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
                          onClick={() => resetMatch(match.match_id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Reset Match
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            )}
          </div>
        </SeedItem>
      </Seed>
    )
  }

  // Custom seed component for loser's bracket
  const LoserBracketSeed = ({ seed, breakpoint, roundIndex, seedIndex }: IRenderSeedProps) => {
    const match = seed.match as Match
    const status = getMatchStatus(match)
    const isPlayable = match.team1_id && match.team2_id && !match.winner_id
    
    // Check if this round has the same number of seeds as the next round (for line connectors)
    const loserRounds = transformMatchesToRounds(data.matches.loser, 'Loser')
    const isLineConnector = loserRounds[roundIndex]?.seeds.length === loserRounds[roundIndex + 1]?.seeds.length

    const Wrapper = isLineConnector ? SingleLineSeed : Seed

    return (
      <Wrapper mobileBreakpoint={breakpoint} style={{ fontSize: 12 }}>
        <SeedItem className="border border-gray-200 rounded-lg p-3 shadow-sm">
          <div className="w-full">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 font-medium">Court {getCourtNumber(match.match_id)}</span>
              <span className={status.color}>{status.icon}</span>
            </div>
            
            <div className="space-y-2">
              <SeedTeam 
                className={`px-3 py-2 rounded-md border transition-colors ${
                  seed.teams[0]?.isWinner 
                    ? 'bg-green-100 border-green-300 text-green-800 font-semibold' 
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {seed.teams[0]?.name || 'TBD'}
              </SeedTeam>
              <SeedTeam 
                className={`px-3 py-2 rounded-md border transition-colors ${
                  seed.teams[1]?.isWinner 
                    ? 'bg-green-100 border-green-300 text-green-800 font-semibold' 
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {seed.teams[1]?.name || 'TBD'}
              </SeedTeam>
            </div>
            
            {!readOnly && (
              <div className="flex gap-1 mt-3">
                {isPlayable && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm" 
                        className="flex-1 text-xs"
                        onClick={() => setSelectedMatch(match)}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Record Result
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
                        <div className="grid grid-cols-2 gap-4">
                          <Button
                            variant="outline"
                            onClick={() => updateMatchResult(match.match_id, match.team1_id!, match.team2_id!)}
                            disabled={updatingMatch}
                          >
                            {seed.teams[0]?.name || 'TBD'} Wins
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => updateMatchResult(match.match_id, match.team2_id!, match.team1_id!)}
                            disabled={updatingMatch}
                          >
                            {seed.teams[1]?.name || 'TBD'} Wins
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
                        size="sm" 
                        variant="outline"
                        className="text-xs"
                        disabled={resettingMatch === match.match_id}
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        {resettingMatch === match.match_id ? '...' : 'Reset'}
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
                          onClick={() => resetMatch(match.match_id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Reset Match
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            )}
          </div>
        </SeedItem>
      </Wrapper>
    )
  }

  const winnerRounds = transformMatchesToRounds(data.matches.winner, 'Winner')
  const loserRounds = transformMatchesToRounds(data.matches.loser, 'Loser')
  const finalRounds = transformMatchesToRounds(data.matches.final, 'Final')

  return (
    <div className="space-y-8 bg-white p-6 rounded-lg">
      {/* Winner's Bracket */}
      {winnerRounds.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b border-gray-200 pb-2">Winner's Bracket</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <Bracket rounds={winnerRounds} renderSeedComponent={WinnerBracketSeed} />
          </div>
        </div>
      )}

      {/* Loser's Bracket */}
      {loserRounds.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b border-gray-200 pb-2">Loser's Bracket</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <Bracket rounds={loserRounds} renderSeedComponent={LoserBracketSeed} />
          </div>
        </div>
      )}

      {/* Finals */}
      {finalRounds.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b border-gray-200 pb-2">Finals</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <Bracket rounds={finalRounds} renderSeedComponent={WinnerBracketSeed} />
          </div>
        </div>
      )}
    </div>
  )
} 