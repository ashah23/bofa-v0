import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
    try {
        // Test the connection with a simple query
        const result = await pool.query('SELECT NOW()');
        return NextResponse.json({
            success: true,
            message: 'Database connection successful',
            timestamp: result.rows[0].now
        });
    } catch (error) {
        console.error('Database connection error:', error);
        return NextResponse.json({
            success: false,
            message: 'Database connection failed',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 