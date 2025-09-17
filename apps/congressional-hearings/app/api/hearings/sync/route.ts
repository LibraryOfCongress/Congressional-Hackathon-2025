import { NextRequest, NextResponse } from 'next/server';
import HearingSyncService from '../../../../scripts/sync-hearings';

export async function POST(request: NextRequest) {
  // Optional: Add authentication here to protect this endpoint
  // For now, we'll check for a simple secret key
  const authHeader = request.headers.get('authorization');
  const expectedKey = process.env.SYNC_SECRET_KEY || 'default-secret-key';

  if (authHeader !== `Bearer ${expectedKey}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const syncService = new HearingSyncService();
    await syncService.sync();

    return NextResponse.json({
      success: true,
      message: 'Hearings synced successfully'
    });
  } catch (error) {
    console.error('Error syncing hearings:', error);
    return NextResponse.json(
      { error: 'Failed to sync hearings' },
      { status: 500 }
    );
  }
}