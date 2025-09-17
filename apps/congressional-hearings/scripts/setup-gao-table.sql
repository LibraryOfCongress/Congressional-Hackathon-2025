-- GAO Reports Database Setup
-- Run this SQL in your Supabase SQL editor to set up the gao_reports table

-- Create the gao_reports table (similar structure to congressional_hearings_markdown)
CREATE TABLE IF NOT EXISTS gao_reports (
  id SERIAL PRIMARY KEY,
  gao_id TEXT NOT NULL UNIQUE, -- e.g., "gao-25-107121"
  title TEXT NOT NULL,
  processed_date TIMESTAMP,
  source_file TEXT,
  conversion_method TEXT DEFAULT 'pdfplumber',
  author TEXT DEFAULT 'U.S. Government Accountability Office',
  creation_date TEXT,
  modified_date TEXT,
  markdown_content TEXT NOT NULL,
  word_count INTEGER DEFAULT 0,
  page_count INTEGER DEFAULT 0,
  content_source TEXT DEFAULT 'pdf',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_gao_reports_gao_id 
  ON gao_reports(gao_id);
CREATE INDEX IF NOT EXISTS idx_gao_reports_processed_date 
  ON gao_reports(processed_date);
CREATE INDEX IF NOT EXISTS idx_gao_reports_title 
  ON gao_reports USING gin(to_tsvector('english', title));

-- Create update trigger
CREATE OR REPLACE FUNCTION update_gao_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_gao_reports_updated_at
    BEFORE UPDATE ON gao_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_gao_reports_updated_at();

-- Add comments
COMMENT ON TABLE gao_reports IS 'Stores GAO (Government Accountability Office) reports in markdown format';
COMMENT ON COLUMN gao_reports.gao_id IS 'Unique GAO report identifier (e.g., gao-25-107121)';
COMMENT ON COLUMN gao_reports.markdown_content IS 'Full report content in markdown format';
COMMENT ON COLUMN gao_reports.word_count IS 'Total word count of the markdown content';
COMMENT ON COLUMN gao_reports.page_count IS 'Number of pages in the original PDF';
