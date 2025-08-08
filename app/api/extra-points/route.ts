import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
    try {
        const result = await pool.query(`
            SELECT 
                p.id,
                p.point_value,
                p.point_type,
                p.comments,
                p.team_id,
                p.updated_at,
                p.status,
                t.team_name
            FROM points p
            JOIN teams t ON p.team_id = t.team_id
            WHERE p.point_type IN ('BONUS', 'PENALTY')
            ORDER BY p.updated_at DESC
        `);

        return NextResponse.json({
            success: true,
            extraPoints: result.rows
        });
    } catch (error) {
        console.error('Error fetching extra points:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to fetch extra points',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { team_id, point_value, category, comments } = body;

        // Validate required fields
        if (!team_id || point_value === undefined || !category) {
            return NextResponse.json({
                success: false,
                message: 'Missing required fields: team_id, point_value, and category are required'
            }, { status: 400 });
        }

        // Validate category
        if (!['BONUS', 'PENALTY'].includes(category)) {
            return NextResponse.json({
                success: false,
                message: 'Category must be either BONUS or PENALTY'
            }, { status: 400 });
        }

        // Insert the extra point into the points table with PENDING status
        const result = await pool.query(`
            INSERT INTO points (team_id, point_value, point_type, comments, updated_at, status)
            VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, 'PENDING')
            RETURNING id, team_id, point_value, point_type, comments, updated_at, status
        `, [team_id, point_value, category, comments || null]);

        return NextResponse.json({
            success: true,
            extraPoint: result.rows[0],
            message: 'Extra point added successfully'
        });
    } catch (error) {
        console.error('Error creating extra point:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to create extra point',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, status, refereeComment } = body;

        // Validate required fields
        if (!id || !status) {
            return NextResponse.json({
                success: false,
                message: 'Missing required fields: id and status are required'
            }, { status: 400 });
        }

        // Validate status
        if (!['APPROVED', 'REJECTED'].includes(status)) {
            return NextResponse.json({
                success: false,
                message: 'Status must be either APPROVED or REJECTED'
            }, { status: 400 });
        }

        // Update the point status and comments
        const result = await pool.query(`
            UPDATE points 
            SET status = $1, updated_at = CURRENT_TIMESTAMP, comments = CASE 
                WHEN $3::text IS NOT NULL AND $3::text != '' THEN 
                    CASE 
                        WHEN comments IS NOT NULL AND comments != '' THEN comments || ' | ' || $3::text
                        ELSE $3::text
                    END
                ELSE comments
            END
            WHERE id = $2 AND point_type IN ('BONUS', 'PENALTY')
            RETURNING id, team_id, point_value, point_type, comments, updated_at, status
        `, [status, id, refereeComment]);

        if (result.rows.length === 0) {
            return NextResponse.json({
                success: false,
                message: 'Extra point not found'
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            extraPoint: result.rows[0],
            message: `Extra point ${status.toLowerCase()} successfully`
        });
    } catch (error) {
        console.error('Error updating extra point status:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to update extra point status',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, point_value, comments } = body;

        // Validate required fields
        if (!id || point_value === undefined) {
            return NextResponse.json({
                success: false,
                message: 'Missing required fields: id and point_value are required'
            }, { status: 400 });
        }

        // Validate that the point exists and is pending
        const checkResult = await pool.query(`
            SELECT id, status FROM points 
            WHERE id = $1 AND point_type IN ('BONUS', 'PENALTY')
        `, [id]);

        if (checkResult.rows.length === 0) {
            return NextResponse.json({
                success: false,
                message: 'Extra point not found'
            }, { status: 404 });
        }

        if (checkResult.rows[0].status !== 'PENDING') {
            return NextResponse.json({
                success: false,
                message: 'Only pending extra points can be modified'
            }, { status: 400 });
        }

        // Update the point value and comments
        const result = await pool.query(`
            UPDATE points 
            SET point_value = $1, comments = $2, updated_at = CURRENT_TIMESTAMP
            WHERE id = $3 AND point_type IN ('BONUS', 'PENALTY') AND status = 'PENDING'
            RETURNING id, team_id, point_value, point_type, comments, updated_at, status
        `, [point_value, comments || null, id]);

        if (result.rows.length === 0) {
            return NextResponse.json({
                success: false,
                message: 'Failed to update extra point'
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            extraPoint: result.rows[0],
            message: 'Extra point modified successfully'
        });
    } catch (error) {
        console.error('Error modifying extra point:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to modify extra point',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 