import { NextResponse } from "next/server"
import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ eventId: string }> }
) {
    try {
        const { eventId } = await params
        const { standings } = await request.json()
        
        console.log('Saving standings for event:', eventId, standings)

        if (!standings || !Array.isArray(standings)) {
            return NextResponse.json(
                { error: 'Invalid standings data' },
                { status: 400 }
            )
        }

        // Start a transaction
        const client = await pool.connect()
        try {
            await client.query('BEGIN')

            // Clear existing standings for this event
            await client.query(`
                DELETE FROM event_standings
                WHERE event_id = $1
            `, [eventId])

            // Insert new standings
            for (const standing of standings) {
                await client.query(`
                    INSERT INTO event_standings (
                        event_id,
                        team_id,
                        place,
                        disqualified
                    ) VALUES ($1, $2, $3, $4)
                `, [
                    eventId,
                    standing.team_id,
                    standing.rank,
                    standing.disqualified || false
                ])
            }

            // Update event status to completed
            await client.query(`
                UPDATE events
                SET event_status = 'COMPLETED',
                    updated_at = CURRENT_TIMESTAMP
                WHERE event_id = $1
            `, [eventId])

            // Calculate and store points based on final standings
            const point_values = [15, 12, 10, 8, 7, 6, 5, 4, 3, 2, 1, 0]
            
            // Clear existing points for this event
            await client.query(`
                DELETE FROM points
                WHERE event_id = $1 AND point_type = 'EVENT'
            `, [eventId])

            // Store the points
            for (const standing of standings) {
                // Disqualified teams get 0 points
                const points = standing.disqualified ? 0 : (point_values[standing.rank - 1] || 0)
                console.log('Storing points for team:', standing.team_id, 'points:', points, 'disqualified:', standing.disqualified)
                await client.query(`
                    INSERT INTO points (
                        event_id,
                        team_id,
                        point_type,
                        point_value,
                        updated_at
                    ) VALUES ($1, $2, 'EVENT', $3, CURRENT_TIMESTAMP)
                `, [
                    eventId,
                    standing.team_id,
                    points
                ])
            }

            await client.query('COMMIT')

            return NextResponse.json({
                message: 'Standings saved successfully',
                standings: standings
            })
        } catch (error) {
            await client.query('ROLLBACK')
            throw error
        } finally {
            client.release()
        }
    } catch (error) {
        console.error('Error saving standings:', error)
        return NextResponse.json(
            { error: 'Failed to save standings', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        )
    }
} 