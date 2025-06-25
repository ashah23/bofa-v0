import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Award, Medal, Trophy } from "lucide-react"
import Link from "next/link"

interface DoubleEliminationEventViewProps {
  event: any
  eventId: string
}

export function DoubleEliminationEventView({ event, eventId }: DoubleEliminationEventViewProps) {
  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-3xl">{event.event_name}</CardTitle>
            <CardDescription>Double Elimination Tournament</CardDescription>
          </div>
          <div className="flex gap-4">
            {/* Add any double elimination specific actions here */}
            <Button variant="outline" asChild>
              <Link href={`/events/${eventId}/bracket`}>
                View Bracket
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          <div className="text-center py-8">
            <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Double Elimination Tournament</h3>
            <p className="text-muted-foreground mb-4">
              Teams compete in a double elimination bracket. Teams must lose twice to be eliminated.
            </p>
            <div className="flex justify-center gap-4">
              <Button asChild>
                <Link href={`/events/${eventId}/bracket`}>
                  View Tournament Bracket
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/events/${eventId}/matches`}>
                  View All Matches
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 