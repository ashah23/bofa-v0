"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Trophy, Users, CheckCircle, Clock, XCircle, Play } from "lucide-react"
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

interface BracketData {
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

export default function BracketPage() {
  const params = useParams()
  const eventId = params.eventId as string
  
  const [data, setData] = useState<BracketData | null>(null)
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [updatingMatch, setUpdatingMatch] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch event details
        const eventResponse = await fetch(`/api/events/${eventId}`)
        const eventData = await eventResponse.json()
        setEvent(eventData)

        // Fetch bracket data
        const bracketResponse = await fetch(`/api/events/${eventId}/double-elimination-matches`)
        const bracketData = await bracketResponse.json()
        
        if (bracketData.success) {
          setData(bracketData)
        } else {
          setError(bracketData.error || 'Failed to fetch bracket data')
        }
      } catch (err) {
        setError('Failed to fetch data')
        console.error('Error fetching bracket data:', err)
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
        const bracketResponse = await fetch(`/api/events/${eventId}/double-elimination-matches`)
        const bracketData = await bracketResponse.json()
        if (bracketData.success) {
          setData(bracketData)
        }
        setSelectedMatch(null)
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
      return { status: 'completed', icon: <CheckCircle className="h-4 w-4 text-green-500" /> }
    }
    if (match.team1_id && match.team2_id) {
      return { status: 'ready', icon: <Clock className="h-4 w-4 text-yellow-500" /> }
    }
    return { status: 'pending', icon: <XCircle className="h-4 w-4 text-gray-400" /> }
  }

  const getBracketName = (bracket: string) => {
    switch (bracket) {
      case 'W': return 'Winner\'s Bracket'
      case 'L': return 'Loser\'s Bracket'
      case 'F': return 'Finals'
      default: return bracket
    }
  }

  const renderMatch = (match: Match) => {
    const status = getMatchStatus(match)
    const isPlayable = match.team1_id && match.team2_id && !match.winner_id

    return (
      <Card key={match.match_id} className="w-full max-w-sm">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline" className="text-xs">
              {getBracketName(match.bracket)} - R{match.round} M{match.match_number}
            </Badge>
            {status.icon}
          </div>
          
          <div className="space-y-2">
            <div className={`p-2 rounded border ${match.winner_id && match.team1_id && match.winner_id === match.team1_id ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
              <span className="font-medium">
                {match.team1_name || (match.team1_id ? `Team ${match.team1_id}` : 'TBD')}
              </span>
              {match.winner_id && match.team1_id && match.winner_id === match.team1_id && <CheckCircle className="h-4 w-4 text-green-500 inline ml-2" />}
            </div>
            
            <div className="text-center text-sm text-gray-500">vs</div>
            
            <div className={`p-2 rounded border ${match.winner_id && match.team2_id && match.winner_id === match.team2_id ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
              <span className="font-medium">
                {match.team2_name || (match.team2_id ? `Team ${match.team2_id}` : 'TBD')}
              </span>
              {match.winner_id && match.team2_id && match.winner_id === match.team2_id && <CheckCircle className="h-4 w-4 text-green-500 inline ml-2" />}
            </div>
          </div>

          {isPlayable && (
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  size="sm" 
                  className="w-full mt-3"
                  onClick={() => setSelectedMatch(match)}
                >
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
        </CardContent>
      </Card>
    )
  }

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
          <h2 className="text-2xl font-bold mb-2">Error Loading Bracket</h2>
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
            <p className="text-muted-foreground">Tournament Bracket</p>
          </div>
        </div>
        <Trophy className="h-8 w-8 text-yellow-500" />
      </div>

      {/* Bracket Display */}
      <div className="space-y-8">
        {/* Winner's Bracket */}
        {data?.matches.winner && data.matches.winner.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Winner's Bracket
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {data.matches.winner.map(renderMatch)}
            </div>
          </div>
        )}

        {/* Loser's Bracket */}
        {data?.matches.loser && data.matches.loser.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-500" />
              Loser's Bracket
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {data.matches.loser.map(renderMatch)}
            </div>
          </div>
        )}

        {/* Finals */}
        {data?.matches.final && data.matches.final.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Finals
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {data.matches.final.map(renderMatch)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 