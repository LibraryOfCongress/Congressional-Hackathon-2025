import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.join(__dirname, '../.env') });

interface GAOReport {
  id: string;
  title: string;
  content: string;
  date: string;
  topics: string[];
  metadata: {
    author: string;
    contentTypeId: string;
    creationDate: string;
    creator: string;
    producer: string;
    sourceFile: string;
    processedDate: string;
    conversionMethod: string;
  };
}

interface GAOChunk {
  id: string;
  content: string;
  report_id: string;
  title: string;
  date: string;
  chunk_index: number;
  total_chunks: number;
  topics: string[];
  metadata: any;
}

class GAOReportsProcessor {
  private pinecone: Pinecone;
  private openai: OpenAI;
  private indexName: string = 'gao-reports';
  private dimension: number = 1536; // text-embedding-3-small dimension
  private gaoReportsDir: string = path.join(__dirname, '../../../gao_reports');

  constructor() {
    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    });
  }

  async createPineconeIndex() {
    try {
      console.log(`Checking if index '${this.indexName}' exists...`);
      
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
      const maxAttempts = 30;
      
      while (!isReady && attempts < maxAttempts) {
        try {
          const indexDescription = await this.pinecone.describeIndex(this.indexName);
          isReady = indexDescription.status?.ready === true;
          
          if (!isReady) {
            console.log(`Index not ready yet, waiting... (attempt ${attempts + 1}/${maxAttempts})`);
            await new Promise(resolve => setTimeout(resolve, 10000));
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

  parseGAOReport(filePath: string): GAOReport {
    const content = fs.readFileSync(filePath, 'utf-8');
    const filename = path.basename(filePath, '.md');
    
    // Extract metadata from frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    let metadata: any = {};
    
    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1];
      const lines = frontmatter.split('\n');
      
      for (const line of lines) {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length > 0) {
          const value = valueParts.join(':').trim().replace(/^["']|["']$/g, '');
          metadata[key.trim()] = value;
        }
      }
    }
    
    // Extract title from content
    const titleMatch = content.match(/# Document Metadata[\s\S]*?- \*\*Title\*\*: (.+)/);
    const title = titleMatch ? titleMatch[1] : filename;
    
    // Extract date from metadata or filename
    const date = metadata.creationDate ? 
      new Date(metadata.creationDate).toISOString().split('T')[0] : 
      new Date().toISOString().split('T')[0];
    
    // Extract topics from title and content (simple keyword extraction)
    const topics = this.extractTopics(title, content);
    
    return {
      id: filename,
      title,
      content,
      date,
      topics,
      metadata: {
        author: metadata.author || 'U.S. Government Accountability Office',
        contentTypeId: metadata.contentTypeId || '',
        creationDate: metadata.creationDate || '',
        creator: metadata.creator || '',
        producer: metadata.producer || '',
        sourceFile: metadata.source_file || filename,
        processedDate: metadata.processed_date || new Date().toISOString(),
        conversionMethod: metadata.conversion_method || 'pdfplumber',
      }
    };
  }

  extractTopics(title: string, content: string): string[] {
    const commonTopics = [
      'Cybersecurity', 'Defense', 'Healthcare', 'Education', 'Climate Change',
      'Infrastructure', 'Technology', 'Finance', 'Transportation', 'Energy',
      'Environment', 'National Security', 'Government Operations', 'Audit',
      'Oversight', 'Risk Management', 'Compliance', 'Budget', 'Acquisition'
    ];
    
    const text = (title + ' ' + content).toLowerCase();
    const foundTopics: string[] = [];
    
    for (const topic of commonTopics) {
      if (text.includes(topic.toLowerCase())) {
        foundTopics.push(topic);
      }
    }
    
    // Add some specific GAO-related topics
    if (text.includes('cyber') || text.includes('cybersecurity')) {
      foundTopics.push('Cybersecurity');
    }
    if (text.includes('dod') || text.includes('defense')) {
      foundTopics.push('Defense');
    }
    if (text.includes('medicare') || text.includes('healthcare')) {
      foundTopics.push('Healthcare');
    }
    
    return [...new Set(foundTopics)]; // Remove duplicates
  }

  chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
    // Split by sentences first to maintain context
    const sentences = text.split(/(?<=[.!?])\s+/);
    const chunks: string[] = [];
    let currentChunk = '';
    
    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        
        // Start new chunk with overlap from previous chunk
        const words = currentChunk.split(/\s+/);
        const overlapWords = words.slice(-Math.floor(overlap / 10));
        currentChunk = overlapWords.join(' ') + ' ' + sentence;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
      }
    }
    
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }

  createChunksFromReport(report: GAOReport): GAOChunk[] {
    const chunks = this.chunkText(report.content);
    
    return chunks.map((chunk, index) => ({
      id: `${report.id}_chunk_${index}`,
      content: chunk,
      report_id: report.id,
      title: report.title,
      date: report.date,
      chunk_index: index,
      total_chunks: chunks.length,
      topics: report.topics,
      metadata: report.metadata,
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

  async upsertToPinecone(chunks: GAOChunk[]) {
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
            report_id: chunk.report_id,
            title: chunk.title,
            date: chunk.date,
            chunk_index: chunk.chunk_index,
            total_chunks: chunk.total_chunks,
            topics: chunk.topics,
            ...chunk.metadata,
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

  async processAllGAOReports() {
    try {
      console.log(`Scanning directory: ${this.gaoReportsDir}`);
      
      if (!fs.existsSync(this.gaoReportsDir)) {
        console.log('GAO reports directory does not exist. Creating it...');
        fs.mkdirSync(this.gaoReportsDir, { recursive: true });
        return;
      }
      
      const files = fs.readdirSync(this.gaoReportsDir)
        .filter(file => file.endsWith('.md'))
        .slice(0, 5); // Process first 5 files for testing

      console.log(`Found ${files.length} GAO report files to process`);

      for (const file of files) {
        const filePath = path.join(this.gaoReportsDir, file);
        console.log(`\nProcessing file: ${file}`);
        
        const report = this.parseGAOReport(filePath);
        console.log(`Parsed report: ${report.title}`);
        console.log(`Topics: ${report.topics.join(', ')}`);
        
        const chunks = this.createChunksFromReport(report);
        console.log(`Generated ${chunks.length} chunks from ${file}`);
        
        await this.upsertToPinecone(chunks);
        console.log(`✓ Completed processing ${file}`);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log('\n✓ All GAO reports processed successfully!');
    } catch (error) {
      console.error('Error processing GAO reports:', error);
      throw error;
    }
  }
}

async function main() {
  const processor = new GAOReportsProcessor();

  try {
    console.log('🚀 Starting GAO Reports Pinecone Upsert Process');
    console.log('================================================');
    
    // Step 1: Create Pinecone index if it doesn't exist
    await processor.createPineconeIndex();
    
    // Step 2: Process all GAO reports
    await processor.processAllGAOReports();
    
    console.log('================================================');
    console.log('✅ GAO Reports Pinecone Upsert Process Complete!');
  } catch (error) {
    console.error('❌ Error during upsert process:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { GAOReportsProcessor };
