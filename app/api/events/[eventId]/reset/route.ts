import { NextResponse } from "next/server"
import pool from '@/lib/db'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ eventId: string }> }
) {
    try {
        const { eventId } = await params
        console.log('Resetting event:', eventId)

        // Start a transaction
        const client = await pool.connect()
        try {
            await client.query('BEGIN')

            // Delete points for this event
            await client.query(`
                DELETE FROM points
                WHERE event_id = $1 AND point_type = 'EVENT'
            `, [eventId])

            // Reset heat matches
            await client.query(`
                UPDATE heat_matches
                SET heat_status = 'SCHEDULED',
                    team1_time = NULL,
                    team2_time = NULL,
                    team3_time = NULL,
                    team4_time = NULL
                WHERE event_id = $1
            `, [eventId])

            // Reset event status
            await client.query(`
                UPDATE events
                SET event_status = 'SCHEDULED',
                    updated_at = CURRENT_TIMESTAMP
                WHERE event_id = $1
            `, [eventId])

            await client.query('COMMIT')

            return NextResponse.json({
                message: 'Event reset successfully'
            })
        } catch (error) {
            await client.query('ROLLBACK')
            throw error
        } finally {
            client.release()
        }
    } catch (error) {
        console.error('Error resetting event:', error)
        return NextResponse.json(
            { error: 'Failed to reset event', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        )
    }
} 