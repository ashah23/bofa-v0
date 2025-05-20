import { NextResponse } from "next/server"
import pool from "@/lib/db"

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const eventId = searchParams.get('eventId')

        const query = eventId
            ? `
        SELECT g.* 
        FROM wc_groups g
        WHERE g.event_id = $1
        ORDER BY g.name
      `
            : `
        SELECT * FROM wc_groups
        ORDER BY name
      `

        const result = await pool.query(query, eventId ? [eventId] : [])

        return NextResponse.json({ groups: result.rows })
    } catch (error) {
        console.error('Error fetching groups:', error)
        return NextResponse.json(
            { error: 'Failed to fetch groups' },
            { status: 500 }
        )
    }
} 