-- Drop table if exists for clean setup
DROP TABLE IF EXISTS upcoming_committee_hearings;

-- Create the upcoming_committee_hearings table
CREATE TABLE upcoming_committee_hearings (
    id SERIAL PRIMARY KEY,
    event_id VARCHAR(50) UNIQUE NOT NULL,
    chamber VARCHAR(20) NOT NULL,
    congress INTEGER NOT NULL,
    event_date TIMESTAMPTZ,
    title TEXT,
    committee_name VARCHAR(255),
    committee_system_code VARCHAR(20),
    committee_url TEXT,
    location_building VARCHAR(255),
    location_room VARCHAR(100),
    meeting_type VARCHAR(50),
    meeting_status VARCHAR(50),
    api_url TEXT,

    -- Additional metadata
    related_bills JSONB,
    related_nominations JSONB,
    meeting_documents JSONB,

    -- Tracking fields
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_fetched_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX idx_event_date ON upcoming_committee_hearings(event_date);
CREATE INDEX idx_chamber ON upcoming_committee_hearings(chamber);
CREATE INDEX idx_committee_system_code ON upcoming_committee_hearings(committee_system_code);
CREATE INDEX idx_meeting_status ON upcoming_committee_hearings(meeting_status);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update updated_at
CREATE TRIGGER update_upcoming_committee_hearings_updated_at
    BEFORE UPDATE ON upcoming_committee_hearings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();