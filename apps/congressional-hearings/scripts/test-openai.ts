import * as dotenv from 'dotenv';
import { join } from 'path';
import OpenAI from 'openai';

// Load environment variables
dotenv.config({ path: join(__dirname, '../../../.env') });

const test = async () => {
  console.log('Testing OpenAI Client...');
  console.log('API Key present:', !!process.env.OPENAI_API_KEY);
  console.log('API Key starts with:', process.env.OPENAI_API_KEY?.substring(0, 10));

  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    console.log('\nClient created successfully');
    console.log('Client has beta:', !!client.beta);
    console.log('Beta has chat:', !!client.beta?.chat);
    console.log('Chat has completions:', !!client.beta?.chat?.completions);

    // Try a simple completion instead
    console.log('\nTrying simple completion...');
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say "Hello, OpenAI is working!"' }
      ],
      temperature: 0.3,
      max_tokens: 50
    });

    console.log('✅ Response:', completion.choices[0].message.content);
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

test().catch(console.error);