import { NextResponse } from "next/server";
import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Reset all matches: set winner_id and loser_id to null
    await client.query(
      `UPDATE double_elim_matches 
       SET winner_id = NULL, loser_id = NULL, played_at = NULL
       WHERE event_id = $1`,
      [eventId]
    );

    // Reset team assignments based on the specified logic:
    // - Set team2_id = null in every match except winner rounds 1 and 2
    // - Set team1_id = null in every match except winner round 1
    await client.query(
      `UPDATE double_elim_matches 
       SET team2_id = NULL
       WHERE event_id = $1 AND (bracket != 'W' OR round > 2)`,
      [eventId]
    );

    await client.query(
      `UPDATE double_elim_matches 
       SET team1_id = NULL
       WHERE event_id = $1 AND (bracket != 'W' OR round > 1)`,
      [eventId]
    );

    // Reset event status if it was completed
    await client.query(
      `UPDATE events 
       SET event_status = 'SCHEDULED', updated_at = CURRENT_TIMESTAMP
       WHERE event_id = $1`,
      [eventId]
    );

    // Delete any points awarded for this event
    await client.query(
      `DELETE FROM points 
       WHERE event_id = $1 AND point_type = 'EVENT'`,
      [eventId]
    );

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: 'Double elimination bracket reset successfully'
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Error resetting double elimination bracket:", err);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to reset bracket',
        details: err instanceof Error ? err.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
} 