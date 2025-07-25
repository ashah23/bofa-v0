import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST: Finalize standings and create knockout matches
export async function POST(
    request: Request,
    { params }: { params: Promise<{ eventId: string }> }
) {
    try {
        const resolvedParams = await params;
        const eventId = resolvedParams.eventId;
        const body = await request.json();
        const { tieBreakDecisions } = body;

        // Check if knockout matches already exist and delete them to recreate
        const existingKnockoutResult = await pool.query(`
            SELECT COUNT(*) as count
            FROM world_cup_knockout_matches
            WHERE event_id = $1
        `, [eventId]);

        if (existingKnockoutResult.rows[0].count > 0) {
            // Delete existing knockout matches to recreate them
            await pool.query(`
                DELETE FROM world_cup_knockout_matches
                WHERE event_id = $1
            `, [eventId]);
        }

        // Get group matches and groups to calculate standings
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

        // Calculate standings with tie-break decisions
        const standings = calculateStandings(groupMatchesResult.rows, groupsResult.rows, tieBreakDecisions || {});

        // Get group winners
        const groupWinners = standings.filter(s => s.position === 1).sort((a, b) => a.group_name.localeCompare(b.group_name));

        if (groupWinners.length !== 4) {
            return NextResponse.json({
                success: false,
                message: 'All groups must have a clear winner to advance to knockout stage'
            }, { status: 400 });
        }

        // Create knockout matches with correct matchups: A vs D, B vs C
        await pool.query(`
            INSERT INTO world_cup_knockout_matches (event_id, round, match_order, team1_id, team2_id)
            VALUES 
                ($1, 'semi_final_1', 1, $2, $3),
                ($1, 'semi_final_2', 2, $4, $5),
                ($1, 'final', 3, NULL, NULL),
                ($1, 'third_place', 4, NULL, NULL)
        `, [
            eventId,
            groupWinners[0].team_id, // Group A winner
            groupWinners[3].team_id, // Group D winner
            groupWinners[1].team_id, // Group B winner
            groupWinners[2].team_id  // Group C winner
        ]);

        return NextResponse.json({
            success: true,
            message: 'Knockout stage created successfully',
            matchups: {
                'semi_final_1': `${groupWinners[0].team_name} (Group A) vs ${groupWinners[3].team_name} (Group D)`,
                'semi_final_2': `${groupWinners[1].team_name} (Group B) vs ${groupWinners[2].team_name} (Group C)`
            }
        });
    } catch (error) {
        console.error('Error finalizing World Cup standings:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to finalize standings',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// Helper function to calculate standings with tie-break decisions
function calculateStandings(matches: any[], groups: any[], tieBreakDecisions: { [key: string]: number }) {
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

    // Apply tie-break decisions
    Object.entries(tieBreakDecisions).forEach(([groupId, winnerTeamId]) => {
        const teamStanding = standings.find(s =>
            s.group_id === parseInt(groupId) && s.team_id === winnerTeamId
        );
        if (teamStanding) {
            teamStanding.wins += 1; // Give the tie-break winner an extra win
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