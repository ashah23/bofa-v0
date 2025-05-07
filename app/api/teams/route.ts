import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
    try {
        const result = await pool.query(`
            SELECT team_id, team_name, created_at 
            FROM teams 
            ORDER BY team_name
        `);

        return NextResponse.json({
            success: true,
            teams: result.rows
        });
    } catch (error) {
        console.error('Error fetching teams:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to fetch teams',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 