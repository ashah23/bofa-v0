import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
    try {
        const result = await pool.query(`
            SELECT p.player_id, p.player_name, p.email, p.created_at,
                   t.team_id, t.team_name
            FROM players p
            LEFT JOIN teams t ON p.team_id = t.team_id
            ORDER BY p.player_name
        `);

        return NextResponse.json({
            success: true,
            players: result.rows
        });
    } catch (error) {
        console.error('Error fetching players:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to fetch players',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 