-- Add AI-generated summary fields to the upcoming_committee_hearings table
ALTER TABLE upcoming_committee_hearings
ADD COLUMN IF NOT EXISTS ai_summary TEXT,
ADD COLUMN IF NOT EXISTS ai_key_topics JSONB,
ADD COLUMN IF NOT EXISTS ai_witnesses JSONB,
ADD COLUMN IF NOT EXISTS ai_bills_impact JSONB,
ADD COLUMN IF NOT EXISTS ai_generated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS documents_fetched BOOLEAN DEFAULT FALSE;

-- Add index for faster queries on AI-generated content
CREATE INDEX IF NOT EXISTS idx_ai_generated_at ON upcoming_committee_hearings(ai_generated_at);
CREATE INDEX IF NOT EXISTS idx_documents_fetched ON upcoming_committee_hearings(documents_fetched);