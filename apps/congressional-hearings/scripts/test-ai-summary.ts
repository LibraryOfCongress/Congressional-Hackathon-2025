import * as dotenv from 'dotenv';
import { join } from 'path';
import { generateHearingSummary } from '../lib/openai-service';

// Load environment variables
dotenv.config({ path: join(__dirname, '../../../.env') });

const test = async () => {
  console.log('Testing AI Summary Generation...');
  console.log('API Key present:', !!process.env.OPENAI_API_KEY);

  const context = {
    title: 'Examining Solutions to Expedite Broadband Permitting',
    committee_name: 'House Energy and Commerce Committee',
    chamber: 'House',
    event_date: '2024-01-22',
    meeting_type: 'Legislative'
  };

  console.log('\nGenerating summary for:', context.title);

  try {
    const result = await generateHearingSummary(context);

    if (result) {
      console.log('\n✅ SUCCESS! Summary generated:');
      console.log('=====================================');
      console.log('Summary:', result.summary);
      console.log('\nPurpose:', result.purpose);
      console.log('\nKey Topics:', result.key_topics);
      console.log('\nImportance Level:', result.importance_level);
    } else {
      console.log('❌ Failed to generate summary');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

test().catch(console.error);