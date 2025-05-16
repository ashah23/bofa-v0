import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
    try {
        const result = await pool.query(`
            SELECT event_id, event_name, event_type, event_date, event_status, created_at
            FROM events
            ORDER BY event_date DESC, event_name
        `);

        return NextResponse.json({
            success: true,
            events: result.rows
        });
    } catch (error) {
        console.error('Error fetching events:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to fetch events',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 