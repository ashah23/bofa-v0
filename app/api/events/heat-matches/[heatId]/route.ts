import { NextResponse } from "next/server"
import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ heatId: string }> }
) {
    try {
        const { heatId } = await params
        const { status, times } = await request.json()

        console.log('Received request:', { heatId, status, times })

        if (!status || !['IN_PROGRESS', 'COMPLETED'].includes(status)) {
            return NextResponse.json(
                { error: 'Invalid status' },
                { status: 400 }
            )
        }

        // If completing the heat, update team times
        if (status === 'COMPLETED' && times) {
            console.log('Updating heat with times:', { heatId, status, times })
            const result = await pool.query(`
                UPDATE heat_matches 
                SET heat_status = $1,
                    team1_time = $2,
                    team2_time = $3,
                    team3_time = $4,
                    team4_time = $5
                WHERE heat_id = $6
                RETURNING *
            `, [
                status,
                times.team1_time || null,
                times.team2_time || null,
                times.team3_time || null,
                times.team4_time || null,
                heatId
            ])

            if (result.rows.length === 0) {
                return NextResponse.json(
                    { error: 'Heat match not found' },
                    { status: 404 }
                )
            }

            return NextResponse.json({ match: result.rows[0] })
        }

        // If just starting the heat, only update status
        console.log('Updating heat status:', { heatId, status })
        const result = await pool.query(`
            UPDATE heat_matches 
            SET heat_status = $1
            WHERE heat_id = $2
            RETURNING *
        `, [status, heatId])

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: 'Heat match not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({ match: result.rows[0] })
    } catch (error) {
        console.error('Error updating heat match:', error)
        return NextResponse.json(
            { error: 'Failed to update heat match', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        )
    }
} 