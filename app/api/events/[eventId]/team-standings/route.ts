import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET: Fetch team standings for an individual event
export async function GET(
    request: Request,
    { params }: { params: Promise<{ eventId: string }> }
) {
    try {
        const { eventId } = await params;

        // First check if the event exists and is an individual event
        const eventCheck = await pool.query(`
            SELECT event_type, event_name
            FROM events 
            WHERE event_id = $1
        `, [eventId]);

        if (eventCheck.rows.length === 0) {
            return NextResponse.json(
                { error: 'Event not found' },
                { status: 404 }
            );
        }

        if (eventCheck.rows[0].event_type !== 'INDIVIDUAL') {
            return NextResponse.json(
                { error: 'Event is not an individual event' },
                { status: 400 }
            );
        }

        // Get team standings by aggregating individual player scores
        const result = await pool.query(`
            WITH team_scores AS (
                SELECT 
                    t.team_id,
                    t.team_name,
                    COUNT(p.player_id) as player_count,
                    COALESCE(SUM(sd.twos), 0) as total_twos,
                    COALESCE(SUM(sd.fives), 0) as total_fives,
                    COALESCE(SUM(sd.tens), 0) as total_tens,
                    COALESCE(SUM(sd.twos), 0) * 2 + COALESCE(SUM(sd.fives), 0) * 5 + COALESCE(SUM(sd.tens), 0) * 10 as total_points
                FROM teams t
                LEFT JOIN players p ON t.team_id = p.team_id
                LEFT JOIN slam_drunk sd ON p.player_id = sd.player_id
                GROUP BY t.team_id, t.team_name
                HAVING COUNT(p.player_id) > 0
            )
            SELECT 
                team_id,
                team_name,
                player_count,
                total_twos as twos,
                total_fives as fives,
                total_tens as tens,
                total_points
            FROM team_scores
            ORDER BY total_points DESC, team_name ASC
        `);

        return NextResponse.json({
            success: true,
            event: eventCheck.rows[0],
            standings: result.rows
        });

    } catch (error) {
        console.error('Error fetching team standings:', error);
        return NextResponse.json(
            { error: 'Failed to fetch team standings' },
            { status: 500 }
        );
    }
} 