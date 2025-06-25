// app/api/standings/route.ts
import { NextResponse } from "next/server";

import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;

  try {
    // Get all matches for this event with team names
    const res = await pool.query(`
      SELECT
        m.match_id,
        m.event_id,
        m.round,
        m.match_number,
        m.bracket,
        m.team1_id,
        m.team2_id,
        m.winner_id,
        m.loser_id,
        m.next_match_win_id,
        m.next_match_win_slot,
        m.next_match_lose_id,
        m.next_match_lose_slot,
        m.played_at,
        t1.team_name AS team1_name,
        t2.team_name AS team2_name,
        tw.team_name AS winner_name,
        tl.team_name AS loser_name
      FROM double_elim_matches m
      LEFT JOIN teams t1 ON m.team1_id = t1.team_id
      LEFT JOIN teams t2 ON m.team2_id = t2.team_id
      LEFT JOIN teams tw ON m.winner_id = tw.team_id
      LEFT JOIN teams tl ON m.loser_id = tl.team_id
      WHERE m.event_id = $1
      ORDER BY m.round ASC, m.match_number ASC
    `, [eventId]);

    // Group matches by bracket for easier frontend consumption
    const matches = {
      winner: res.rows.filter(match => match.bracket === 'W').sort((a, b) => {
        // Winner's bracket: ascending order (lowest to highest round)
        if (a.round !== b.round) return a.round - b.round;
        return a.match_number - b.match_number;
      }),
      loser: res.rows.filter(match => match.bracket === 'L').sort((a, b) => {
        // Loser's bracket: descending order (highest to lowest round, since rounds are negative)
        if (a.round !== b.round) return b.round - a.round;
        return a.match_number - b.match_number;
      }),
      final: res.rows.filter(match => match.bracket === 'F').sort((a, b) => {
        // Finals: ascending order
        if (a.round !== b.round) return a.round - b.round;
        return a.match_number - b.match_number;
      })
    };

    // Calculate standings based on losses
    const lossMap: Record<number, { losses: number; lastMatchId: number; wins: number }> = {};

    for (const match of res.rows) {
      if (match.winner_id && match.loser_id) {
        // Track wins
        if (!lossMap[match.winner_id]) {
          lossMap[match.winner_id] = { losses: 0, wins: 1, lastMatchId: match.match_id };
        } else {
          lossMap[match.winner_id].wins++;
          lossMap[match.winner_id].lastMatchId = Math.max(lossMap[match.winner_id].lastMatchId, match.match_id);
        }

        // Track losses
        if (!lossMap[match.loser_id]) {
          lossMap[match.loser_id] = { losses: 1, wins: 0, lastMatchId: match.match_id };
        } else {
          lossMap[match.loser_id].losses++;
          lossMap[match.loser_id].lastMatchId = Math.max(lossMap[match.loser_id].lastMatchId, match.match_id);
        }
      }
    }

    // Sort teams: most wins, fewest losses, lastMatchId (descending)
    const standings = Object.entries(lossMap)
      .map(([teamId, data]) => ({ 
        teamId: parseInt(teamId), 
        ...data 
      }))
      .sort((a, b) => {
        // First by losses (fewest first)
        if (a.losses !== b.losses) return a.losses - b.losses;
        // Then by wins (most first)
        if (a.wins !== b.wins) return b.wins - a.wins;
        // Finally by last match (most recent first)
        return b.lastMatchId - a.lastMatchId;
      })
      .map((team, idx) => ({
        ...team,
        rank: idx + 1
      }));

    return NextResponse.json({
      success: true,
      matches,
      standings,
      eventId: parseInt(eventId)
    });

  } catch (err) {
    console.error("Error fetching double elimination matches:", err);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch double elimination matches',
        details: err instanceof Error ? err.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;

  const client = await pool.connect();
  try {
    const body = await request.json();
    const { matchId, winnerId, loserId } = body;

    if (!matchId || !winnerId || !loserId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: matchId, winnerId, loserId' },
        { status: 400 }
      );
    }

    await client.query('BEGIN');

    // Get the next match info for this match
    const matchRes = await client.query(
      `SELECT next_match_win_id, next_match_win_slot, next_match_lose_id, next_match_lose_slot FROM double_elim_matches WHERE match_id = $1 AND event_id = $2`,
      [matchId, eventId]
    );
    if (matchRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { success: false, error: 'Match not found' },
        { status: 404 }
      );
    }
    const match = matchRes.rows[0];

    // Update the match with winner and loser
    const result = await client.query(
      `UPDATE double_elim_matches 
       SET winner_id = $1, loser_id = $2, played_at = NOW()
       WHERE match_id = $3 AND event_id = $4
       RETURNING *`,
      [winnerId, loserId, matchId, eventId]
    );

    // Update the next match for the winner
    if (match.next_match_win_id && match.next_match_win_slot) {
      const slotCol = match.next_match_win_slot === 1 ? 'team1_id' : 'team2_id';
      await client.query(
        `UPDATE double_elim_matches SET ${slotCol} = $1 WHERE match_id = $2 AND event_id = $3`,
        [winnerId, match.next_match_win_id, eventId]
      );
    }
    // Update the next match for the loser
    if (match.next_match_lose_id && match.next_match_lose_slot) {
      const slotCol = match.next_match_lose_slot === 1 ? 'team1_id' : 'team2_id';
      await client.query(
        `UPDATE double_elim_matches SET ${slotCol} = $1 WHERE match_id = $2 AND event_id = $3`,
        [loserId, match.next_match_lose_id, eventId]
      );
    }

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      match: result.rows[0]
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Error updating double elimination match:", err);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update match',
        details: err instanceof Error ? err.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
