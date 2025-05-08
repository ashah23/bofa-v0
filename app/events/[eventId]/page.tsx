import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"

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

export default async function EventPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const event = await getEventDetails(eventId)
  const heatMatches = event.event_type === 'HEAT' ? await getHeatMatches(eventId) : null

  if (!event) {
    notFound()
  }

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
          <CardTitle className="text-3xl">{event.event_name}</CardTitle>
          <CardDescription>
            {event.event_type === 'HEAT' ? 'Heat-based Event' : 'Head-to-Head Event'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {event.event_type === 'HEAT' ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Heat Matches</h3>
              {heatMatches && heatMatches.length > 0 ? (
                <div className="grid gap-4">
                  {heatMatches.map((match: any) => (
                    <Card key={match.heat_id}>
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <div className="font-medium">Heat {match.heat_number}</div>
                            <Badge variant={
                              match.heat_status === 'COMPLETED' ? 'destructive' :
                                match.heat_status === 'IN_PROGRESS' ? 'default' :
                                  'secondary'
                            } className={
                              match.heat_status === 'IN_PROGRESS' ? 'bg-green-300 hover:bg-green-400' :
                                match.heat_status === 'COMPLETED' ? 'bg-orange-300 hover:bg-orange-400' :
                                  'bg-blue-300 hover:bg-blue-400'
                            }>
                              {match.heat_status === 'COMPLETED' ? 'Completed' :
                                match.heat_status === 'IN_PROGRESS' ? 'In Progress' :
                                  'Scheduled'}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            {match.team1_name && (
                              <div className="flex justify-between items-center">
                                <span>{match.team1_name}</span>
                                <span className="text-muted-foreground">
                                  {match.team1_time ? `${match.team1_time}s` : 'Pending'}
                                </span>
                              </div>
                            )}
                            {match.team2_name && (
                              <div className="flex justify-between items-center">
                                <span>{match.team2_name}</span>
                                <span className="text-muted-foreground">
                                  {match.team2_time ? `${match.team2_time}s` : 'Pending'}
                                </span>
                              </div>
                            )}
                            {match.team3_name && (
                              <div className="flex justify-between items-center">
                                <span>{match.team3_name}</span>
                                <span className="text-muted-foreground">
                                  {match.team3_time ? `${match.team3_time}s` : 'Pending'}
                                </span>
                              </div>
                            )}
                            {match.team4_name && (
                              <div className="flex justify-between items-center">
                                <span>{match.team4_name}</span>
                                <span className="text-muted-foreground">
                                  {match.team4_time ? `${match.team4_time}s` : 'Pending'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground text-center py-4">
                  No heat matches recorded yet.
                </div>
              )}
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
