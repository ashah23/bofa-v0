import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Award, Medal } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { HeatCard } from "@/components/heat-card"
import { startHeat, completeHeat, completeHeatEvent, resetHeatEvent } from "./heat_actions"

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
                {event.event_type === 'HEAT' ? 'Heat-based Event' : 'Group & Knockout Event'}
              </CardDescription>
            </div>
            <div className="flex gap-4">
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
              {event.event_type === 'HEAT' && event.event_status === 'COMPLETED' && (
                <form action={async (formData: FormData) => {
                  'use server'
                  const eventId = formData.get('eventId') as string
                  await resetHeatEvent(eventId)
                }}>
                  <input type="hidden" name="eventId" value={eventId} />
                  <Button type="submit" variant="destructive">
                    Reset Event
                  </Button>
                </form>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {event.event_type === 'HEAT' ? (
            <div className="space-y-8">
              {standings && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Final Standings</h3>

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
                          <span className="font-bold text-gray-600">{standings[1]?.team_name}</span>
                          <span className="text-sm text-gray-500">{standings[1]?.point_value} pts</span>
                          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gray-200 px-4 py-1 rounded-full">
                            <span className="font-bold text-gray-600">2nd</span>
                          </div>
                        </div>

                        {/* 1st Place */}
                        <div className="w-1/3 h-[200px] bg-yellow-100 rounded-t-xl flex flex-col items-center justify-center relative">
                          <Medal className="h-12 w-12 text-yellow-500 mb-2" />
                          <span className="font-bold text-yellow-600">{standings[0]?.team_name}</span>
                          <span className="text-sm text-yellow-500">{standings[0]?.point_value} pts</span>
                          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-yellow-100 px-4 py-1 rounded-full">
                            <span className="font-bold text-yellow-600">1st</span>
                          </div>
                        </div>

                        {/* 3rd Place */}
                        <div className="w-1/3 h-[120px] bg-amber-100 rounded-t-xl flex flex-col items-center justify-center relative">
                          <Award className="h-8 w-8 text-amber-700 mb-2" />
                          <span className="font-bold text-amber-700">{standings[2]?.team_name}</span>
                          <span className="text-sm text-amber-600">{standings[2]?.point_value} pts</span>
                          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-amber-100 px-4 py-1 rounded-full">
                            <span className="font-bold text-amber-700">3rd</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Rest of the Teams */}
                  {standings.length > 3 && (
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
                          {standings.slice(3).map((standing: any) => (
                            <tr key={standing.team_name} className="border-b transition-colors hover:bg-muted/50">
                              <td className="p-4 align-middle">{standing.rank}</td>
                              <td className="p-4 align-middle font-medium">{standing.team_name}</td>
                              <td className="p-4 align-middle text-right">{standing.point_value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

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
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <Link href={`/group-knockout?eventId=${eventId}`} className="text-primary hover:underline">
                View Group & Knockout Details
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
