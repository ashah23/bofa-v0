import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST: Calculate final tournament standings
export async function POST(
    request: Request,
    { params }: { params: Promise<{ eventId: string }> }
) {
    try {
        const resolvedParams = await params;
        const eventId = resolvedParams.eventId;

        // Get all knockout matches to determine final positions
        const knockoutMatchesResult = await pool.query(`
            SELECT 
                round,
                team1_id,
                t1.team_name as team1_name,
                team2_id,
                t2.team_name as team2_name,
                winner_id
            FROM world_cup_knockout_matches wckm
            LEFT JOIN teams t1 ON wckm.team1_id = t1.team_id
            LEFT JOIN teams t2 ON wckm.team2_id = t2.team_id
            WHERE wckm.event_id = $1 AND wckm.status = 'completed'
            ORDER BY wckm.round
        `, [eventId]);

        // Get group match results to calculate points for non-knockout teams
        const groupMatchesResult = await pool.query(`
            SELECT 
                team1_id,
                team2_id,
                winner_id,
                status
            FROM world_cup_group_matches
            WHERE event_id = $1 AND status = 'completed'
        `, [eventId]);

        // Get all teams that participated in the tournament
        const allTeamsResult = await pool.query(`
            SELECT DISTINCT t.team_id, t.team_name
            FROM teams t
            JOIN world_cup_group_teams wcgt ON t.team_id = wcgt.team_id
            WHERE wcgt.event_id = $1
            ORDER BY t.team_name
        `, [eventId]);

        const knockoutMatches = knockoutMatchesResult.rows;
        const groupMatches = groupMatchesResult.rows;
        const allTeams = allTeamsResult.rows;

        // Calculate final standings
        const finalStandings = calculateFinalStandings(knockoutMatches, groupMatches, allTeams);

        // Insert points into the points table
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Insert points for each team
            for (const standing of finalStandings) {
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
                    standing.points
                ]);
            }

            // Update event status to completed
            await client.query(`
                UPDATE events
                SET event_status = 'COMPLETED',
                    updated_at = CURRENT_TIMESTAMP
                WHERE event_id = $1
            `, [eventId]);

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

        return NextResponse.json({
            success: true,
            message: 'Final standings calculated and points saved successfully',
            standings: finalStandings
        });
    } catch (error) {
        console.error('Error calculating final standings:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to calculate final standings',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// Helper function to calculate final standings
function calculateFinalStandings(knockoutMatches: any[], groupMatches: any[], allTeams: any[]) {
    const standings: any[] = [];

    // Initialize all teams with 0 points
    allTeams.forEach(team => {
        standings.push({
            team_id: team.team_id,
            team_name: team.team_name,
            points: 0,
            position: 0,
            knockout_position: null
        });
    });

    // Determine knockout positions based on completed matches
    let champion = null;
    let runnerUp = null;
    let thirdPlace = null;
    let fourthPlace = null;

    // Find final match result
    const finalMatch = knockoutMatches.find(m => m.round === 'final');
    if (finalMatch && finalMatch.winner_id) {
        champion = finalMatch.winner_id;
        runnerUp = finalMatch.team1_id === finalMatch.winner_id ? finalMatch.team2_id : finalMatch.team1_id;
    }

    // Find third place match result
    const thirdPlaceMatch = knockoutMatches.find(m => m.round === 'third_place');
    if (thirdPlaceMatch && thirdPlaceMatch.winner_id) {
        thirdPlace = thirdPlaceMatch.winner_id;
        fourthPlace = thirdPlaceMatch.team1_id === thirdPlaceMatch.winner_id ? thirdPlaceMatch.team2_id : thirdPlaceMatch.team1_id;
    }

    // Calculate group wins for each team
    const teamGroupWins: { [key: number]: number } = {};
    allTeams.forEach(team => {
        teamGroupWins[team.team_id] = 0;
    });

    groupMatches.forEach(match => {
        if (match.winner_id) {
            teamGroupWins[match.winner_id]++;
        }
    });

    // Assign points based on knockout positions and group wins
    standings.forEach(standing => {
        if (standing.team_id === champion) {
            standing.points = 15;
            standing.knockout_position = 1;
        } else if (standing.team_id === runnerUp) {
            standing.points = 12;
            standing.knockout_position = 2;
        } else if (standing.team_id === thirdPlace) {
            standing.points = 10;
            standing.knockout_position = 3;
        } else if (standing.team_id === fourthPlace) {
            standing.points = 8;
            standing.knockout_position = 4;
        } else {
            // Teams that didn't make knockout stage
            const groupWins = teamGroupWins[standing.team_id] || 0;
            standing.points = groupWins > 0 ? 5 : 2; // 5 points if they won at least 1 game, 2 points if 0 wins
            standing.group_wins = groupWins;
        }
    });

    // Sort by points (descending) and assign positions
    standings.sort((a, b) => b.points - a.points);

    standings.forEach((standing, index) => {
        standing.position = index + 1;
    });

    return standings;
} 