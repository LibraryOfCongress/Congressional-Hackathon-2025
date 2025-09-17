import * as dotenv from 'dotenv';
import { Client } from 'pg';
import { join } from 'path';
import { readFileSync } from 'fs';

// Load environment variables
dotenv.config({ path: join(__dirname, '../../../.env') });

async function runMigration() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    console.log('Connecting to database...');
    await client.connect();

    // Read the SQL migration file
    const migrationSQL = readFileSync(join(__dirname, 'create-hearings-table.sql'), 'utf-8');

    console.log('Running migration...');
    await client.query(migrationSQL);

    console.log('Migration completed successfully!');
    console.log('Table "upcoming_committee_hearings" has been created.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration().catch(console.error);