import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { HeatCard } from "@/components/heat-card"
import { startHeat, completeHeat, completeHeatEvent } from "./actions"

async function getEventDetails(eventId: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/events/${eventId}`, {
    cache: 'no-store',
    next: { revalidate: 0 }
  });
  if (!res.ok) throw new Error('Failed to fetch event');
  const data = await res.json();
  return data.event;
}

async function getHeatMatches(eventId: string) {
  const url = `${process.env.NEXT_PUBLIC_API_URL}/api/events/${eventId}/heat-matches`;
  const res = await fetch(url, {
    cache: 'no-store',
    next: { revalidate: 0 }
  });

  if (!res.ok) {
    const errorText = await res.text();
    if (res.status === 404) {
      return []; // Return empty array if event not found
    }
    if (res.status === 400) {
      return []; // Return empty array if not a heat event
    }
    throw new Error('Failed to fetch heat matches');
  }

  const data = await res.json();
  return data.matches || [];
}

async function getEventStandings(eventId: string) {
  const url = `${process.env.NEXT_PUBLIC_API_URL}/api/events/${eventId}/standings`;
  const res = await fetch(url, {
    cache: 'no-store',
    next: { revalidate: 0 }
  });

  if (!res.ok) {
    return null;
  }

  const data = await res.json();
  return data.standings || null;
}

export default async function EventPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const event = await getEventDetails(eventId)
  const heatMatches = event.event_type === 'HEAT' ? await getHeatMatches(eventId) : null
  const standings = event.event_status === 'COMPLETED' ? await getEventStandings(eventId) : null

  if (!event) {
    notFound()
  }

  const allHeatsCompleted = heatMatches?.every((match: any) => match.heat_status === 'COMPLETED')

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/events">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Events
        </Button>
      </Link>

      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-3xl">{event.event_name}</CardTitle>
              <CardDescription>
                {event.event_type === 'HEAT' ? 'Heat-based Event' : 'Head-to-Head Event'}
              </CardDescription>
            </div>
            {event.event_type === 'HEAT' && allHeatsCompleted && event.event_status !== 'COMPLETED' && (
              <form action={async (formData: FormData) => {
                'use server'
                const eventId = formData.get('eventId') as string
                await completeHeatEvent(eventId)
              }}>
                <input type="hidden" name="eventId" value={eventId} />
                <Button type="submit" variant="default">
                  Complete Event & Calculate Standings
                </Button>
              </form>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {event.event_type === 'HEAT' ? (
            <div className="space-y-8">
              {standings && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Final Standings</h3>
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
                        {standings.map((standing: any) => (
                          <tr key={standing.team_name} className="border-b transition-colors hover:bg-muted/50">
                            <td className="p-4 align-middle">{standing.rank}</td>
                            <td className="p-4 align-middle font-medium">{standing.team_name}</td>
                            <td className="p-4 align-middle text-right">{standing.point_value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Heat Matches</h3>
                {heatMatches && heatMatches.length > 0 ? (
                  <div className="grid gap-4">
                    {heatMatches.map((match: any) => (
                      <HeatCard
                        key={match.heat_id}
                        heat={match}
                        onStartHeat={startHeat}
                        onCompleteHeat={completeHeat}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-muted-foreground text-center py-4">
                    No heat matches recorded yet.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground text-center py-4">
              Head-to-head matches will be displayed here.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
