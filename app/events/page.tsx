import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { events } from "@/lib/data"
import Link from "next/link"

export default function EventsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Events</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <Link href={`/events/${event.id}`} key={event.id}>
            <Card
              key={event.id}
              className={`${event.completed ? "bg-muted/50" : ""} h-full hover:shadow-md transition-shadow`}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle>{event.name}</CardTitle>
                  <Badge variant={event.type === "head-to-head" ? "default" : "secondary"}>
                    {event.type === "head-to-head" ? "Head to Head" : "Heat"}
                  </Badge>
                </div>
                <CardDescription>{event.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Points: {event.pointsAwarded}</span>
                  <Badge variant={event.completed ? "outline" : "destructive"}>
                    {event.completed ? "Completed" : "Upcoming"}
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
