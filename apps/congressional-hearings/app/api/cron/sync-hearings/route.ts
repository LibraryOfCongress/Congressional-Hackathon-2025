import { NextRequest, NextResponse } from 'next/server';
import syncAllHearings from '../../../../scripts/sync-all-hearings';

export const maxDuration = 60; // Allow up to 60 seconds for this endpoint

export async function GET(request: NextRequest) {
  // Verify this is from Vercel Cron or authorized source
  const authHeader = request.headers.get('authorization');

  // In production, you'd want to verify this is from Vercel Cron
  // For now, we'll accept the request if it has the right bearer token
  const cronSecret = process.env.CRON_SECRET || 'your-cron-secret';

  if (authHeader !== `Bearer ${cronSecret}`) {
    // Allow Vercel Cron requests (they come without auth header but from internal network)
    const isVercelCron = request.headers.get('user-agent')?.includes('vercel-cron');
    if (!isVercelCron && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }

  try {
    console.log('Starting scheduled hearing sync...');

    // Run the sync
    await syncAllHearings();

    return NextResponse.json({
      success: true,
      message: 'Hearings synced successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error during scheduled sync:', error);
    return NextResponse.json(
      {
        error: 'Failed to sync hearings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}