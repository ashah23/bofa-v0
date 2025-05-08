import { NextResponse } from "next/server"
import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
    request: Request,
    { params }: { params: { eventId: string } }
) {
    try {
        // First check if the event exists and is a heat event
        const eventCheck = await pool.query(`
            SELECT event_type 
            FROM events 
            WHERE event_id = $1
        `, [params.eventId]);

        if (eventCheck.rows.length === 0) {
            return NextResponse.json(
                { error: 'Event not found' },
                { status: 404 }
            );
        }

        if (eventCheck.rows[0].event_type !== 'HEAT') {
            return NextResponse.json(
                { error: 'Event is not a heat event' },
                { status: 400 }
            );
        }

        const { rows } = await pool.query(`
            SELECT 
                hm.heat_id,
                hm.heat_number,
                hm.heat_status,
                hm.created_at,
                t1.team_name as team1_name,
                t2.team_name as team2_name,
                t3.team_name as team3_name,
                t4.team_name as team4_name,
                hm.team1_time,
                hm.team2_time,
                hm.team3_time,
                hm.team4_time
            FROM heat_matches hm
            LEFT JOIN teams t1 ON hm.team1_id = t1.team_id
            LEFT JOIN teams t2 ON hm.team2_id = t2.team_id
            LEFT JOIN teams t3 ON hm.team3_id = t3.team_id
            LEFT JOIN teams t4 ON hm.team4_id = t4.team_id
            WHERE hm.event_id = $1
            ORDER BY hm.heat_number ASC, hm.created_at ASC
        `, [params.eventId])

        return NextResponse.json({ matches: rows })
    } catch (error) {
        console.error('Error fetching heat matches:', error)
        return NextResponse.json(
            { error: 'Failed to fetch heat matches' },
            { status: 500 }
        )
    }
} 