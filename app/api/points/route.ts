import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
    try {
        const result = await pool.query(`
            SELECT 
                t.team_id, 
                t.team_name, 
                COALESCE(SUM(p.point_value), 0) as total_points,
                COUNT(CASE WHEN es.disqualified = true THEN 1 END) as disqualified_events
            FROM teams t
            LEFT JOIN points p ON t.team_id = p.team_id
            LEFT JOIN event_standings es ON t.team_id = es.team_id
            GROUP BY t.team_id, t.team_name
            ORDER BY total_points DESC
        `);

        return NextResponse.json({
            success: true,
            points: result.rows
        });
    } catch (error) {
        console.error('Error fetching standings:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to fetch standings',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 