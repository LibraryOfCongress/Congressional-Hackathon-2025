import { NextRequest, NextResponse } from 'next/server';
import { PrepSheetGenerator } from '@/lib/prep-sheet-service';

export const maxDuration = 60; // Allow up to 60 seconds for generation

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hearingId, eventId } = body;

    if (!hearingId && !eventId) {
      return NextResponse.json(
        { error: 'Either hearingId or eventId is required' },
        { status: 400 }
      );
    }

    const generator = new PrepSheetGenerator();

    try {
      await generator.connect();

      let prepSheetId;

      if (hearingId) {
        // Generate prep sheet for a specific hearing ID
        console.log(`Generating prep sheet for hearing ${hearingId}...`);
        const prepSheet = await generator.generatePrepSheet(hearingId);

        if (!prepSheet) {
          return NextResponse.json(
            { error: 'Failed to generate prep sheet' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Prep sheet generated successfully',
          hearingId,
          prepSheet
        });
      } else if (eventId) {
        // Check if prep sheet already exists
        const existing = await generator.getPrepSheet(eventId);

        if (existing) {
          return NextResponse.json({
            success: true,
            message: 'Prep sheet already exists',
            prepSheet: existing,
            cached: true
          });
        }

        // Find hearing by event ID and generate
        const { Client } = require('pg');
        const client = new Client({
          host: process.env.DB_HOST,
          port: parseInt(process.env.DB_PORT || '5432'),
          database: process.env.DB_DATABASE,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
        });

        await client.connect();

        const hearingQuery = `
          SELECT id FROM upcoming_committee_hearings
          WHERE event_id = $1
        `;

        const hearingResult = await client.query(hearingQuery, [eventId]);
        await client.end();

        if (hearingResult.rows.length === 0) {
          return NextResponse.json(
            { error: 'Hearing not found' },
            { status: 404 }
          );
        }

        const prepSheet = await generator.generatePrepSheet(hearingResult.rows[0].id);

        if (!prepSheet) {
          return NextResponse.json(
            { error: 'Failed to generate prep sheet' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Prep sheet generated successfully',
          eventId,
          prepSheet
        });
      }
    } finally {
      await generator.disconnect();
    }
  } catch (error) {
    console.error('Error in prep sheet generation endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}