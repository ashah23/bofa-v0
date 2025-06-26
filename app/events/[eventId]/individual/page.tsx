import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { IndividualEventView } from "@/components/individual-event-view"

async function getEventDetails(eventId: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/events/${eventId}`, {
    cache: 'no-store',
    next: { revalidate: 0 }
  });
  if (!res.ok) throw new Error('Failed to fetch event');
  const data = await res.json();
  return data.event;
}

export default async function IndividualEventPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const event = await getEventDetails(eventId)

  if (!event) {
    notFound()
  }

  if (event.event_type !== 'INDIVIDUAL') {
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

      <IndividualEventView event={event} eventId={eventId} />
    </div>
  )
}
