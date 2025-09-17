import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.join(__dirname, '../.env') });

interface TranscriptChunk {
  id: string;
  content: string;
  hearing_id: string;
  chunk_index: number;
  metadata: {
    title?: string;
    description?: string;
    channel?: string;
    recorded_on?: string;
    original_air_date?: string;
    filename: string;
  };
}

class TranscriptProcessor {
  private pinecone: Pinecone;
  private openai: OpenAI;
  private indexName: string = 'congresshacks';
  private transcriptsDir: string = path.join(__dirname, '../../../transcripts');

  constructor() {
    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    });
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

  parseTranscriptFile(filePath: string): { metadata: any; content: string } {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    const metadata: any = {};
    let contentStartIndex = 0;
    
    // Parse metadata from the beginning of the file
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('Title:')) {
        metadata.title = line.replace('Title:', '').trim();
      } else if (line.startsWith('Description:')) {
        metadata.description = line.replace('Description:', '').trim();
      } else if (line.startsWith('Channel:')) {
        metadata.channel = line.replace('Channel:', '').trim();
      } else if (line.startsWith('Recorded On:')) {
        metadata.recorded_on = line.replace('Recorded On:', '').trim();
      } else if (line.startsWith('Original Air Date:')) {
        metadata.original_air_date = line.replace('Original Air Date:', '').trim();
      } else if (line === '==================================') {
        contentStartIndex = i + 1;
        break;
      }
    }
    
    // Get the actual transcript content
    const transcriptContent = lines.slice(contentStartIndex).join('\n').trim();
    
    return { metadata, content: transcriptContent };
  }

  chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
    const words = text.split(/\s+/);
    const chunks: string[] = [];
    
    for (let i = 0; i < words.length; i += chunkSize - overlap) {
      const chunk = words.slice(i, i + chunkSize).join(' ');
      if (chunk.trim().length > 0) {
        chunks.push(chunk.trim());
      }
    }
    
    return chunks;
  }

  async processTranscriptFile(filePath: string): Promise<TranscriptChunk[]> {
    const filename = path.basename(filePath);
    const { metadata, content } = this.parseTranscriptFile(filePath);
    
    // Extract hearing ID from filename (the part before the first dot)
    const hearingId = filename.split('.')[0];
    
    // Chunk the content
    const chunks = this.chunkText(content);
    
    const transcriptChunks: TranscriptChunk[] = chunks.map((chunk, index) => ({
      id: `${hearingId}_chunk_${index}`,
      content: chunk,
      hearing_id: hearingId,
      chunk_index: index,
      metadata: {
        ...metadata,
        filename,
      },
    }));
    
    return transcriptChunks;
  }

  async upsertToPinecone(chunks: TranscriptChunk[]) {
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
            hearing_id: chunk.hearing_id,
            chunk_index: chunk.chunk_index,
            ...chunk.metadata,
          },
        };

        await index.upsert([pineconeRecord]);
        console.log(`✓ Upserted chunk ${chunk.id}`);

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`✗ Error processing chunk ${chunk.id}:`, error);
      }
    }
  }

  async processAllTranscripts() {
    try {
      const files = fs.readdirSync(this.transcriptsDir)
        .filter(file => file.endsWith('.txt'))
        .slice(0, 5); // Process first 5 files for testing

      console.log(`Found ${files.length} transcript files to process`);

      for (const file of files) {
        const filePath = path.join(this.transcriptsDir, file);
        console.log(`\nProcessing file: ${file}`);
        
        const chunks = await this.processTranscriptFile(filePath);
        console.log(`Generated ${chunks.length} chunks from ${file}`);
        
        await this.upsertToPinecone(chunks);
        console.log(`✓ Completed processing ${file}`);
        
        // Small delay between files
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log('\n✓ All transcripts processed successfully!');
    } catch (error) {
      console.error('Error processing transcripts:', error);
      throw error;
    }
  }
}

async function main() {
  const processor = new TranscriptProcessor();

  try {
    await processor.processAllTranscripts();
  } catch (error) {
    console.error('Error during processing:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { TranscriptProcessor };
