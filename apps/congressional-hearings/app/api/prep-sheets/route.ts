import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const eventId = searchParams.get('event_id');
  const id = searchParams.get('id');
  const limit = searchParams.get('limit') || '10';
  const offset = searchParams.get('offset') || '0';

  const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    await client.connect();

    if (eventId) {
      // Get specific prep sheet by event ID
      const query = `
        SELECT
          ps.*,
          h.title as hearing_title,
          h.committee_name,
          h.chamber,
          h.event_date as hearing_date,
          h.location_building,
          h.location_room
        FROM prep_sheets ps
        LEFT JOIN upcoming_committee_hearings h ON ps.hearing_id = h.id
        WHERE ps.event_id = $1 AND ps.is_published = true
        ORDER BY ps.version DESC
        LIMIT 1
      `;

      const result = await client.query(query, [eventId]);

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Prep sheet not found' },
          { status: 404 }
        );
      }

      // Update view count
      await client.query(
        'UPDATE prep_sheets SET view_count = view_count + 1, last_viewed_at = CURRENT_TIMESTAMP WHERE id = $1',
        [result.rows[0].id]
      );

      return NextResponse.json({
        prepSheet: result.rows[0]
      });

    } else if (id) {
      // Get specific prep sheet by ID
      const query = `
        SELECT
          ps.*,
          h.title as hearing_title,
          h.committee_name,
          h.chamber,
          h.event_date as hearing_date,
          h.location_building,
          h.location_room
        FROM prep_sheets ps
        LEFT JOIN upcoming_committee_hearings h ON ps.hearing_id = h.id
        WHERE ps.id = $1
      `;

      const result = await client.query(query, [id]);

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Prep sheet not found' },
          { status: 404 }
        );
      }

      // Update view count
      await client.query(
        'UPDATE prep_sheets SET view_count = view_count + 1, last_viewed_at = CURRENT_TIMESTAMP WHERE id = $1',
        [id]
      );

      return NextResponse.json({
        prepSheet: result.rows[0]
      });

    } else {
      // Get list of all prep sheets
      const query = `
        SELECT
          ps.id,
          ps.event_id,
          ps.hearing_title,
          ps.committee_name,
          ps.chamber,
          ps.hearing_date,
          ps.executive_summary,
          ps.generated_at,
          ps.view_count,
          ps.confidence_score,
          ps.version,
          h.location_building,
          h.location_room,
          h.meeting_status
        FROM prep_sheets ps
        LEFT JOIN upcoming_committee_hearings h ON ps.hearing_id = h.id
        WHERE ps.is_published = true
          AND ps.hearing_date >= CURRENT_DATE - INTERVAL '7 days'
        ORDER BY ps.hearing_date ASC
        LIMIT $1 OFFSET $2
      `;

      const result = await client.query(query, [parseInt(limit), parseInt(offset)]);

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM prep_sheets
        WHERE is_published = true
          AND hearing_date >= CURRENT_DATE - INTERVAL '7 days'
      `;

      const countResult = await client.query(countQuery);
      const total = parseInt(countResult.rows[0].total);

      return NextResponse.json({
        prepSheets: result.rows,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + parseInt(limit) < total
        }
      });
    }
  } catch (error) {
    console.error('Error fetching prep sheets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prep sheets' },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}