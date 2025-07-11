import { NextResponse } from "next/server"
import pool from '@/lib/db'

const point_values = [15, 12, 10, 8, 7, 6, 5, 4, 3, 2, 1, 0]
export const dynamic = 'force-dynamic'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ eventId: string }> }
) {
    try {
        const { eventId } = await params
        console.log('Completing event:', eventId)

        // First, check if all heats are completed
        const heatsResult = await pool.query(`
            SELECT COUNT(*) as total_heats,
                   COUNT(CASE WHEN heat_status = 'COMPLETED' THEN 1 END) as completed_heats
            FROM heat_matches
            WHERE event_id = $1
        `, [eventId])

        const { total_heats, completed_heats } = heatsResult.rows[0]
        console.log('Heat status:', { total_heats, completed_heats })

        if (total_heats !== completed_heats) {
            return NextResponse.json(
                { error: 'Not all heats are completed' },
                { status: 400 }
            )
        }

        // Calculate standings based on team times
        const standingsResult = await pool.query(`
            WITH team_times AS (
                SELECT 
                    team1_id as team_id,
                    team1_time as time
                FROM heat_matches
                WHERE event_id = $1 AND team1_id IS NOT NULL AND team1_time IS NOT NULL
                UNION ALL
                SELECT 
                    team2_id as team_id,
                    team2_time as time
                FROM heat_matches
                WHERE event_id = $1 AND team2_id IS NOT NULL AND team2_time IS NOT NULL
                UNION ALL
                SELECT 
                    team3_id as team_id,
                    team3_time as time
                FROM heat_matches
                WHERE event_id = $1 AND team3_id IS NOT NULL AND team3_time IS NOT NULL
                UNION ALL
                SELECT 
                    team4_id as team_id,
                    team4_time as time
                FROM heat_matches
                WHERE event_id = $1 AND team4_id IS NOT NULL AND team4_time IS NOT NULL
            ),
            ranked_teams AS (
                SELECT 
                    team_id,
                    time,
                    ROW_NUMBER() OVER (ORDER BY time ASC) as rank,
                    COUNT(*) OVER () as total_teams
                FROM team_times
            )
            SELECT 
                team_id,
                time,
                rank
            FROM ranked_teams
            ORDER BY time ASC
        `, [eventId])

        console.log('Standings calculated:', standingsResult.rows)

        // Update event status to completed
        await pool.query(`
            UPDATE events
            SET event_status = 'COMPLETED',
                updated_at = CURRENT_TIMESTAMP
            WHERE event_id = $1
        `, [eventId])

        // Store the standings
        for (const standing of standingsResult.rows) {
            console.log('Storing points for team:', standing.team_id, 'points:', point_values[standing.rank - 1])
            await pool.query(`
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
                point_values[standing.rank - 1]
            ])
        }

        return NextResponse.json({
            message: 'Heat event completed and standings calculated',
            standings: standingsResult.rows
        })
    } catch (error) {
        console.error('Error completing heat event:', error)
        // Log the full error details
        if (error instanceof Error) {
            console.error('Error details:', {
                message: error.message,
                stack: error.stack
            })
        }
        return NextResponse.json(
            { error: 'Failed to complete heat event', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        )
    }
} 