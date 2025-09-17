import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: join(__dirname, '../../../.env') });

const API_KEY = process.env.CONGRESS_GOV_API_KEY;

if (!API_KEY) {
  console.error('CONGRESS_GOV_API_KEY not found in environment variables');
  process.exit(1);
}

async function testCommitteeMeetingAPI() {
  console.log('\n=== Testing Committee Meeting API ===');
  const url = `https://api.congress.gov/v3/committee-meeting?api_key=${API_KEY}&limit=5`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    console.log('Total meetings found:', data.pagination?.count || 0);
    console.log('\nFirst few meetings:');

    if (data.committeeMeetings) {
      data.committeeMeetings.forEach((meeting: any, index: number) => {
        console.log(`\n${index + 1}. Meeting:`, {
          chamber: meeting.chamber,
          committee: meeting.committees?.[0]?.name,
          eventDate: meeting.eventDate,
          type: meeting.type,
          url: meeting.url
        });
      });
    }
  } catch (error) {
    console.error('Error fetching committee meetings:', error);
  }
}

async function testHearingAPI() {
  console.log('\n=== Testing Hearing API ===');
  const url = `https://api.congress.gov/v3/hearing?api_key=${API_KEY}&limit=5`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    console.log('Total hearings found:', data.pagination?.count || 0);
    console.log('\nFirst few hearings:');

    if (data.hearings) {
      data.hearings.forEach((hearing: any, index: number) => {
        console.log(`\n${index + 1}. Hearing:`, {
          chamber: hearing.chamber,
          congress: hearing.congress,
          date: hearing.date,
          title: hearing.title,
          number: hearing.number,
          updateDate: hearing.updateDate,
          url: hearing.url
        });
      });
    }
  } catch (error) {
    console.error('Error fetching hearings:', error);
  }
}

async function testUpcomingMeetings() {
  console.log('\n=== Testing Upcoming Meetings (filtering by date) ===');

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  // Committee meetings with fromEventDate filter
  const meetingUrl = `https://api.congress.gov/v3/committee-meeting?api_key=${API_KEY}&fromEventDate=${today}&limit=10`;

  try {
    const response = await fetch(meetingUrl);
    const data = await response.json();

    console.log(`\nUpcoming meetings from ${today}:`, data.pagination?.count || 0);

    if (data.committeeMeetings) {
      const upcoming = data.committeeMeetings
        .filter((m: any) => new Date(m.eventDate) >= new Date(today))
        .sort((a: any, b: any) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());

      console.log(`Filtered to ${upcoming.length} upcoming meetings\n`);

      upcoming.slice(0, 5).forEach((meeting: any, index: number) => {
        console.log(`${index + 1}. ${meeting.eventDate}:`, {
          chamber: meeting.chamber,
          committee: meeting.committees?.[0]?.name,
          type: meeting.type
        });
      });
    }
  } catch (error) {
    console.error('Error fetching upcoming meetings:', error);
  }
}

// Run all tests
async function main() {
  await testCommitteeMeetingAPI();
  await testHearingAPI();
  await testUpcomingMeetings();
}

main().catch(console.error);