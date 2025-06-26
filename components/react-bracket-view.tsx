"use client"

import { Bracket, IRoundProps, Seed, SingleLineSeed, SeedItem, SeedTeam, IRenderSeedProps } from 'react-brackets'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CheckCircle, Clock, XCircle, Play } from "lucide-react"
import { useState } from "react"

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
  eventId: number
}

interface ReactBracketViewProps {
  data: BracketData
  eventId: string
  onUpdateMatch: (matchId: number, winnerId: number, loserId: number) => Promise<void>
}

export function ReactBracketView({ data, eventId, onUpdateMatch }: ReactBracketViewProps) {
  const [updatingMatch, setUpdatingMatch] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)

  const getMatchStatus = (match: Match) => {
    if (match.winner_id) {
      return { status: 'completed', icon: <CheckCircle className="h-4 w-4 text-green-500" /> }
    }
    if (match.team1_id && match.team2_id) {
      return { status: 'ready', icon: <Clock className="h-4 w-4 text-yellow-500" /> }
    }
    return { status: 'pending', icon: <XCircle className="h-4 w-4 text-gray-400" /> }
  }

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
        <SeedItem>
          <div className="w-full">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">Match {match.match_number}</span>
              {status.icon}
            </div>
            <div className="space-y-1">
              <SeedTeam 
                style={{ 
                  color: seed.teams[0]?.isWinner ? '#16a34a' : '#374151',
                  backgroundColor: seed.teams[0]?.isWinner ? '#f0fdf4' : 'transparent',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontWeight: seed.teams[0]?.isWinner ? 'bold' : 'normal'
                }}
              >
                {seed.teams[0]?.name || 'TBD'}
              </SeedTeam>
              <SeedTeam 
                style={{ 
                  color: seed.teams[1]?.isWinner ? '#16a34a' : '#374151',
                  backgroundColor: seed.teams[1]?.isWinner ? '#f0fdf4' : 'transparent',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontWeight: seed.teams[1]?.isWinner ? 'bold' : 'normal'
                }}
              >
                {seed.teams[1]?.name || 'TBD'}
              </SeedTeam>
            </div>
            {isPlayable && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    size="sm" 
                    className="w-full mt-2 text-xs"
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
        <SeedItem>
          <div className="w-full">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">Match {match.match_number}</span>
              {status.icon}
            </div>
            <div className="space-y-1">
              <SeedTeam 
                style={{ 
                  color: seed.teams[0]?.isWinner ? '#16a34a' : '#374151',
                  backgroundColor: seed.teams[0]?.isWinner ? '#f0fdf4' : 'transparent',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontWeight: seed.teams[0]?.isWinner ? 'bold' : 'normal'
                }}
              >
                {seed.teams[0]?.name || 'TBD'}
              </SeedTeam>
              <SeedTeam 
                style={{ 
                  color: seed.teams[1]?.isWinner ? '#16a34a' : '#374151',
                  backgroundColor: seed.teams[1]?.isWinner ? '#f0fdf4' : 'transparent',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontWeight: seed.teams[1]?.isWinner ? 'bold' : 'normal'
                }}
              >
                {seed.teams[1]?.name || 'TBD'}
              </SeedTeam>
            </div>
            {isPlayable && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    size="sm" 
                    className="w-full mt-2 text-xs"
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
          </div>
        </SeedItem>
      </Wrapper>
    )
  }

  const winnerRounds = transformMatchesToRounds(data.matches.winner, 'Winner')
  const loserRounds = transformMatchesToRounds(data.matches.loser, 'Loser')
  const finalRounds = transformMatchesToRounds(data.matches.final, 'Final')

  return (
    <div className="space-y-8">
      {/* Winner's Bracket */}
      {winnerRounds.length > 0 && (
        <div className="bracket-container">
          <h2 className="text-2xl font-semibold mb-4 p-4 border-b">Winner's Bracket</h2>
          <div className="overflow-x-auto p-4">
            <Bracket 
              rounds={winnerRounds} 
              renderSeedComponent={WinnerBracketSeed}
              mobileBreakpoint={768}
              bracketClassName="bracket-container"
              roundClassName="bracket-round"
            />
          </div>
        </div>
      )}

      {/* Loser's Bracket */}
      {loserRounds.length > 0 && (
        <div className="bracket-container">
          <h2 className="text-2xl font-semibold mb-4 p-4 border-b">Loser's Bracket</h2>
          <div className="overflow-x-auto p-4">
            <Bracket 
              rounds={loserRounds} 
              renderSeedComponent={LoserBracketSeed}
              mobileBreakpoint={768}
              bracketClassName="bracket-container"
              roundClassName="bracket-round"
            />
          </div>
        </div>
      )}

      {/* Finals */}
      {finalRounds.length > 0 && (
        <div className="bracket-container">
          <h2 className="text-2xl font-semibold mb-4 p-4 border-b">Finals</h2>
          <div className="overflow-x-auto p-4">
            <Bracket 
              rounds={finalRounds} 
              renderSeedComponent={WinnerBracketSeed}
              mobileBreakpoint={768}
              bracketClassName="bracket-container"
              roundClassName="bracket-round"
            />
          </div>
        </div>
      )}
    </div>
  )
} 