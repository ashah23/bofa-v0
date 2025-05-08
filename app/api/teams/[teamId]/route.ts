import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
    request: Request,
    { params }: { params: { teamId: string } }
) {
    try {
        const teamId = await Promise.resolve(params.teamId);

        // Get team details
        const teamResult = await pool.query(`
            SELECT t.team_id, t.team_name, t.created_at,
                   COALESCE(SUM(CASE WHEN h.winner_team_id = t.team_id THEN 1 ELSE 0 END), 0) as points
            FROM teams t
            LEFT JOIN head_to_head_matches h ON t.team_id = h.winner_team_id
            WHERE t.team_id = $1
            GROUP BY t.team_id, t.team_name, t.created_at
        `, [teamId]);

        if (teamResult.rows.length === 0) {
            return NextResponse.json({
                success: false,
                message: 'Team not found'
            }, { status: 404 });
        }

        // Get players for this team
        const playersResult = await pool.query(`
            SELECT player_id, player_name, email, created_at,
                   athleticism, alcohol_tolerance, reading_comprehension
            FROM players
            WHERE team_id = $1
            ORDER BY player_name
        `, [teamId]);

        const team = {
            ...teamResult.rows[0],
            players: playersResult.rows
        };

        return NextResponse.json({
            success: true,
            team
        });
    } catch (error) {
        console.error('Error fetching team:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to fetch team',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 