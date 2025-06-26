import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { HeatEventView } from "@/components/heat-event-view"
import { DoubleEliminationEventView } from "@/components/double-elimination-event-view"
import { GroupKnockoutEventView } from "@/components/group-knockout-event-view"
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

  if (!event) {
    notFound()
  }

  // Redirect individual events to the individual page
  if (event.event_type === 'INDIVIDUAL') {
    redirect(`/events/${eventId}/individual`)
  }

  let heatMatches = null;
  let standings = null;
  if (event.event_type === 'HEAT') {
    heatMatches = await getHeatMatches(eventId)
    standings = event.event_status === 'COMPLETED' ? await getEventStandings(eventId) : null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/events">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Events
        </Button>
      </Link>

      {event.event_type === 'HEAT' && (
        <HeatEventView event={event} heatMatches={heatMatches} standings={standings} eventId={eventId} />
      )}
      {event.event_type === 'DOUBLE-ELIM' && (
        <DoubleEliminationEventView event={event} eventId={eventId} />
      )}
      {event.event_type !== 'HEAT' && event.event_type !== 'DOUBLE-ELIM' && (
        <GroupKnockoutEventView event={event} eventId={eventId} />
      )}
    </div>
  )
}
