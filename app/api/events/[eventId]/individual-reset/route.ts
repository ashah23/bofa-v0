import { NextResponse } from "next/server"
import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ eventId: string }> }
) {
    try {
        const { eventId } = await params
        console.log('Resetting individual event:', eventId)

        // First check if the event exists and is an individual event
        const eventCheck = await pool.query(`
            SELECT event_type, event_status
            FROM events 
            WHERE event_id = $1
        `, [eventId])

        if (eventCheck.rows.length === 0) {
            return NextResponse.json(
                { error: 'Event not found' },
                { status: 404 }
            )
        }

        if (eventCheck.rows[0].event_type !== 'INDIVIDUAL') {
            return NextResponse.json(
                { error: 'Event is not an individual event' },
                { status: 400 }
            )
        }

        if (eventCheck.rows[0].event_status !== 'COMPLETED') {
            return NextResponse.json(
                { error: 'Event is not completed' },
                { status: 400 }
            )
        }

        // Start a transaction
        const client = await pool.connect()
        try {
            await client.query('BEGIN')

            // Clear event standings for this event
            await client.query(`
                DELETE FROM event_standings
                WHERE event_id = $1
            `, [eventId])

            // Clear points for this event
            await client.query(`
                DELETE FROM points
                WHERE event_id = $1 AND point_type = 'EVENT'
            `, [eventId])

            // Reset event status to SCHEDULED
            await client.query(`
                UPDATE events
                SET event_status = 'SCHEDULED',
                    updated_at = CURRENT_TIMESTAMP
                WHERE event_id = $1
            `, [eventId])

            await client.query('COMMIT')

            return NextResponse.json({
                success: true,
                message: 'Individual event reset successfully'
            })
        } catch (error) {
            await client.query('ROLLBACK')
            throw error
        } finally {
            client.release()
        }
    } catch (error) {
        console.error('Error resetting individual event:', error)
        return NextResponse.json(
            { 
                success: false,
                error: 'Failed to reset individual event', 
                details: error instanceof Error ? error.message : String(error) 
            },
            { status: 500 }
        )
    }
} 