import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const chamber = searchParams.get('chamber');
  const limit = searchParams.get('limit') || '20';
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

    let query = `
      SELECT
        id,
        event_id,
        chamber,
        congress,
        event_date,
        title,
        committee_name,
        committee_system_code,
        location_building,
        location_room,
        meeting_type,
        meeting_status,
        api_url,
        related_bills,
        related_nominations,
        meeting_documents,
        ai_summary,
        ai_key_topics,
        ai_witnesses,
        ai_bills_impact,
        ai_generated_at
      FROM upcoming_committee_hearings
      WHERE event_date >= CURRENT_DATE
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (chamber) {
      query += ` AND LOWER(chamber) = LOWER($${paramIndex})`;
      params.push(chamber);
      paramIndex++;
    }

    query += ` ORDER BY event_date ASC`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await client.query(query, params);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM upcoming_committee_hearings
      WHERE event_date >= CURRENT_DATE
    `;

    const countParams: any[] = [];
    if (chamber) {
      countQuery += ` AND LOWER(chamber) = LOWER($1)`;
      countParams.push(chamber);
    }

    const countResult = await client.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    return NextResponse.json({
      hearings: result.rows,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < total
      }
    });
  } catch (error) {
    console.error('Error fetching hearings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hearings' },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}