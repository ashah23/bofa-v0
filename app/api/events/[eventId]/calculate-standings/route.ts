import { NextResponse } from "next/server"
import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ eventId: string }> }
) {
    try {
        const { eventId } = await params
        console.log('Calculating standings for event:', eventId)

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
                    t.team_id,
                    t.team_name,
                    tt.time,
                    ROW_NUMBER() OVER (ORDER BY tt.time ASC) as rank
                FROM team_times tt
                JOIN teams t ON tt.team_id = t.team_id
            )
            SELECT 
                team_id,
                team_name,
                time,
                rank
            FROM ranked_teams
            ORDER BY time ASC
        `, [eventId])

        console.log('Standings calculated:', standingsResult.rows)

        return NextResponse.json({
            standings: standingsResult.rows
        })
    } catch (error) {
        console.error('Error calculating standings:', error)
        return NextResponse.json(
            { error: 'Failed to calculate standings', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        )
    }
} 