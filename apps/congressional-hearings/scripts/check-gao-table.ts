import * as dotenv from 'dotenv';
import { Client } from 'pg';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: join(__dirname, '../../../.env') });

async function checkGAOTable() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    await client.connect();
    console.log('Connected to database\n');

    // Check if gao_reports table exists
    const tableExistsQuery = `
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'gao_reports'
      );
    `;

    const tableExists = await client.query(tableExistsQuery);

    if (!tableExists.rows[0].exists) {
      console.log('❌ gao_reports table does not exist');

      // Let's create it
      console.log('\n📊 Creating gao_reports table...');

      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS gao_reports (
          id SERIAL PRIMARY KEY,
          report_number VARCHAR(100) UNIQUE NOT NULL,
          title TEXT NOT NULL,
          published_date DATE,
          summary TEXT,
          url VARCHAR(500),
          topics TEXT[],
          agencies TEXT[],
          recommendations JSONB,
          committee_relevance TEXT[],
          keywords TEXT[],
          pdf_url VARCHAR(500),
          highlights TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_gao_reports_number ON gao_reports(report_number);
        CREATE INDEX IF NOT EXISTS idx_gao_reports_date ON gao_reports(published_date);
        CREATE INDEX IF NOT EXISTS idx_gao_reports_topics ON gao_reports USING gin(topics);
        CREATE INDEX IF NOT EXISTS idx_gao_reports_agencies ON gao_reports USING gin(agencies);
        CREATE INDEX IF NOT EXISTS idx_gao_reports_keywords ON gao_reports USING gin(keywords);
        CREATE INDEX IF NOT EXISTS idx_gao_reports_committees ON gao_reports USING gin(committee_relevance);
      `;

      await client.query(createTableSQL);
      console.log('✓ gao_reports table created successfully');

    } else {
      console.log('✓ gao_reports table exists');

      // Get table structure
      const columnsQuery = `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'gao_reports'
        ORDER BY ordinal_position;
      `;

      const columns = await client.query(columnsQuery);

      console.log('\nTable structure:');
      console.log('=====================================');
      columns.rows.forEach(col => {
        console.log(`${col.column_name}: ${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''}`);
      });

      // Get sample data
      const sampleQuery = `
        SELECT COUNT(*) as total,
               MAX(published_date) as latest_report,
               MIN(published_date) as oldest_report
        FROM gao_reports;
      `;

      const sampleData = await client.query(sampleQuery);

      console.log('\nTable statistics:');
      console.log('=====================================');
      console.log(`Total reports: ${sampleData.rows[0].total}`);
      console.log(`Latest report: ${sampleData.rows[0].latest_report || 'N/A'}`);
      console.log(`Oldest report: ${sampleData.rows[0].oldest_report || 'N/A'}`);
    }

  } catch (error) {
    console.error('Error checking GAO table:', error);
    throw error;
  } finally {
    await client.end();
    console.log('\nDatabase connection closed');
  }
}

// Execute if run directly
if (require.main === module) {
  checkGAOTable()
    .then(() => {
      console.log('✅ Check complete');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Check failed:', err);
      process.exit(1);
    });
}