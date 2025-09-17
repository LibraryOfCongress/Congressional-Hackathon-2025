import * as dotenv from 'dotenv';
import { join } from 'path';
import HearingSyncService from './sync-hearings';
import SenateSyncService from './sync-senate-hearings';
import AISummaryGenerator from './generate-ai-summaries';

// Load environment variables
dotenv.config({ path: join(__dirname, '../../../.env') });

async function syncAllHearings() {
  console.log('='.repeat(60));
  console.log('STARTING COMPREHENSIVE HEARING SYNC');
  console.log('='.repeat(60));

  try {
    // Sync from Congress.gov API
    console.log('\n📊 PHASE 1: Congress.gov API Sync');
    console.log('-'.repeat(60));
    const congressSyncService = new HearingSyncService();
    await congressSyncService.sync();

    // Add a delay between syncs
    console.log('\n⏳ Waiting 2 seconds before next sync...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Sync from Senate XML feed
    console.log('\n🏛️ PHASE 2: Senate.gov XML Feed Sync');
    console.log('-'.repeat(60));
    const senateSyncService = new SenateSyncService();
    await senateSyncService.sync();

    // Add a delay before AI generation
    console.log('\n⏳ Waiting 2 seconds before AI summary generation...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate AI summaries for new hearings
    console.log('\n🤖 PHASE 3: AI Summary Generation');
    console.log('-'.repeat(60));
    const aiGenerator = new AISummaryGenerator();
    await aiGenerator.connect();
    await aiGenerator.generateSummariesForHearings();
    await aiGenerator.disconnect();

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL HEARING SYNCS AND AI GENERATION COMPLETED!');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\n❌ Error during sync:', error);
    process.exit(1);
  }
}

// Run the sync if this script is executed directly
if (require.main === module) {
  syncAllHearings().catch(console.error);
}

export default syncAllHearings;