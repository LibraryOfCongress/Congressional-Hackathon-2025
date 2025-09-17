-- Congressional Hearings Markdown Converter - Database Setup
-- Run this SQL in your Supabase SQL editor to set up the markdown table

-- Create the congressional_hearings_markdown table
CREATE TABLE IF NOT EXISTS congressional_hearings_markdown (
  id SERIAL PRIMARY KEY,
  original_hearing_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  committee TEXT,
  date DATE, -- Nullable to handle missing dates
  markdown_content TEXT NOT NULL,
  word_count INTEGER DEFAULT 0,
  content_source TEXT DEFAULT 'none', -- 'govinfo', 'pdf', 'database', or 'none'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_markdown_hearings_original_id 
  ON congressional_hearings_markdown(original_hearing_id);
CREATE INDEX IF NOT EXISTS idx_markdown_hearings_date 
  ON congressional_hearings_markdown(date);
CREATE INDEX IF NOT EXISTS idx_markdown_hearings_title 
  ON congressional_hearings_markdown USING gin(to_tsvector('english', title));

-- Create update trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_congressional_hearings_markdown_updated_at
    BEFORE UPDATE ON congressional_hearings_markdown
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE congressional_hearings_markdown IS 'Stores congressional hearings converted to markdown format';
COMMENT ON COLUMN congressional_hearings_markdown.original_hearing_id IS 'References the original hearing in congressional_hearings table';
COMMENT ON COLUMN congressional_hearings_markdown.markdown_content IS 'Full hearing content in markdown format';
COMMENT ON COLUMN congressional_hearings_markdown.word_count IS 'Total word count of the markdown content';
COMMENT ON COLUMN congressional_hearings_markdown.content_source IS 'Source of content: govinfo, pdf, database, or none';

-- If you already have the table but missing the content_source column, run this:
-- ALTER TABLE congressional_hearings_markdown 
-- ADD COLUMN IF NOT EXISTS content_source TEXT DEFAULT 'none';
