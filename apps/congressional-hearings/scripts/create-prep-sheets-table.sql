-- Create the prep_sheets table for storing comprehensive hearing preparation documents
CREATE TABLE IF NOT EXISTS prep_sheets (
  id SERIAL PRIMARY KEY,
  hearing_id INTEGER REFERENCES upcoming_committee_hearings(id),
  event_id VARCHAR(255) NOT NULL,

  -- Basic hearing information (denormalized for quick access)
  hearing_title TEXT,
  committee_name VARCHAR(500),
  hearing_date TIMESTAMP WITH TIME ZONE,
  chamber VARCHAR(50),

  -- Comprehensive prep sheet content
  executive_summary TEXT,
  background_context TEXT,
  key_issues JSONB,

  -- Witness information
  witness_testimonies JSONB,
  witness_backgrounds JSONB,
  anticipated_questions JSONB,

  -- Policy analysis
  policy_implications JSONB,
  legislative_history JSONB,
  stakeholder_positions JSONB,

  -- Related resources
  related_bills JSONB,
  gao_reports JSONB,
  crs_reports JSONB,
  previous_hearings JSONB,

  -- Committee member specific prep
  member_priorities JSONB,
  talking_points JSONB,
  suggested_questions JSONB,

  -- Additional analysis
  controversy_points JSONB,
  media_coverage JSONB,
  expert_opinions JSONB,
  data_visualizations JSONB,

  -- Metadata
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  generation_model VARCHAR(100),
  confidence_score DECIMAL(3,2),

  -- Version control
  version INTEGER DEFAULT 1,
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP WITH TIME ZONE,

  -- Usage tracking
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMP WITH TIME ZONE,
  feedback_score DECIMAL(3,2),
  feedback_comments TEXT,

  UNIQUE(event_id, version)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_prep_sheets_hearing_id ON prep_sheets(hearing_id);
CREATE INDEX IF NOT EXISTS idx_prep_sheets_event_id ON prep_sheets(event_id);
CREATE INDEX IF NOT EXISTS idx_prep_sheets_hearing_date ON prep_sheets(hearing_date);
CREATE INDEX IF NOT EXISTS idx_prep_sheets_committee ON prep_sheets(committee_name);
CREATE INDEX IF NOT EXISTS idx_prep_sheets_published ON prep_sheets(is_published);
CREATE INDEX IF NOT EXISTS idx_prep_sheets_generated_at ON prep_sheets(generated_at);

-- Create a view for the latest version of each prep sheet
CREATE OR REPLACE VIEW latest_prep_sheets AS
SELECT DISTINCT ON (event_id) *
FROM prep_sheets
WHERE is_published = TRUE
ORDER BY event_id, version DESC;