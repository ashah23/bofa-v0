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

interface BracketData {
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

  const getTeamDisplayName = (match: Match, teamIndex: 1 | 2) => {
    if (teamIndex === 1) {
      return match.team1_name || (match.team1_id ? `Team ${match.team1_id}` : 'TBD')
    } else {
      return match.team2_name || (match.team2_id ? `Team ${match.team2_id}` : 'TBD')
    }
  }

  const hasTBDTeam = (match: Match) => {
    const team1Name = getTeamDisplayName(match, 1)
    const team2Name = getTeamDisplayName(match, 2)
    return team1Name === 'TBD' || team2Name === 'TBD'
  }

  const getMatchBackgroundColor = (match: Match) => {
    // If there's a TBD team, always show muted gray regardless of completion status
    if (hasTBDTeam(match)) {
      return 'bg-gray-200'
    }
    
    // Otherwise use normal logic
    if (match.winner_id) {
      return 'bg-green-50'
    }
    if (match.team1_id && match.team2_id) {
      return 'bg-yellow-50'
    }
    return 'bg-gray-50'
  }

  const getTeamClassName = (isWinner: boolean) => {
    return isWinner 
      ? 'bg-green-100 border-green-300 text-green-800 font-semibold' 
      : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-900'
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
                name: getTeamDisplayName(match, 1),
                id: match.team1_id,
                isWinner: match.winner_id === match.team1_id && match.team1_id !== null
              },
              { 
                name: getTeamDisplayName(match, 2),
                id: match.team2_id,
                isWinner: match.winner_id === match.team2_id && match.team2_id !== null
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
        <SeedItem className={`${getMatchBackgroundColor(match)} border border-gray-200 rounded-lg p-3 shadow-sm`}>
          <div className="w-full">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 font-medium">Court {getCourtNumber(match.match_id)}</span>
              <span className={status.color}>{status.icon}</span>
            </div>
            
            <div className="space-y-2">
              <SeedTeam className={`px-3 py-2 rounded-md border transition-colors ${getTeamClassName(seed.teams[0]?.isWinner || false)}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{seed.teams[0]?.name || 'TBD'}</span>
                  {seed.teams[0]?.isWinner && <span className="text-green-600">✓</span>}
                </div>
              </SeedTeam>
              
              <SeedTeam className={`px-3 py-2 rounded-md border transition-colors ${getTeamClassName(seed.teams[1]?.isWinner || false)}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{seed.teams[1]?.name || 'TBD'}</span>
                  {seed.teams[1]?.isWinner && <span className="text-green-600">✓</span>}
                </div>
              </SeedTeam>
            </div>

            {!readOnly && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
                {isPlayable && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm" 
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
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
                          Select the winner of this match.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Button
                          className="w-full justify-start p-4 h-auto"
                          variant="outline"
                          onClick={() => updateMatchResult(match.match_id, match.team1_id!, match.team2_id!)}
                          disabled={updatingMatch}
                        >
                          <div className="text-left">
                            <div className="font-semibold">{seed.teams[0]?.name}</div>
                            <div className="text-sm text-gray-500">Click to select as winner</div>
                          </div>
                        </Button>
                        <Button
                          className="w-full justify-start p-4 h-auto"
                          variant="outline"
                          onClick={() => updateMatchResult(match.match_id, match.team2_id!, match.team1_id!)}
                          disabled={updatingMatch}
                        >
                          <div className="text-left">
                            <div className="font-semibold">{seed.teams[1]?.name}</div>
                            <div className="text-sm text-gray-500">Click to select as winner</div>
                          </div>
                        </Button>
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
                        className="border-red-200 text-red-600 hover:bg-red-50"
                        disabled={resettingMatch === match.match_id}
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        {resettingMatch === match.match_id ? 'Resetting...' : 'Reset'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reset Match</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to reset this match? This will clear the result and allow it to be played again.
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

    return (
      <Seed mobileBreakpoint={breakpoint} style={{ fontSize: 12 }}>
        <SeedItem className={`${getMatchBackgroundColor(match)} border border-gray-200 rounded-lg p-3 shadow-sm`}>
          <div className="w-full">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 font-medium">Court {getCourtNumber(match.match_id)}</span>
              <span className={status.color}>{status.icon}</span>
            </div>
            
            <div className="space-y-2">
              <SeedTeam className={`px-3 py-2 rounded-md border transition-colors ${getTeamClassName(seed.teams[0]?.isWinner || false)}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{seed.teams[0]?.name || 'TBD'}</span>
                  {seed.teams[0]?.isWinner && <span className="text-green-600">✓</span>}
                </div>
              </SeedTeam>
              
              <SeedTeam className={`px-3 py-2 rounded-md border transition-colors ${getTeamClassName(seed.teams[1]?.isWinner || false)}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{seed.teams[1]?.name || 'TBD'}</span>
                  {seed.teams[1]?.isWinner && <span className="text-green-600">✓</span>}
                </div>
              </SeedTeam>
            </div>

            {!readOnly && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
                {isPlayable && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm" 
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
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
                          Select the winner of this match.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Button
                          className="w-full justify-start p-4 h-auto"
                          variant="outline"
                          onClick={() => updateMatchResult(match.match_id, match.team1_id!, match.team2_id!)}
                          disabled={updatingMatch}
                        >
                          <div className="text-left">
                            <div className="font-semibold">{seed.teams[0]?.name}</div>
                            <div className="text-sm text-gray-500">Click to select as winner</div>
                          </div>
                        </Button>
                        <Button
                          className="w-full justify-start p-4 h-auto"
                          variant="outline"
                          onClick={() => updateMatchResult(match.match_id, match.team2_id!, match.team1_id!)}
                          disabled={updatingMatch}
                        >
                          <div className="text-left">
                            <div className="font-semibold">{seed.teams[1]?.name}</div>
                            <div className="text-sm text-gray-500">Click to select as winner</div>
                          </div>
                        </Button>
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
                        className="border-red-200 text-red-600 hover:bg-red-50"
                        disabled={resettingMatch === match.match_id}
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        {resettingMatch === match.match_id ? 'Resetting...' : 'Reset'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reset Match</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to reset this match? This will clear the result and allow it to be played again.
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

  // Filter out hidden matches
  const visibleWinnerMatches = data.matches.winner.filter(match => !match.is_hidden)
  const visibleLoserMatches = data.matches.loser.filter(match => !match.is_hidden)
  const visibleFinalMatches = data.matches.final.filter(match => !match.is_hidden)
  const visible9to12Matches = data.matches['9-12']?.filter(match => !match.is_hidden) || []
  const visible7to8Matches = data.matches['7-8']?.filter(match => !match.is_hidden) || []
  const visible5to6Matches = data.matches['5-6']?.filter(match => !match.is_hidden) || []
  const visible11to12Matches = data.matches['11-12']?.filter(match => !match.is_hidden) || []
  const visible9to10Matches = data.matches['9-10']?.filter(match => !match.is_hidden) || []

  const winnerRounds = transformMatchesToRounds(visibleWinnerMatches, 'Winner')
  const loserRounds = transformMatchesToRounds(visibleLoserMatches, 'Loser')
  const finalRounds = transformMatchesToRounds(visibleFinalMatches, 'Final')
  const nineToTwelveRounds = transformMatchesToRounds(visible9to12Matches, '9-12')
  const sevenToEightRounds = transformMatchesToRounds(visible7to8Matches, '7-8')
  const fiveToSixRounds = transformMatchesToRounds(visible5to6Matches, '5-6')
  const elevenToTwelveRounds = transformMatchesToRounds(visible11to12Matches, '11-12')
  const nineToTenRounds = transformMatchesToRounds(visible9to10Matches, '9-10')

  return (
    <div className="space-y-8">
      {/* Winner's Bracket */}
      {winnerRounds.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Winner's Bracket</h2>
          <Bracket
            rounds={winnerRounds}
            renderSeedComponent={WinnerBracketSeed}
            rtl={false}
          />
        </div>
      )}

      {/* Loser's Bracket */}
      {loserRounds.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Loser's Bracket</h2>
          <Bracket
            rounds={loserRounds}
            renderSeedComponent={LoserBracketSeed}
            rtl={false}
          />
        </div>
      )}

      {/* Final Bracket */}
      {finalRounds.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Final</h2>
          <Bracket
            rounds={finalRounds}
            renderSeedComponent={WinnerBracketSeed}
            rtl={false}
          />
        </div>
      )}

      {/* 9-12 Placement Bracket */}
      {nineToTwelveRounds.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">9-12 Placement</h2>
          <Bracket
            rounds={nineToTwelveRounds}
            renderSeedComponent={WinnerBracketSeed}
            rtl={false}
          />
        </div>
      )}

      {/* 7-8 Placement Bracket */}
      {sevenToEightRounds.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">7-8 Placement</h2>
          <Bracket
            rounds={sevenToEightRounds}
            renderSeedComponent={WinnerBracketSeed}
            rtl={false}
          />
        </div>
      )}

      {/* 5-6 Placement Bracket */}
      {fiveToSixRounds.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">5-6 Placement</h2>
          <Bracket
            rounds={fiveToSixRounds}
            renderSeedComponent={WinnerBracketSeed}
            rtl={false}
          />
        </div>
      )}

      {/* 11-12 Placement Bracket */}
      {elevenToTwelveRounds.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">11-12 Placement</h2>
          <Bracket
            rounds={elevenToTwelveRounds}
            renderSeedComponent={WinnerBracketSeed}
            rtl={false}
          />
        </div>
      )}

      {/* 9-10 Placement Bracket */}
      {nineToTenRounds.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">9-10 Placement</h2>
          <Bracket
            rounds={nineToTenRounds}
            renderSeedComponent={WinnerBracketSeed}
            rtl={false}
          />
        </div>
      )}
    </div>
  )
} 