import * as dotenv from 'dotenv';
import { Client } from 'pg';
import { join } from 'path';
import { generateHearingSummary, fetchDocumentContent, HearingSummary } from '../lib/openai-service';

// Load environment variables
dotenv.config({ path: join(__dirname, '../../../.env') });

const API_KEY = process.env.CONGRESS_GOV_API_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;

if (!API_KEY || !OPENAI_KEY) {
  console.error('Required API keys not found in environment variables');
  process.exit(1);
}

class AISummaryGenerator {
  private client: Client;

  constructor() {
    this.client = new Client({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_DATABASE,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });
  }

  async connect() {
    await this.client.connect();
    console.log('Connected to database');
  }

  async disconnect() {
    await this.client.end();
    console.log('Disconnected from database');
  }

  async generateSummariesForHearings() {
    try {
      // Get hearings that don't have AI summaries yet
      const query = `
        SELECT id, event_id, title, committee_name, chamber, meeting_type,
               related_bills, related_nominations, meeting_documents, event_date, api_url
        FROM upcoming_committee_hearings
        WHERE ai_generated_at IS NULL
          AND event_date >= CURRENT_DATE - INTERVAL '7 days'
        ORDER BY event_date ASC
        LIMIT 10
      `;

      const result = await this.client.query(query);
      const hearings = result.rows;

      console.log(`Found ${hearings.length} hearings without AI summaries`);

      for (const hearing of hearings) {
        console.log(`\nProcessing hearing: ${hearing.title}`);

        try {
          // Try to fetch document content if we have meeting documents
          let documentContent = null;
          if (hearing.meeting_documents && hearing.meeting_documents.length > 0) {
            const firstDoc = hearing.meeting_documents[0];
            if (firstDoc.url) {
              console.log('Fetching document content...');
              documentContent = await fetchDocumentContent(firstDoc.url, API_KEY!);
            }
          }

          // Generate AI summary
          console.log('Generating AI summary...');
          const summary = await generateHearingSummary({
            title: hearing.title,
            committee_name: hearing.committee_name,
            chamber: hearing.chamber,
            meeting_type: hearing.meeting_type,
            related_bills: hearing.related_bills,
            related_nominations: hearing.related_nominations,
            meeting_documents: hearing.meeting_documents,
            event_date: hearing.event_date,
            document_content: documentContent || undefined
          });

          if (summary) {
            // Update the database with the AI summary
            await this.updateHearingWithSummary(hearing.id, summary);
            console.log('✓ AI summary generated and saved');
          } else {
            console.log('✗ Failed to generate AI summary');
          }

          // Rate limiting - wait a bit between requests
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Error processing hearing ${hearing.id}:`, error);
        }
      }

      console.log('\n✓ AI summary generation complete');
    } catch (error) {
      console.error('Error generating AI summaries:', error);
    }
  }

  private async updateHearingWithSummary(hearingId: number, summary: HearingSummary) {
    const updateQuery = `
      UPDATE upcoming_committee_hearings
      SET
        ai_summary = $1,
        ai_key_topics = $2,
        ai_witnesses = $3,
        ai_bills_impact = $4,
        ai_generated_at = CURRENT_TIMESTAMP,
        documents_fetched = true
      WHERE id = $5
    `;

    const values = [
      `${summary.summary}\n\nPurpose: ${summary.purpose}`,
      JSON.stringify({
        topics: summary.key_topics,
        outcomes: summary.potential_outcomes,
        stakeholders: summary.stakeholders,
        importance: summary.importance_level
      }),
      summary.witnesses ? JSON.stringify(summary.witnesses) : null,
      summary.related_legislation ? JSON.stringify(summary.related_legislation) : null,
      hearingId
    ];

    await this.client.query(updateQuery, values);
  }

  // Generate summaries for specific hearing IDs
  async generateForSpecificHearings(eventIds: string[]) {
    try {
      for (const eventId of eventIds) {
        const query = `
          SELECT id, event_id, title, committee_name, chamber, meeting_type,
                 related_bills, related_nominations, meeting_documents, event_date, api_url
          FROM upcoming_committee_hearings
          WHERE event_id = $1
        `;

        const result = await this.client.query(query, [eventId]);
        if (result.rows.length === 0) {
          console.log(`Hearing ${eventId} not found`);
          continue;
        }

        const hearing = result.rows[0];
        console.log(`Processing hearing: ${hearing.title}`);

        const summary = await generateHearingSummary({
          title: hearing.title,
          committee_name: hearing.committee_name,
          chamber: hearing.chamber,
          meeting_type: hearing.meeting_type,
          related_bills: hearing.related_bills,
          related_nominations: hearing.related_nominations,
          meeting_documents: hearing.meeting_documents,
          event_date: hearing.event_date
        });

        if (summary) {
          await this.updateHearingWithSummary(hearing.id, summary);
          console.log('✓ AI summary generated and saved');
        }
      }
    } catch (error) {
      console.error('Error generating specific summaries:', error);
    }
  }
}

// Main execution
async function main() {
  const generator = new AISummaryGenerator();

  try {
    await generator.connect();

    // Check if specific event IDs were provided as arguments
    const args = process.argv.slice(2);
    if (args.length > 0) {
      console.log(`Generating summaries for specific hearings: ${args.join(', ')}`);
      await generator.generateForSpecificHearings(args);
    } else {
      console.log('Generating AI summaries for upcoming hearings...');
      await generator.generateSummariesForHearings();
    }
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await generator.disconnect();
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

export default AISummaryGenerator;