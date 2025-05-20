import { NextResponse } from "next/server"
import pool from "@/lib/db"

export async function GET(
    request: Request,
    { params }: { params: { groupId: string } }
) {
    try {
        const { groupId } = params

        const result = await pool.query(`
      SELECT 
        m.match_id,
        m.event_id,
        m.match_number,
        m.team1_id,
        t1.team_name as team1_name,
        m.team2_id,
        t2.team_name as team2_name,
        m.team1_score,
        m.team2_score,
        m.status,
        m.scheduled_time,
        m.venue
      FROM wc_group_matches m
      JOIN teams t1 ON m.team1_id = t1.team_id
      JOIN teams t2 ON m.team2_id = t2.team_id
      JOIN wc_group_teams gt1 ON m.team1_id = gt1.team_id
      JOIN wc_group_teams gt2 ON m.team2_id = gt2.team_id
      WHERE gt1.group_id = $1 AND gt2.group_id = $1
      ORDER BY m.match_number ASC
    `, [groupId])

        return NextResponse.json({ matches: result.rows })
    } catch (error) {
        console.error('Error fetching group matches:', error)
        return NextResponse.json(
            { error: 'Failed to fetch group matches' },
            { status: 500 }
        )
    }
} 