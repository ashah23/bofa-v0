import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ teamId: string }> }
) {
    try {
        const resolvedParams = await params;
        const teamId = resolvedParams.teamId;
        // Get team details
        const teamResult = await pool.query(`
            SELECT t.team_id, t.team_name, t.created_at, SUM(p.point_value) as total_points
            FROM teams t
            LEFT JOIN points p ON t.team_id = p.team_id
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
                   athleticism, alcohol_tolerance, listening_comprehension, competitiveness
            FROM players
            WHERE team_id = $1
            ORDER BY player_name
        `, [teamId]);

        // Get detailed points breakdown
        const pointsResult = await pool.query(`
            SELECT 
                p.point_value,
                p.comments,
                p.updated_at,
                p.point_type,
                p.event_id,
                COALESCE(e.event_name, 'General') as event_name,
                es.disqualified
            FROM points p
            LEFT JOIN events e ON p.event_id = e.event_id
            LEFT JOIN event_standings es ON p.event_id = es.event_id AND p.team_id = es.team_id
            WHERE p.team_id = $1
            ORDER BY p.updated_at DESC
        `, [teamId]);

        const team = {
            ...teamResult.rows[0],
            players: playersResult.rows,
            points_history: pointsResult.rows
        };

        return NextResponse.json({
            success: true,
            team
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: 'Failed to fetch team',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 