import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET: Fetch all player scores for an individual event
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

        // Get all players and their scores with team information
        const result = await pool.query(`
            SELECT 
                p.player_id,
                p.player_name,
                p.email,
                p.team_id,
                t.team_name,
                COALESCE(sd.twos, 0) as twos,
                COALESCE(sd.fives, 0) as fives,
                COALESCE(sd.tens, 0) as tens,
                COALESCE(sd.twos, 0) * 2 + COALESCE(sd.fives, 0) * 5 + COALESCE(sd.tens, 0) * 10 as total_points,
                sd.id
            FROM players p
            LEFT JOIN teams t ON p.team_id = t.team_id
            LEFT JOIN slam_drunk sd ON p.player_id = sd.player_id
            ORDER BY total_points DESC, p.player_name ASC
        `);

        return NextResponse.json({
            success: true,
            event: eventCheck.rows[0],
            players: result.rows
        });

    } catch (error) {
        console.error('Error fetching individual scores:', error);
        return NextResponse.json(
            { error: 'Failed to fetch individual scores' },
            { status: 500 }
        );
    }
}

// POST: Update or create a player's score
export async function POST(
    request: Request,
    { params }: { params: Promise<{ eventId: string }> }
) {
    try {
        const { eventId } = await params;
        const body = await request.json();
        const { playerId, twos, fives, tens } = body;

        if (!playerId || twos === undefined || fives === undefined || tens === undefined) {
            return NextResponse.json(
                { error: 'Missing required fields: playerId, twos, fives, tens' },
                { status: 400 }
            );
        }

        // Check if the event is an individual event
        const eventCheck = await pool.query(`
            SELECT event_type
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

        // Check if player exists
        const playerCheck = await pool.query(`
            SELECT player_id, player_name
            FROM players 
            WHERE player_id = $1
        `, [playerId]);

        if (playerCheck.rows.length === 0) {
            return NextResponse.json(
                { error: 'Player not found' },
                { status: 404 }
            );
        }

        // Check if score record already exists for this player
        const existingScore = await pool.query(`
            SELECT id
            FROM slam_drunk 
            WHERE player_id = $1
        `, [playerId]);

        let result;
        if (existingScore.rows.length > 0) {
            // Update existing score
            result = await pool.query(`
                UPDATE slam_drunk 
                SET twos = $1, fives = $2, tens = $3
                WHERE player_id = $4
                RETURNING *
            `, [twos, fives, tens, playerId]);
        } else {
            // Create new score record
            result = await pool.query(`
                INSERT INTO slam_drunk (player_id, twos, fives, tens)
                VALUES ($1, $2, $3, $4)
                RETURNING *
            `, [playerId, twos, fives, tens]);
        }

        return NextResponse.json({
            success: true,
            score: result.rows[0]
        });

    } catch (error) {
        console.error('Error updating individual score:', error);
        return NextResponse.json(
            { error: 'Failed to update individual score' },
            { status: 500 }
        );
    }
} 