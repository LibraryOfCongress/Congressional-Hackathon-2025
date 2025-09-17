import * as dotenv from 'dotenv';
import { Client } from 'pg';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: join(__dirname, '../../../.env') });

async function addAIFields() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Add AI-generated summary fields to the upcoming_committee_hearings table
    const alterTableQuery = `
      ALTER TABLE upcoming_committee_hearings
      ADD COLUMN IF NOT EXISTS ai_summary TEXT,
      ADD COLUMN IF NOT EXISTS ai_key_topics JSONB,
      ADD COLUMN IF NOT EXISTS ai_witnesses JSONB,
      ADD COLUMN IF NOT EXISTS ai_bills_impact JSONB,
      ADD COLUMN IF NOT EXISTS ai_generated_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS documents_fetched BOOLEAN DEFAULT FALSE;
    `;

    await client.query(alterTableQuery);
    console.log('Added AI summary columns');

    // Add indexes for faster queries on AI-generated content
    await client.query('CREATE INDEX IF NOT EXISTS idx_ai_generated_at ON upcoming_committee_hearings(ai_generated_at);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_documents_fetched ON upcoming_committee_hearings(documents_fetched);');
    console.log('Added indexes');

    console.log('Database schema updated successfully!');
  } catch (error) {
    console.error('Error updating database schema:', error);
  } finally {
    await client.end();
  }
}

addAIFields();