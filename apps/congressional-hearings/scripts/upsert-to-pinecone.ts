import { Pinecone } from '@pinecone-database/pinecone';
import { Client } from 'pg';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

interface HearingRecord {
  id: number;
  original_hearing_id: number;
  title: string;
  committee?: string;
  date: string;
  markdown_content: string;
  word_count?: number;
  content_source?: string;
  created_at?: string;
}

interface HearingChunk {
  id: string;
  content: string;
  original_hearing_id: number;
  title: string;
  committee?: string;
  date: string;
  chunk_index: number;
  total_chunks: number;
  word_count?: number;
  content_source?: string;
  created_at?: string;
}

class PineconeUpsertService {
  private pinecone: Pinecone;
  private openai: OpenAI;
  private pgClient: Client;
  private indexName: string = 'congresshacks';
  private dimension: number = 1536; // text-embedding-3-small dimension

  constructor() {
    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    });

    this.pgClient = new Client({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_DATABASE,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: {
        rejectUnauthorized: false,
      },
    });
  }

  async connect() {
    await this.pgClient.connect();
    console.log('Connected to PostgreSQL database');
  }

  async disconnect() {
    await this.pgClient.end();
    console.log('Disconnected from PostgreSQL database');
  }

  async createPineconeIndex() {
    try {
      console.log(`Checking if index '${this.indexName}' exists...`);
      
      // List existing indexes
      const existingIndexes = await this.pinecone.listIndexes();
      const indexExists = existingIndexes.indexes?.some(index => index.name === this.indexName);
      
      if (indexExists) {
        console.log(`✓ Index '${this.indexName}' already exists`);
        return;
      }
      
      console.log(`Creating new index '${this.indexName}'...`);
      
      await this.pinecone.createIndex({
        name: this.indexName,
        dimension: this.dimension,
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1'
          }
        }
      });
      
      console.log(`✓ Successfully created index '${this.indexName}'`);
      
      // Wait for index to be ready
      console.log('Waiting for index to be ready...');
      let isReady = false;
      let attempts = 0;
      const maxAttempts = 30; // 5 minutes max wait
      
      while (!isReady && attempts < maxAttempts) {
        try {
          const indexDescription = await this.pinecone.describeIndex(this.indexName);
          isReady = indexDescription.status?.ready === true;
          
          if (!isReady) {
            console.log(`Index not ready yet, waiting... (attempt ${attempts + 1}/${maxAttempts})`);
            await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
            attempts++;
          }
        } catch (error) {
          console.log(`Error checking index status: ${error}`);
          await new Promise(resolve => setTimeout(resolve, 10000));
          attempts++;
        }
      }
      
      if (isReady) {
        console.log('✓ Index is ready for use');
      } else {
        console.log('⚠ Index creation is taking longer than expected, but continuing...');
      }
      
    } catch (error) {
      console.error('Error creating Pinecone index:', error);
      throw error;
    }
  }

  async fetchRecordsFromSupabase(limit: number = 10, offset: number = 0): Promise<HearingRecord[]> {
    const query = `
      SELECT id, original_hearing_id, title, committee, date, markdown_content, word_count, content_source, created_at
      FROM congressional_hearings_markdown
      ORDER BY id
      LIMIT $1 OFFSET $2
    `;

    const result = await this.pgClient.query(query, [limit, offset]);
    return result.rows.map(row => ({
      id: row.id,
      original_hearing_id: row.original_hearing_id,
      title: row.title,
      committee: row.committee,
      date: row.date,
      markdown_content: row.markdown_content,
      word_count: row.word_count,
      content_source: row.content_source,
      created_at: row.created_at,
    }));
  }

  chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
    // Split by sentences first to maintain context
    const sentences = text.split(/(?<=[.!?])\s+/);
    const chunks: string[] = [];
    let currentChunk = '';
    
    for (const sentence of sentences) {
      // If adding this sentence would exceed chunk size, save current chunk
      if (currentChunk.length + sentence.length > chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        
        // Start new chunk with overlap from previous chunk
        const words = currentChunk.split(/\s+/);
        const overlapWords = words.slice(-Math.floor(overlap / 10)); // Approximate overlap
        currentChunk = overlapWords.join(' ') + ' ' + sentence;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
      }
    }
    
    // Add the last chunk if it has content
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }

  createChunksFromRecord(record: HearingRecord): HearingChunk[] {
    const chunks = this.chunkText(record.markdown_content);
    
    return chunks.map((chunk, index) => ({
      id: `${record.id}_chunk_${index}`,
      content: chunk,
      original_hearing_id: record.original_hearing_id,
      title: record.title,
      committee: record.committee,
      date: record.date,
      chunk_index: index,
      total_chunks: chunks.length,
      word_count: record.word_count,
      content_source: record.content_source,
      created_at: record.created_at,
    }));
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });
      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }

  async upsertToPinecone(chunks: HearingChunk[]) {
    const index = this.pinecone.index(this.indexName);

    console.log(`Processing ${chunks.length} chunks...`);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`Processing chunk ${i + 1}/${chunks.length}: ${chunk.id}`);

      try {
        const embedding = await this.generateEmbedding(chunk.content);

        const pineconeRecord = {
          id: chunk.id,
          values: embedding,
          metadata: {
            content: chunk.content,
            original_hearing_id: chunk.original_hearing_id,
            title: chunk.title,
            committee: chunk.committee,
            date: chunk.date,
            chunk_index: chunk.chunk_index,
            total_chunks: chunk.total_chunks,
            word_count: chunk.word_count,
            content_source: chunk.content_source,
            created_at: chunk.created_at,
          },
        };

        await index.upsert([pineconeRecord]);
        console.log(`✓ Upserted chunk ${chunk.id}`);

        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`✗ Error processing chunk ${chunk.id}:`, error);
      }
    }
  }

  async getTotalRecordCount(): Promise<number> {
    const result = await this.pgClient.query('SELECT COUNT(*) FROM congressional_hearings_markdown');
    return parseInt(result.rows[0].count);
  }

  async processAllRecords(batchSize: number = 5) {
    const totalCount = await this.getTotalRecordCount();
    console.log(`Total records to process: ${totalCount}`);

    let processed = 0;

    while (processed < totalCount) {
      console.log(`\nProcessing batch: ${processed + 1} to ${Math.min(processed + batchSize, totalCount)}`);

      const records = await this.fetchRecordsFromSupabase(batchSize, processed);

      if (records.length === 0) {
        break;
      }

      // Process each record and create chunks
      for (const record of records) {
        console.log(`\nProcessing record ${record.id}: ${record.title}`);
        const chunks = this.createChunksFromRecord(record);
        console.log(`Created ${chunks.length} chunks from record ${record.id}`);
        
        await this.upsertToPinecone(chunks);
        console.log(`✓ Completed processing record ${record.id}`);
      }

      processed += records.length;
      console.log(`Progress: ${processed}/${totalCount} records processed`);

      // Longer delay between batches to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\n✓ All records processed successfully!');
  }
}

async function main() {
  const service = new PineconeUpsertService();

  try {
    console.log('🚀 Starting Congressional Hearings Pinecone Upsert Process');
    console.log('================================================');
    
    // Step 1: Create Pinecone index if it doesn't exist
    await service.createPineconeIndex();
    
    // Step 2: Connect to database
    await service.connect();
    
    // Step 3: Process all records
    await service.processAllRecords();
    
    console.log('================================================');
    console.log('✅ Congressional Hearings Pinecone Upsert Process Complete!');
  } catch (error) {
    console.error('❌ Error during upsert process:', error);
    process.exit(1);
  } finally {
    await service.disconnect();
  }
}

if (require.main === module) {
  main();
}

export { PineconeUpsertService };