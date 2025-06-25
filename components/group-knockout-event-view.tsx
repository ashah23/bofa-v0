import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Trophy } from "lucide-react"
import Link from "next/link"

interface GroupKnockoutEventViewProps {
  event: any
  eventId: string
}

export function GroupKnockoutEventView({ event, eventId }: GroupKnockoutEventViewProps) {
  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-3xl">{event.event_name}</CardTitle>
            <CardDescription>Group & Knockout Event</CardDescription>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" asChild>
              <Link href={`/group-knockout?eventId=${eventId}`}>
                View Details
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          <div className="text-center py-8">
            <Users className="h-16 w-16 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Group & Knockout Tournament</h3>
            <p className="text-muted-foreground mb-4">
              Teams compete in groups followed by knockout rounds to determine the champion.
            </p>
            <div className="flex justify-center gap-4">
              <Button asChild>
                <Link href={`/group-knockout?eventId=${eventId}`}>
                  View Group & Knockout Details
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 