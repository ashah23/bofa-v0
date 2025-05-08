import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    context: { params: Promise<{ eventId: string }> }
) {
    try {
        const { eventId } = await context.params;
        const result = await pool.query(`
            SELECT event_id, event_name, event_type, event_date, created_at
            FROM events
            WHERE event_id = $1
        `, [eventId]);

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: 'Event not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            event: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching event:', error);
        return NextResponse.json(
            { error: 'Failed to fetch event' },
            { status: 500 }
        );
    }
} 