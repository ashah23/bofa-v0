import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
    try {
        const result = await pool.query(`
            SELECT 
                er.result_id,
                er.event_id,
                e.event_name,
                er.team1_id,
                t1.team_name as team1_name,
                er.team2_id,
                t2.team_name as team2_name,
                er.team1_score,
                er.team2_score,
                er.winner_team_id,
                w.team_name as winner_team_name,
                er.created_at
            FROM event_results er
            JOIN events e ON er.event_id = e.event_id
            JOIN teams t1 ON er.team1_id = t1.team_id
            JOIN teams t2 ON er.team2_id = t2.team_id
            LEFT JOIN teams w ON er.winner_team_id = w.team_id
            ORDER BY er.created_at DESC
        `);

        return NextResponse.json({
            success: true,
            results: result.rows
        });
    } catch (error) {
        console.error('Error fetching event results:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to fetch event results',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 