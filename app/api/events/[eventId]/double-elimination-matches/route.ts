// app/api/standings/route.ts
import { NextResponse } from "next/server";

import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {

  try {
    // Get all matches with winners and teams
    const res = await pool.query(`
      SELECT
        m.match_id,
        m.winner_id,
        m.team1_id,
        m.team2_id
        t1.name AS team1_name,
        t2.name AS team2_name,
        tw.name AS winner_name
      FROM double_elimination_matches m
      LEFT JOIN teams t1 ON m.team1_id = t1.team_id
      LEFT JOIN teams t2 ON m.team2_id = t2.team_id
      LEFT JOIN teams tw ON m.winner_id = tw.team_id
    `);

    // Count losses and track last match
    const lossMap: Record<number, { losses: number; lastMatchId: number }> = {};

    for (const match of res.rows) {
      const { match_id, team1_id, team2_id, winner_id } = match;

      const loserId = team1_id === winner_id ? team2_id : team1_id;

      if (loserId == null) continue;

      if (!lossMap[loserId]) {
        lossMap[loserId] = { losses: 1, lastMatchId: match_id };
      } else {
        lossMap[loserId].losses++;
        lossMap[loserId].lastMatchId = Math.max(lossMap[loserId].lastMatchId, match_id);
      }

      if (!lossMap[winner_id]) {
        lossMap[winner_id] = { losses: 0, lastMatchId: match_id };
      } else {
        lossMap[winner_id].lastMatchId = Math.max(lossMap[winner_id].lastMatchId, match_id);
      }
    }

    // Sort teams: most wins, fewest losses, lastMatchId (descending)
    const sortedTeams = Object.entries(lossMap)
      .map(([teamId, data]) => ({ teamId: parseInt(teamId), ...data }))
      .sort((a, b) => {
        if (a.losses !== b.losses) return a.losses - b.losses;
        return b.lastMatchId - a.lastMatchId;
      });

    // Assign placements
    const standings = sortedTeams.map((t, idx) => ({
      rank: idx + 1,
      teamId: t.teamId,
      losses: t.losses,
      lastMatchId: t.lastMatchId,
    }));

    return NextResponse.json(standings);
  } catch (err) {
    console.error("Error calculating standings", err);
    return NextResponse.json(
      { error: 'Failed to calculate standings' },
      { status: 500 }
    )
  }
}
