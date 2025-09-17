import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: join(__dirname, '../../../.env') });

const API_KEY = process.env.CONGRESS_GOV_API_KEY;

if (!API_KEY) {
  console.error('CONGRESS_GOV_API_KEY not found in environment variables');
  process.exit(1);
}

async function fetchDetailedMeeting(url: string) {
  const detailUrl = `${url}&api_key=${API_KEY}`;
  const response = await fetch(detailUrl);
  return response.json();
}

async function fetchDetailedHearing(url: string) {
  const detailUrl = `${url}?format=json&api_key=${API_KEY}`;
  const response = await fetch(detailUrl);
  return response.json();
}

async function testDetailedData() {
  console.log('=== Fetching Detailed Committee Meeting Data ===\n');

  // First get a list of meetings
  const listUrl = `https://api.congress.gov/v3/committee-meeting?api_key=${API_KEY}&limit=3`;
  const listResponse = await fetch(listUrl);
  const listData = await listResponse.json();

  if (listData.committeeMeetings && listData.committeeMeetings.length > 0) {
    // Fetch detailed data for first meeting
    const firstMeeting = listData.committeeMeetings[0];
    console.log('Fetching detailed data from:', firstMeeting.url);

    const detailedMeeting = await fetchDetailedMeeting(firstMeeting.url);
    console.log('\nDetailed Meeting Data:', JSON.stringify(detailedMeeting, null, 2));
  }

  console.log('\n=== Fetching Detailed Hearing Data ===\n');

  // Get a list of hearings
  const hearingListUrl = `https://api.congress.gov/v3/hearing?api_key=${API_KEY}&limit=3`;
  const hearingListResponse = await fetch(hearingListUrl);
  const hearingListData = await hearingListResponse.json();

  if (hearingListData.hearings && hearingListData.hearings.length > 0) {
    // Fetch detailed data for first hearing
    const firstHearing = hearingListData.hearings[0];
    console.log('Fetching detailed data from:', firstHearing.url);

    const detailedHearing = await fetchDetailedHearing(firstHearing.url);
    console.log('\nDetailed Hearing Data:', JSON.stringify(detailedHearing, null, 2));
  }

  // Try to get meetings with a specific date range
  console.log('\n=== Testing Date Filters ===\n');

  const today = new Date();
  const endDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

  const dateFilterUrl = `https://api.congress.gov/v3/committee-meeting?api_key=${API_KEY}&fromEventDate=${today.toISOString().split('T')[0]}&toEventDate=${endDate.toISOString().split('T')[0]}&limit=10`;
  console.log('Fetching meetings with date filter:', dateFilterUrl);

  const dateFilterResponse = await fetch(dateFilterUrl);
  const dateFilterData = await dateFilterResponse.json();

  console.log('Meetings found with date filter:', dateFilterData.pagination?.count || 0);

  if (dateFilterData.committeeMeetings && dateFilterData.committeeMeetings.length > 0) {
    console.log('\nFirst meeting with date filter:');
    const detailedDateMeeting = await fetchDetailedMeeting(dateFilterData.committeeMeetings[0].url);
    console.log(JSON.stringify(detailedDateMeeting, null, 2));
  }
}

testDetailedData().catch(console.error);