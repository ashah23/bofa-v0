import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET: Get World Cup event data including groups, teams, matches, and standings
export async function GET(
    request: Request,
    { params }: { params: Promise<{ eventId: string }> }
) {
    try {
        const resolvedParams = await params;
        const eventId = resolvedParams.eventId;

        // Get event details
        const eventResult = await pool.query(`
            SELECT event_id, event_name, event_type, event_status, event_date
            FROM events
            WHERE event_id = $1
        `, [eventId]);

        if (eventResult.rows.length === 0) {
            return NextResponse.json({
                success: false,
                message: 'Event not found'
            }, { status: 404 });
        }

        const event = eventResult.rows[0];

        // Get groups and teams
        const groupsResult = await pool.query(`
            SELECT 
                wcg.group_id,
                wcg.name as group_name,
                json_agg(
                    json_build_object(
                        'team_id', t.team_id,
                        'team_name', t.team_name
                    ) ORDER BY t.team_name
                ) as teams
            FROM world_cup_groups wcg
            LEFT JOIN world_cup_group_teams wcgt ON wcg.group_id = wcgt.group_id AND wcgt.event_id = $1
            LEFT JOIN teams t ON wcgt.team_id = t.team_id
            WHERE wcg.event_id = $1
            GROUP BY wcg.group_id, wcg.name
            ORDER BY wcg.name
        `, [eventId]);

        // Get group matches
        const groupMatchesResult = await pool.query(`
            SELECT 
                wcgm.match_id,
                wcgm.group_id,
                wcg.name as group_name,
                wcgm.team1_id,
                t1.team_name as team1_name,
                wcgm.team2_id,
                t2.team_name as team2_name,
                wcgm.winner_id,
                wcgm.match_day,
                wcgm.status
            FROM world_cup_group_matches wcgm
            JOIN world_cup_groups wcg ON wcgm.group_id = wcg.group_id
            JOIN teams t1 ON wcgm.team1_id = t1.team_id
            JOIN teams t2 ON wcgm.team2_id = t2.team_id
            WHERE wcgm.event_id = $1
            ORDER BY wcg.name, wcgm.match_day
        `, [eventId]);

        // Get knockout matches
        const knockoutMatchesResult = await pool.query(`
            SELECT 
                wckm.match_id,
                wckm.round,
                wckm.match_order,
                wckm.team1_id,
                t1.team_name as team1_name,
                wckm.team2_id,
                t2.team_name as team2_name,
                wckm.winner_id,
                wckm.status
            FROM world_cup_knockout_matches wckm
            LEFT JOIN teams t1 ON wckm.team1_id = t1.team_id
            LEFT JOIN teams t2 ON wckm.team2_id = t2.team_id
            WHERE wckm.event_id = $1
            ORDER BY wckm.match_order
        `, [eventId]);

        // Calculate standings in the application
        const standings = calculateStandings(groupMatchesResult.rows, groupsResult.rows);

        return NextResponse.json({
            success: true,
            event,
            groups: groupsResult.rows,
            groupMatches: groupMatchesResult.rows,
            knockoutMatches: knockoutMatchesResult.rows,
            standings
        });
    } catch (error) {
        console.error('Error fetching World Cup event:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to fetch World Cup event',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// POST: Update match scores and advance tournament
export async function POST(
    request: Request,
    { params }: { params: Promise<{ eventId: string }> }
) {
    try {
        const resolvedParams = await params;
        const eventId = resolvedParams.eventId;
        const body = await request.json();
        const { matchId, matchType, winnerId } = body;

        if (matchType === 'group') {
            // Update group match
            await pool.query(`
                UPDATE world_cup_group_matches 
                SET winner_id = $1, status = 'completed'
                WHERE match_id = $2 AND event_id = $3
            `, [winnerId, matchId, eventId]);

            // Check if all group matches are completed and advance to knockout if needed
            const groupMatchesResult = await pool.query(`
                SELECT COUNT(*) as total_matches,
                       COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_matches
                FROM world_cup_group_matches
                WHERE event_id = $1
            `, [eventId]);

            const { total_matches, completed_matches } = groupMatchesResult.rows[0];

            if (total_matches > 0 && total_matches === completed_matches) {
                // All group matches completed, check if knockout matches need to be created
                const knockoutMatchesResult = await pool.query(`
                    SELECT COUNT(*) as knockout_count
                    FROM world_cup_knockout_matches
                    WHERE event_id = $1
                `, [eventId]);

                if (knockoutMatchesResult.rows[0].knockout_count === 0) {
                    // Create knockout matches
                    await createKnockoutMatches(eventId);
                }
            }
        } else if (matchType === 'knockout') {
            // Update knockout match
            await pool.query(`
                UPDATE world_cup_knockout_matches 
                SET winner_id = $1, status = 'completed'
                WHERE match_id = $2 AND event_id = $3
            `, [winnerId, matchId, eventId]);

            // Check if we need to advance teams to next round
            await advanceKnockoutStage(eventId, matchId);
        }

        return NextResponse.json({
            success: true,
            message: 'Match updated successfully'
        });
    } catch (error) {
        console.error('Error updating World Cup match:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to update match',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// Helper function to calculate standings
function calculateStandings(matches: any[], groups: any[]) {
    const standings: any[] = [];

    // Initialize standings for all teams
    groups.forEach(group => {
        group.teams.forEach((team: any) => {
            standings.push({
                group_id: group.group_id,
                group_name: group.group_name,
                team_id: team.team_id,
                team_name: team.team_name,
                played: 0,
                wins: 0,
                position: null
            });
        });
    });

    // Calculate stats from completed matches
    matches.forEach(match => {
        if (match.status === 'completed' && match.winner_id) {
            // Find team1 in standings
            const team1Standing = standings.find(s =>
                s.group_id === match.group_id && s.team_id === match.team1_id
            );
            if (team1Standing) {
                team1Standing.played += 1;
                if (match.winner_id === match.team1_id) {
                    team1Standing.wins += 1;
                }
            }

            // Find team2 in standings
            const team2Standing = standings.find(s =>
                s.group_id === match.group_id && s.team_id === match.team2_id
            );
            if (team2Standing) {
                team2Standing.played += 1;
                if (match.winner_id === match.team2_id) {
                    team2Standing.wins += 1;
                }
            }
        }
    });

    // Calculate positions
    const groupsByName = new Map();
    groups.forEach(group => groupsByName.set(group.group_name, []));

    standings.forEach(standing => {
        const groupStandings = groupsByName.get(standing.group_name);
        if (groupStandings) {
            groupStandings.push(standing);
        }
    });

    // Sort each group by wins (descending) and assign positions
    groupsByName.forEach((groupStandings, groupName) => {
        groupStandings.sort((a: any, b: any) => {
            if (b.wins !== a.wins) return b.wins - a.wins;
            return a.team_id - b.team_id; // Tiebreaker: team_id
        });

        groupStandings.forEach((standing: any, index: number) => {
            standing.position = index + 1;
        });
    });

    return standings;
}

// Helper function to create knockout matches
async function createKnockoutMatches(eventId: string) {
    // Get group winners by calculating standings
    const groupMatchesResult = await pool.query(`
        SELECT 
            wcgm.group_id,
            wcg.name as group_name,
            wcgm.team1_id,
            t1.team_name as team1_name,
            wcgm.team2_id,
            t2.team_name as team2_name,
            wcgm.winner_id,
            wcgm.status
        FROM world_cup_group_matches wcgm
        JOIN world_cup_groups wcg ON wcgm.group_id = wcg.group_id
        JOIN teams t1 ON wcgm.team1_id = t1.team_id
        JOIN teams t2 ON wcgm.team2_id = t2.team_id
        WHERE wcgm.event_id = $1
        ORDER BY wcg.name, wcgm.match_day
    `, [eventId]);

    const groupsResult = await pool.query(`
        SELECT 
            wcg.group_id,
            wcg.name as group_name,
            json_agg(
                json_build_object(
                    'team_id', t.team_id,
                    'team_name', t.team_name
                ) ORDER BY t.team_name
            ) as teams
        FROM world_cup_groups wcg
        LEFT JOIN world_cup_group_teams wcgt ON wcg.group_id = wcgt.group_id AND wcgt.event_id = $1
        LEFT JOIN teams t ON wcgt.team_id = t.team_id
        WHERE wcg.event_id = $1
        GROUP BY wcg.group_id, wcg.name
        ORDER BY wcg.name
    `, [eventId]);

    const standings = calculateStandings(groupMatchesResult.rows, groupsResult.rows); // No tie-breaks for knockout
    const groupWinners = standings.filter(s => s.position === 1).sort((a, b) => a.group_name.localeCompare(b.group_name));

    if (groupWinners.length === 4) {
        // Create semi-finals
        await pool.query(`
            INSERT INTO world_cup_knockout_matches (event_id, round, match_order, team1_id, team2_id)
            VALUES 
                ($1, 'semi_final_1', 1, $2, $3),
                ($1, 'semi_final_2', 2, $4, $5)
        `, [eventId, groupWinners[0].team_id, groupWinners[1].team_id, groupWinners[2].team_id, groupWinners[3].team_id]);
    }
}

// Helper function to advance knockout stage
async function advanceKnockoutStage(eventId: string, completedMatchId: string) {
    const matchResult = await pool.query(`
        SELECT round, winner_id, team1_id, team2_id FROM world_cup_knockout_matches
        WHERE match_id = $1 AND event_id = $2
    `, [completedMatchId, eventId]);

    if (matchResult.rows.length === 0) return;

    const match = matchResult.rows[0];

    if (match.round === 'semi_final_1') {
        // Update final match with winner
        await pool.query(`
            UPDATE world_cup_knockout_matches
            SET team1_id = $1
            WHERE event_id = $2 AND round = 'final'
        `, [match.winner_id, eventId]);

        // Update third place match with loser
        const losingTeamId = match.team1_id === match.winner_id ? match.team2_id : match.team1_id;
        await pool.query(`
            UPDATE world_cup_knockout_matches
            SET team1_id = $1
            WHERE event_id = $2 AND round = 'third_place'
        `, [losingTeamId, eventId]);
    } else if (match.round === 'semi_final_2') {
        // Update final match with winner
        await pool.query(`
            UPDATE world_cup_knockout_matches
            SET team2_id = $1
            WHERE event_id = $2 AND round = 'final'
        `, [match.winner_id, eventId]);

        // Update third place match with loser
        const losingTeamId = match.team1_id === match.winner_id ? match.team2_id : match.team1_id;
        await pool.query(`
            UPDATE world_cup_knockout_matches
            SET team2_id = $1
            WHERE event_id = $2 AND round = 'third_place'
        `, [losingTeamId, eventId]);
    }
} 