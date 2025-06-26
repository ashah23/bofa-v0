"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Trophy } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { ReactBracketView } from "@/components/react-bracket-view"

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
      } else {
        alert('Failed to update match: ' + result.error)
      }
    } catch (err) {
      alert('Failed to update match')
      console.error('Error updating match:', err)
    }
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
          <div className="h-16 w-16 text-red-500 mx-auto mb-4">⚠️</div>
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

      {/* Bracket Display using react-brackets */}
      {data && (
        <ReactBracketView 
          data={data} 
          eventId={eventId} 
          onUpdateMatch={updateMatchResult}
        />
      )}
    </div>
  )
} 