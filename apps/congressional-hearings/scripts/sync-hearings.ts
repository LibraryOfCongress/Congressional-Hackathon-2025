import * as dotenv from 'dotenv';
import { Client } from 'pg';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: join(__dirname, '../../../.env') });

const API_KEY = process.env.CONGRESS_GOV_API_KEY;

if (!API_KEY) {
  console.error('CONGRESS_GOV_API_KEY not found in environment variables');
  process.exit(1);
}

interface CommitteeMeeting {
  eventId: string;
  chamber: string;
  congress: number;
  date?: string;
  title?: string;
  type?: string;
  meetingStatus?: string;
  committees?: Array<{
    name: string;
    systemCode: string;
    url: string;
  }>;
  location?: {
    building: string;
    room: string;
  };
  relatedItems?: {
    bills?: any[];
    nominations?: any[];
  };
  meetingDocuments?: any[];
  url: string;
}

class HearingSyncService {
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

  async fetchMeetingDetails(url: string): Promise<CommitteeMeeting | null> {
    try {
      const detailUrl = `${url}&api_key=${API_KEY}`;
      const response = await fetch(detailUrl);

      if (!response.ok) {
        console.error(`Failed to fetch meeting details: ${response.status}`);
        return null;
      }

      const data = await response.json();
      return data.committeeMeeting || null;
    } catch (error) {
      console.error('Error fetching meeting details:', error);
      return null;
    }
  }

  async fetchUpcomingMeetings(limit: number = 100): Promise<CommitteeMeeting[]> {
    console.log(`Fetching upcoming committee meetings (limit: ${limit})...`);

    const today = new Date();
    const endDate = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days from now

    const url = `https://api.congress.gov/v3/committee-meeting?api_key=${API_KEY}&fromEventDate=${today.toISOString().split('T')[0]}&toEventDate=${endDate.toISOString().split('T')[0]}&limit=${limit}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (!data.committeeMeetings) {
        console.log('No committee meetings found');
        return [];
      }

      console.log(`Found ${data.committeeMeetings.length} meetings in list`);

      // Fetch detailed data for each meeting
      const detailedMeetings: CommitteeMeeting[] = [];

      for (const meeting of data.committeeMeetings) {
        console.log(`Fetching details for meeting ${meeting.chamber}/${meeting.eventId}...`);
        const details = await this.fetchMeetingDetails(meeting.url);

        if (details) {
          detailedMeetings.push(details);
        }

        // Add a small delay to be respectful to the API
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Filter to only include future meetings
      const upcomingMeetings = detailedMeetings.filter(meeting => {
        if (!meeting.date) return false;
        const meetingDate = new Date(meeting.date);
        return meetingDate >= today;
      });

      console.log(`Filtered to ${upcomingMeetings.length} upcoming meetings`);
      return upcomingMeetings;
    } catch (error) {
      console.error('Error fetching meetings:', error);
      return [];
    }
  }

  async upsertMeeting(meeting: CommitteeMeeting) {
    const query = `
      INSERT INTO upcoming_committee_hearings (
        event_id,
        chamber,
        congress,
        event_date,
        title,
        committee_name,
        committee_system_code,
        committee_url,
        location_building,
        location_room,
        meeting_type,
        meeting_status,
        api_url,
        related_bills,
        related_nominations,
        meeting_documents,
        last_fetched_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      ON CONFLICT (event_id) DO UPDATE SET
        chamber = EXCLUDED.chamber,
        congress = EXCLUDED.congress,
        event_date = EXCLUDED.event_date,
        title = EXCLUDED.title,
        committee_name = EXCLUDED.committee_name,
        committee_system_code = EXCLUDED.committee_system_code,
        committee_url = EXCLUDED.committee_url,
        location_building = EXCLUDED.location_building,
        location_room = EXCLUDED.location_room,
        meeting_type = EXCLUDED.meeting_type,
        meeting_status = EXCLUDED.meeting_status,
        api_url = EXCLUDED.api_url,
        related_bills = EXCLUDED.related_bills,
        related_nominations = EXCLUDED.related_nominations,
        meeting_documents = EXCLUDED.meeting_documents,
        last_fetched_at = EXCLUDED.last_fetched_at
    `;

    const values = [
      meeting.eventId,
      meeting.chamber,
      meeting.congress,
      meeting.date ? new Date(meeting.date) : null,
      meeting.title || null,
      meeting.committees?.[0]?.name || null,
      meeting.committees?.[0]?.systemCode || null,
      meeting.committees?.[0]?.url || null,
      meeting.location?.building || null,
      meeting.location?.room || null,
      meeting.type || null,
      meeting.meetingStatus || null,
      meeting.url,
      JSON.stringify(meeting.relatedItems?.bills || []),
      JSON.stringify(meeting.relatedItems?.nominations || []),
      JSON.stringify(meeting.meetingDocuments || []),
      new Date()
    ];

    try {
      await this.client.query(query, values);
      console.log(`Upserted meeting: ${meeting.eventId} - ${meeting.title?.substring(0, 50)}...`);
    } catch (error) {
      console.error(`Error upserting meeting ${meeting.eventId}:`, error);
    }
  }

  async cleanupOldMeetings() {
    const query = `
      DELETE FROM upcoming_committee_hearings
      WHERE event_date < CURRENT_DATE - INTERVAL '1 day'
    `;

    try {
      const result = await this.client.query(query);
      console.log(`Cleaned up ${result.rowCount} old meetings`);
    } catch (error) {
      console.error('Error cleaning up old meetings:', error);
    }
  }

  async sync() {
    console.log('Starting hearing sync...');
    console.log('=' * 50);

    try {
      await this.connect();

      // Fetch upcoming meetings
      const meetings = await this.fetchUpcomingMeetings(50); // Start with 50 for initial test

      console.log(`\nSyncing ${meetings.length} meetings to database...`);

      // Upsert each meeting
      for (const meeting of meetings) {
        await this.upsertMeeting(meeting);
      }

      // Clean up old meetings
      await this.cleanupOldMeetings();

      // Get summary
      const countResult = await this.client.query(
        'SELECT COUNT(*) as count FROM upcoming_committee_hearings WHERE event_date >= CURRENT_DATE'
      );

      console.log('\n' + '=' * 50);
      console.log(`Sync completed! Total upcoming meetings in database: ${countResult.rows[0].count}`);
    } finally {
      await this.disconnect();
    }
  }
}

// Run the sync if this script is executed directly
if (require.main === module) {
  const syncService = new HearingSyncService();
  syncService.sync().catch(console.error);
}

export default HearingSyncService;