import * as dotenv from 'dotenv';
import { Client } from 'pg';
import { join } from 'path';
import * as xml2js from 'xml2js';

// Load environment variables
dotenv.config({ path: join(__dirname, '../../../.env') });

interface SenateMeeting {
  identifier: string;
  last_update: string;
  last_update_iso_8601: string;
  cmte_code: string;
  committee: string;
  date: string;
  date_iso_8601: string;
  day_of_week: string;
  time: string;
  time_iso_8601: string;
  room: string;
  Documents?: {
    AssociatedDocument: Array<{
      $: {
        congress: string;
        document_description: string;
        document_num: string;
        document_prefix: string;
        partition?: string;
      };
    }>;
  };
}

class SenateSyncService {
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

  async fetchSenateHearings(): Promise<SenateMeeting[]> {
    console.log('Fetching Senate hearings from XML feed...');

    try {
      const response = await fetch('https://www.senate.gov/general/committee_schedules/hearings.xml');
      const xmlText = await response.text();

      // Parse the XML
      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(xmlText);

      if (!result.css_meetings_scheduled || !result.css_meetings_scheduled.meeting) {
        console.log('No meetings found in Senate XML feed');
        return [];
      }

      const meetings = result.css_meetings_scheduled.meeting;
      console.log(`Found ${meetings.length} meetings in Senate XML feed`);

      // Transform the parsed XML into our format
      const transformedMeetings: SenateMeeting[] = meetings.map((meeting: any) => ({
        identifier: meeting.identifier?.[0] || '',
        last_update: meeting.last_update?.[0] || '',
        last_update_iso_8601: meeting.last_update_iso_8601?.[0] || '',
        cmte_code: meeting.cmte_code?.[0] || '',
        committee: meeting.committee?.[0] || '',
        date: meeting.date?.[0] || '',
        date_iso_8601: meeting.date_iso_8601?.[0] || '',
        day_of_week: meeting.day_of_week?.[0] || '',
        time: meeting.time?.[0] || '',
        time_iso_8601: meeting.time_iso_8601?.[0] || '',
        room: meeting.room?.[0] || '',
        Documents: meeting.Documents?.[0] || undefined
      }));

      // Filter to only future meetings
      const today = new Date();
      const upcomingMeetings = transformedMeetings.filter(meeting => {
        if (!meeting.date_iso_8601) return false;
        const meetingDate = new Date(meeting.date_iso_8601);
        return meetingDate >= today;
      });

      console.log(`Filtered to ${upcomingMeetings.length} upcoming Senate meetings`);
      return upcomingMeetings;
    } catch (error) {
      console.error('Error fetching Senate hearings:', error);
      return [];
    }
  }

  async upsertSenateMeeting(meeting: SenateMeeting) {
    // Construct the event date from date and time
    let eventDate: Date | null = null;
    if (meeting.date_iso_8601 && meeting.time_iso_8601) {
      const dateTimeStr = `${meeting.date_iso_8601}T${meeting.time_iso_8601}`;
      eventDate = new Date(dateTimeStr);
    } else if (meeting.date_iso_8601) {
      eventDate = new Date(meeting.date_iso_8601);
    }

    // Extract related documents
    const relatedDocuments = meeting.Documents?.AssociatedDocument?.map(doc => ({
      congress: doc.$.congress,
      description: doc.$.document_description,
      number: doc.$.document_num,
      prefix: doc.$.document_prefix,
      partition: doc.$.partition
    })) || [];

    // Create a title from the committee name and document descriptions
    const title = relatedDocuments.length > 0
      ? relatedDocuments[0].description?.substring(0, 200) || `Senate ${meeting.committee} Meeting`
      : `Senate ${meeting.committee} Meeting`;

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
        location_building = EXCLUDED.location_building,
        location_room = EXCLUDED.location_room,
        meeting_type = EXCLUDED.meeting_type,
        meeting_status = EXCLUDED.meeting_status,
        related_bills = EXCLUDED.related_bills,
        related_nominations = EXCLUDED.related_nominations,
        meeting_documents = EXCLUDED.meeting_documents,
        last_fetched_at = EXCLUDED.last_fetched_at
    `;

    // Separate nominations (PN prefix) from bills
    const nominations = relatedDocuments.filter(doc => doc.prefix === 'PN');
    const bills = relatedDocuments.filter(doc => doc.prefix !== 'PN');

    const values = [
      `senate-${meeting.identifier}`, // Prefix with 'senate-' to avoid conflicts
      'Senate',
      119, // Current Congress
      eventDate,
      title,
      `Senate ${meeting.committee}`,
      meeting.cmte_code,
      null, // No API URL for Senate XML feed entries
      'Capitol',
      meeting.room,
      'Hearing',
      'Scheduled',
      `https://www.senate.gov/committees/hearings_meetings.htm`,
      JSON.stringify(bills),
      JSON.stringify(nominations),
      JSON.stringify(relatedDocuments),
      new Date()
    ];

    try {
      await this.client.query(query, values);
      console.log(`Upserted Senate meeting: ${meeting.identifier} - ${title.substring(0, 50)}...`);
    } catch (error) {
      console.error(`Error upserting Senate meeting ${meeting.identifier}:`, error);
    }
  }

  async sync() {
    console.log('Starting Senate hearing sync...');
    console.log('=' * 50);

    try {
      await this.connect();

      // Fetch Senate meetings from XML feed
      const meetings = await this.fetchSenateHearings();

      console.log(`\nSyncing ${meetings.length} Senate meetings to database...`);

      // Upsert each meeting
      for (const meeting of meetings) {
        await this.upsertSenateMeeting(meeting);
      }

      // Get summary
      const countResult = await this.client.query(
        `SELECT COUNT(*) as count FROM upcoming_committee_hearings
         WHERE event_date >= CURRENT_DATE AND chamber = 'Senate'`
      );

      console.log('\n' + '=' * 50);
      console.log(`Sync completed! Total upcoming Senate meetings in database: ${countResult.rows[0].count}`);
    } finally {
      await this.disconnect();
    }
  }
}

// Run the sync if this script is executed directly
if (require.main === module) {
  const syncService = new SenateSyncService();
  syncService.sync().catch(console.error);
}

export default SenateSyncService;