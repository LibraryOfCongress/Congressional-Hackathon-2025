import * as dotenv from 'dotenv';
import { Client } from 'pg';
import { join } from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config({ path: join(__dirname, '../../../.env') });

async function createPrepSheetsTable() {
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

    // Read the SQL file
    const sqlPath = join(__dirname, 'create-prep-sheets-table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute the SQL
    await client.query(sql);
    console.log('✓ prep_sheets table created successfully');
    console.log('✓ Indexes created');
    console.log('✓ latest_prep_sheets view created');

  } catch (error) {
    console.error('Error creating prep_sheets table:', error);
    throw error;
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

// Execute if run directly
if (require.main === module) {
  createPrepSheetsTable()
    .then(() => {
      console.log('✅ Setup complete');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Setup failed:', err);
      process.exit(1);
    });
}