import { NextResponse } from "next/server"
import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ eventId: string }> }
) {
    try {
        const { eventId } = await params

        // First check if event is completed
        const eventResult = await pool.query(`
            SELECT event_status
            FROM events
            WHERE event_id = $1
        `, [eventId])

        if (eventResult.rows.length === 0) {
            return NextResponse.json(
                { error: 'Event not found' },
                { status: 404 }
            )
        }

        if (eventResult.rows[0].event_status !== 'COMPLETED') {
            return NextResponse.json(
                { error: 'Event is not completed' },
                { status: 400 }
            )
        }

        // Get standings with team names and points
        const standingsResult = await pool.query(`
            SELECT 
                t.team_name,
                p.point_value,
                ROW_NUMBER() OVER (ORDER BY p.point_value DESC) as rank
            FROM points p
            JOIN teams t ON p.team_id = t.team_id
            WHERE p.event_id = $1 AND p.point_type = 'EVENT'
            ORDER BY p.point_value DESC
        `, [eventId])

        return NextResponse.json({
            standings: standingsResult.rows
        })
    } catch (error) {
        console.error('Error fetching standings:', error)
        return NextResponse.json(
            { error: 'Failed to fetch standings' },
            { status: 500 }
        )
    }
} 