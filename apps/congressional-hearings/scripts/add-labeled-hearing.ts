import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { readFileSync } from 'fs';

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addLabeledHearing() {
  try {
    // Read the labeled transcript
    const transcriptPath = join(__dirname, '../transcripts/transcript_v2_labeled.txt');
    const transcriptContent = readFileSync(transcriptPath, 'utf-8');

    // Parse the transcript to extract metadata
    const firstLine = transcriptContent.split('\n')[0];
    const titleMatch = firstLine.match(/Committee will come to order.*?hearing entitled (.*?)\./);
    const title = titleMatch ? titleMatch[1] : "An Examination of the Specialty Crop Industry";

    // Count words
    const wordCount = transcriptContent.split(/\s+/).filter(word => word.length > 0).length;

    // Prepare hearing data for congressional_hearings_markdown table
    const hearingData = {
      original_hearing_id: 118601, // The Congress.gov event ID
      title: title.replace(/['"]/g, ''),
      committee: "House Agriculture Committee",
      date: '2025-09-16', // Yesterday's date
      markdown_content: transcriptContent,
      word_count: wordCount,
      content_source: 'labeled_transcript'
    };

    // Insert into congressional_hearings_markdown table
    const { data: markdownData, error: markdownError } = await supabase
      .from('congressional_hearings_markdown')
      .insert([hearingData])
      .select()
      .single();

    if (markdownError) {
      console.error('Error inserting into markdown table:', markdownError);
      throw markdownError;
    }

    console.log('✅ Successfully added hearing to historical hearings:');
    console.log(`   ID: ${markdownData.id}`);
    console.log(`   Title: ${markdownData.title}`);
    console.log(`   Committee: ${markdownData.committee}`);
    console.log(`   Date: ${markdownData.date}`);
    console.log(`   Word count: ${markdownData.word_count}`);
    console.log(`   Source: ${markdownData.content_source}`);
    console.log('\n📄 View the hearing at: http://localhost:3002/historical');
    console.log(`📝 View the transcript at: http://localhost:3002/historical/${markdownData.id}/transcript`);

  } catch (error) {
    console.error('Error adding labeled hearing:', error);
  }
}

// Run the script
addLabeledHearing();