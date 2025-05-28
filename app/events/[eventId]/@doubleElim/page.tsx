import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

async function getEventDetails(eventId: string) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/events/${eventId}`, {
        cache: 'no-store',
        next: { revalidate: 0 }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.event;
}

export default async function DoubleElimView({
    params: { eventId },
}: {
    params: { eventId: string };
}) {
    const event = await getEventDetails(eventId);
    
    // Return null if not a double elimination event
    if (!event || event.event_type !== 'double-elimination') {
        return null;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Double Elimination Bracket</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center p-4">
                        <p>Double elimination tournament management coming soon.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 