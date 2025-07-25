import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST: Reset tournament to initial state
export async function POST(
    request: Request,
    { params }: { params: Promise<{ eventId: string }> }
) {
    try {
        const resolvedParams = await params;
        const eventId = resolvedParams.eventId;

        // Reset group matches: set winner_id to NULL and status to 'scheduled'
        await pool.query(`
            UPDATE world_cup_group_matches
            SET winner_id = NULL, status = 'scheduled'
            WHERE event_id = $1
        `, [eventId]);

        // Reset knockout matches: remove team1_id and team2_id, set status to 'scheduled'
        await pool.query(`
            UPDATE world_cup_knockout_matches
            SET team1_id = NULL, team2_id = NULL, winner_id = NULL, status = 'scheduled'
            WHERE event_id = $1
        `, [eventId]);

        // Delete all points for this event
        await pool.query(`
            DELETE FROM points
            WHERE event_id = $1
        `, [eventId]);

        // Update event status to scheduled
        await pool.query(`
            UPDATE events
            SET event_status = 'SCHEDULED',
                updated_at = CURRENT_TIMESTAMP
            WHERE event_id = $1
        `, [eventId]);

        return NextResponse.json({
            success: true,
            message: 'Tournament reset successfully'
        });
    } catch (error) {
        console.error('Error resetting tournament:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to reset tournament',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 