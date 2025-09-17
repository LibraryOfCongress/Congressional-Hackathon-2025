import { PrepSheetGenerator } from '../lib/prep-sheet-service';
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

async function generateAllPrepSheets() {
  const dbClient = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await dbClient.connect();
    console.log('Connected to database');

    // Get all hearings without prep sheets
    const query = `
      SELECT h.id, h.event_id, h.title, h.chamber
      FROM upcoming_committee_hearings h
      LEFT JOIN prep_sheets p ON h.event_id = p.event_id
      WHERE p.id IS NULL
      ORDER BY h.event_date DESC
    `;

    const result = await dbClient.query(query);
    const hearings = result.rows;

    console.log(`Found ${hearings.length} hearings without prep sheets\n`);

    if (hearings.length === 0) {
      console.log('All hearings already have prep sheets!');
      return;
    }

    // Initialize prep sheet generator
    const generator = new PrepSheetGenerator();
    await generator.connect();

    let successCount = 0;
    let failureCount = 0;

    // Generate prep sheets one by one (to avoid rate limits)
    for (const hearing of hearings) {
      console.log(`\n[${successCount + failureCount + 1}/${hearings.length}] Generating prep sheet for:`);
      console.log(`  ID: ${hearing.id}`);
      console.log(`  Event: ${hearing.event_id}`);
      console.log(`  Chamber: ${hearing.chamber}`);
      console.log(`  Title: ${hearing.title?.substring(0, 80)}...`);

      try {
        console.log('  Generating with GPT-5...');
        const prepSheet = await generator.generatePrepSheet(hearing.id);

        if (prepSheet) {
          successCount++;
          console.log('  ✅ Success! Prep sheet generated and saved.');
        } else {
          failureCount++;
          console.log('  ⚠️ Warning: No prep sheet generated (OpenAI returned null)');
        }

        // Add delay to avoid rate limits (3 seconds between requests)
        console.log('  Waiting 3 seconds before next request...');
        await new Promise(resolve => setTimeout(resolve, 3000));

      } catch (error) {
        failureCount++;
        console.error('  ❌ Error:', error instanceof Error ? error.message : 'Unknown error');

        // If we hit a rate limit, wait longer
        if (error instanceof Error && error.message.includes('429')) {
          console.log('  Rate limit detected. Waiting 60 seconds...');
          await new Promise(resolve => setTimeout(resolve, 60000));
        }
      }
    }

    await generator.disconnect();

    console.log('\n========================================');
    console.log('SUMMARY:');
    console.log(`  Total hearings processed: ${hearings.length}`);
    console.log(`  ✅ Successfully generated: ${successCount}`);
    console.log(`  ❌ Failed: ${failureCount}`);
    console.log('========================================\n');

  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await dbClient.end();
  }
}

// Run the script
generateAllPrepSheets().catch(console.error);