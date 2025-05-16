import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

async function getEvents() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/events`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch events');
  const data = await res.json();

  // Sort events by date in descending order (newest first)
  return data.events.sort((a: any, b: any) => {
    // Handle cases where event_date might be null
    if (!a.event_date) return -1;
    if (!b.event_date) return 1;
    return new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
  });
}

export default async function EventsPage() {
  const events = await getEvents();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Events</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event: any) => (
          <Link href={`/events/${event.event_id}`} key={event.event_id}>
            <Card className="h-full hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle>{event.event_name}</CardTitle>
                </div>
                <CardDescription>{event.event_type}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {event.event_date ? new Date(event.event_date).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    }) : 'TBD'}
                  </span>
                  <Badge variant={event.event_status === 'COMPLETED' ? 'default' : 'outline'}>
                    {event.event_status || 'SCHEDULED'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
