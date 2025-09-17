import * as xml2js from 'xml2js';

async function testSenateFeed() {
  console.log('=== Fetching Senate Hearing XML Feed ===\n');

  try {
    const response = await fetch('https://www.senate.gov/general/committee_schedules/hearings.xml');
    const xmlText = await response.text();

    console.log('XML Response (first 1000 chars):');
    console.log(xmlText.substring(0, 1000));
    console.log('\n...\n');

    // Parse the XML
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xmlText);

    console.log('=== Parsed Structure ===\n');
    console.log(JSON.stringify(result, null, 2).substring(0, 2000));

    // Try to access meetings/hearings
    if (result.meetings && result.meetings.meeting) {
      console.log(`\n=== Found ${result.meetings.meeting.length} meetings ===\n`);

      // Show first few meetings in detail
      const meetings = result.meetings.meeting.slice(0, 3);
      meetings.forEach((meeting: any, index: number) => {
        console.log(`\nMeeting ${index + 1}:`);
        console.log(JSON.stringify(meeting, null, 2));
      });
    }

    // Look for committee schedules
    if (result.committee_schedules) {
      console.log('\n=== Committee Schedules Structure ===');
      console.log(JSON.stringify(result.committee_schedules, null, 2).substring(0, 1000));
    }

  } catch (error) {
    console.error('Error fetching or parsing Senate XML:', error);
  }
}

testSenateFeed().catch(console.error);