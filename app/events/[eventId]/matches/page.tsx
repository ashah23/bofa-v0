"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Trophy, Users, CheckCircle, Clock, XCircle, Play, Filter, Search, Calendar } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"

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

interface MatchesData {
  matches: {
    winner: Match[]
    loser: Match[]
    final: Match[]
  }
  eventId: number
}

interface Event {
  event_id: number
  event_name: string
  event_type: string
}

export default function MatchesPage() {
  const params = useParams()
  const eventId = params.eventId as string
  
  const [data, setData] = useState<MatchesData | null>(null)
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingMatch, setUpdatingMatch] = useState(false)
  
  // Filter states
  const [bracketFilter, setBracketFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch event details
        const eventResponse = await fetch(`/api/events/${eventId}`)
        const eventData = await eventResponse.json()
        setEvent(eventData)

        // Fetch matches data
        const matchesResponse = await fetch(`/api/events/${eventId}/double-elimination-matches`)
        const matchesData = await matchesResponse.json()
        
        if (matchesData.success) {
          setData(matchesData)
        } else {
          setError(matchesData.error || 'Failed to fetch matches data')
        }
      } catch (err) {
        setError('Failed to fetch data')
        console.error('Error fetching matches data:', err)
      } finally {
        setLoading(false)
      }
    }

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
        // Refresh the data
        const matchesResponse = await fetch(`/api/events/${eventId}/double-elimination-matches`)
        const matchesData = await matchesResponse.json()
        if (matchesData.success) {
          setData(matchesData)
        }
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

  const getMatchStatus = (match: Match) => {
    if (match.winner_id) {
      return { status: 'completed', icon: <CheckCircle className="h-4 w-4 text-green-500" />, label: 'Completed' }
    }
    if (match.team1_id && match.team2_id) {
      return { status: 'ready', icon: <Clock className="h-4 w-4 text-yellow-500" />, label: 'Ready to Play' }
    }
    return { status: 'pending', icon: <XCircle className="h-4 w-4 text-gray-400" />, label: 'Pending' }
  }

  const getBracketName = (bracket: string) => {
    switch (bracket) {
      case 'W': return 'Winner\'s Bracket'
      case 'L': return 'Loser\'s Bracket'
      case 'F': return 'Finals'
      default: return bracket
    }
  }

  const getBracketColor = (bracket: string) => {
    switch (bracket) {
      case 'W': return 'bg-blue-100 text-blue-800'
      case 'L': return 'bg-orange-100 text-orange-800'
      case 'F': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not played'
    return new Date(dateString).toLocaleString()
  }

  // Get all matches and apply filters
  const getAllMatches = () => {
    if (!data) return []
    
    const allMatches = [
      ...data.matches.winner.map(m => ({ ...m, bracketType: 'winner' })),
      ...data.matches.loser.map(m => ({ ...m, bracketType: 'loser' })),
      ...data.matches.final.map(m => ({ ...m, bracketType: 'final' }))
    ]

    return allMatches.filter(match => {
      // Bracket filter
      if (bracketFilter !== 'all') {
        if (bracketFilter === 'winner' && match.bracket !== 'W') return false
        if (bracketFilter === 'loser' && match.bracket !== 'L') return false
        if (bracketFilter === 'final' && match.bracket !== 'F') return false
      }

      // Status filter
      if (statusFilter !== 'all') {
        const status = getMatchStatus(match)
        if (statusFilter === 'completed' && status.status !== 'completed') return false
        if (statusFilter === 'ready' && status.status !== 'ready') return false
        if (statusFilter === 'pending' && status.status !== 'pending') return false
      }

      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const team1Name = match.team1_name?.toLowerCase() || ''
        const team2Name = match.team2_name?.toLowerCase() || ''
        const winnerName = match.winner_name?.toLowerCase() || ''
        const loserName = match.loser_name?.toLowerCase() || ''
        
        if (!team1Name.includes(searchLower) && 
            !team2Name.includes(searchLower) && 
            !winnerName.includes(searchLower) && 
            !loserName.includes(searchLower)) {
          return false
        }
      }

      return true
    }).sort((a, b) => {
      // Sort by bracket (W, L, F), then by round, then by match number
      const bracketOrder = { 'W': 1, 'L': 2, 'F': 3 }
      const aOrder = bracketOrder[a.bracket as keyof typeof bracketOrder] || 0
      const bOrder = bracketOrder[b.bracket as keyof typeof bracketOrder] || 0
      
      if (aOrder !== bOrder) return aOrder - bOrder
      if (a.round !== b.round) return a.round - b.round
      return a.match_number - b.match_number
    })
  }

  const filteredMatches = getAllMatches()

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Error Loading Matches</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/events/${eventId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Event
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{event?.event_name}</h1>
            <p className="text-muted-foreground">All Tournament Matches</p>
          </div>
        </div>
        <Trophy className="h-8 w-8 text-yellow-500" />
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search Teams</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search teams..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Bracket</label>
              <Select value={bracketFilter} onValueChange={setBracketFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brackets</SelectItem>
                  <SelectItem value="winner">Winner's Bracket</SelectItem>
                  <SelectItem value="loser">Loser's Bracket</SelectItem>
                  <SelectItem value="final">Finals</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="ready">Ready to Play</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Results</label>
              <div className="text-sm text-muted-foreground">
                {filteredMatches.length} of {getAllMatches().length} matches
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Matches List */}
      <div className="space-y-4">
        {filteredMatches.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No matches found</h3>
                <p className="text-muted-foreground">Try adjusting your filters</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredMatches.map((match) => {
            const status = getMatchStatus(match)
            const isPlayable = match.team1_id && match.team2_id && !match.winner_id

            return (
              <Card key={match.match_id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Badge className={getBracketColor(match.bracket)}>
                        {getBracketName(match.bracket)}
                      </Badge>
                      <div>
                        <h3 className="font-semibold">
                          Round {Math.abs(match.round)} - Match {match.match_number}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(match.played_at)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {match.team1_name || (match.team1_id ? `Team ${match.team1_id}` : 'TBD')}
                          </span>
                          {match.winner_id && match.team1_id && match.winner_id === match.team1_id && <CheckCircle className="h-4 w-4 text-green-500" />}
                        </div>
                        <div className="text-sm text-muted-foreground">vs</div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {match.team2_name || (match.team2_id ? `Team ${match.team2_id}` : 'TBD')}
                          </span>
                          {match.winner_id && match.team2_id && match.winner_id === match.team2_id && <CheckCircle className="h-4 w-4 text-green-500" />}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {status.icon}
                        <span className="text-sm font-medium">{status.label}</span>
                      </div>
                      
                      {isPlayable && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm">
                              <Play className="h-4 w-4 mr-2" />
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
                                  {match.team1_name || (match.team1_id ? `Team ${match.team1_id}` : 'TBD')} Wins
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => updateMatchResult(match.match_id, match.team2_id!, match.team1_id!)}
                                  disabled={updatingMatch}
                                >
                                  {match.team2_name || (match.team2_id ? `Team ${match.team2_id}` : 'TBD')} Wins
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
} 