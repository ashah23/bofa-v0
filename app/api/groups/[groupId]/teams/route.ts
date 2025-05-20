import { NextResponse } from "next/server"
import pool from "@/lib/db"

export async function GET(
  request: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    const { groupId } = params

    const result = await pool.query(`
      WITH team_stats AS (
        SELECT 
          t.team_id,
          t.team_name,
          COUNT(m.match_id) as played,
          SUM(CASE WHEN m.team1_id = t.team_id AND m.team1_score > m.team2_score THEN 1
                   WHEN m.team2_id = t.team_id AND m.team2_score > m.team1_score THEN 1
                   ELSE 0 END) as won,
          SUM(CASE WHEN m.team1_id = t.team_id AND m.team1_score = m.team2_score THEN 1
                   WHEN m.team2_id = t.team_id AND m.team2_score = m.team1_score THEN 1
                   ELSE 0 END) as drawn,
          SUM(CASE WHEN m.team1_id = t.team_id AND m.team1_score < m.team2_score THEN 1
                   WHEN m.team2_id = t.team_id AND m.team2_score < m.team1_score THEN 1
                   ELSE 0 END) as lost,
          SUM(CASE WHEN m.team1_id = t.team_id THEN m.team1_score
                   WHEN m.team2_id = t.team_id THEN m.team2_score
                   ELSE 0 END) as goals_for,
          SUM(CASE WHEN m.team1_id = t.team_id THEN m.team2_score
                   WHEN m.team2_id = t.team_id THEN m.team1_score
                   ELSE 0 END) as goals_against
        FROM teams t
        JOIN wc_group_teams gt ON t.team_id = gt.team_id
        LEFT JOIN wc_group_matches m ON (m.team1_id = t.team_id OR m.team2_id = t.team_id)
        WHERE gt.group_id = $1 AND gt.event_id = m.event_id
        GROUP BY t.team_id, t.team_name
      )
      SELECT 
        team_id,
        team_name,
        played,
        COALESCE(won, 0) as won,
        COALESCE(drawn, 0) as drawn,
        COALESCE(lost, 0) as lost,
        COALESCE(goals_for, 0) as goals_for,
        COALESCE(goals_against, 0) as goals_against,
        COALESCE(goals_for, 0) - COALESCE(goals_against, 0) as goal_difference,
        (COALESCE(won, 0) * 3) + COALESCE(drawn, 0) as points
      FROM team_stats
      ORDER BY points DESC, goal_difference DESC, goals_for DESC, team_name ASC
    `, [groupId])

    return NextResponse.json({ teams: result.rows })
  } catch (error) {
    console.error('Error fetching group teams:', error)
    return NextResponse.json(
      { error: 'Failed to fetch group teams' },
      { status: 500 }
    )
  }
} 