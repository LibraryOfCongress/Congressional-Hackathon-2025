import { NextRequest, NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const { query, limit = 10 } = await request.json();

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Generate embedding for the search query
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });

    const queryEmbedding = embeddingResponse.data[0].embedding;

    // Search in Pinecone
    const index = pinecone.index('gao-reports'); // Assuming we'll create a separate index for GAO reports
    const searchResponse = await index.query({
      vector: queryEmbedding,
      topK: Math.max(limit, 5), // Ensure we get at least 5 results
      includeMetadata: true,
      includeValues: false,
    });

    // Format the results
    const results = searchResponse.matches?.map((match) => ({
      id: match.id,
      score: match.score,
      content: match.metadata?.content as string,
      title: match.metadata?.title as string,
      report_id: match.metadata?.report_id as string,
      date: match.metadata?.date as string,
      topics: match.metadata?.topics as string[],
      snippet: extractSnippet(match.metadata?.content as string, query),
    })) || [];

    // If no results found, return mock data for demonstration
    if (results.length === 0) {
      console.log('No results found in Pinecone, returning mock data for demonstration');
      const mockResults = [
        {
          id: 'gao-25-107121_chunk_0',
          score: 0.85,
          content: 'DOD CYBERSPACE OPERATIONS: About 500 Organizations Have Roles, with Some Potential Overlap. The Department of Defense operates in cyberspace through a complex network of organizations with overlapping responsibilities.',
          title: 'DOD CYBERSPACE OPERATIONS: About 500 Organizations Have Roles, with Some Potential Overlap',
          report_id: 'GAO-25-107121',
          date: '2025-09-15',
          topics: ['Cybersecurity', 'Defense', 'National Security'],
          snippet: 'DOD CYBERSPACE OPERATIONS: About 500 Organizations Have Roles, with Some Potential Overlap. The Department of Defense operates in cyberspace through a complex network of organizations...',
        },
        {
          id: 'gao-25-106543_chunk_0',
          score: 0.78,
          content: 'Climate Change: Federal Actions Needed to Improve Resilience and Adaptation Planning. Federal agencies need to better coordinate their climate adaptation efforts.',
          title: 'Climate Change: Federal Actions Needed to Improve Resilience and Adaptation Planning',
          report_id: 'GAO-25-106543',
          date: '2025-01-10',
          topics: ['Climate Change', 'Resilience', 'Adaptation'],
          snippet: 'Climate Change: Federal Actions Needed to Improve Resilience and Adaptation Planning. Federal agencies need to better coordinate their climate adaptation efforts...',
        },
        {
          id: 'gao-25-105987_chunk_0',
          score: 0.72,
          content: 'Healthcare: Medicare Advantage Plans Need Better Oversight and Transparency. The Centers for Medicare & Medicaid Services should improve oversight of Medicare Advantage plans.',
          title: 'Healthcare: Medicare Advantage Plans Need Better Oversight and Transparency',
          report_id: 'GAO-25-105987',
          date: '2025-01-05',
          topics: ['Healthcare', 'Medicare', 'Oversight'],
          snippet: 'Healthcare: Medicare Advantage Plans Need Better Oversight and Transparency. The Centers for Medicare & Medicaid Services should improve oversight...',
        }
      ];
      
      return NextResponse.json({
        query,
        results: mockResults,
        totalResults: mockResults.length,
        note: 'Mock data - GAO reports not yet uploaded to Pinecone. Run "npm run upsert-gao-reports" to upload real data.',
      });
    }

    return NextResponse.json({
      query,
      results,
      totalResults: results.length,
    });

  } catch (error) {
    console.error('Error searching GAO reports:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function extractSnippet(content: string, query: string, maxLength: number = 200): string {
  if (!content) return '';
  
  // Find the best match for the query terms
  const queryTerms = query.toLowerCase().split(/\s+/);
  const contentLower = content.toLowerCase();
  
  // Find the first occurrence of any query term
  let bestIndex = -1;
  let bestScore = 0;
  
  for (const term of queryTerms) {
    const index = contentLower.indexOf(term);
    if (index !== -1) {
      // Score based on how early the term appears and term length
      const score = (content.length - index) + (term.length * 10);
      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    }
  }
  
  if (bestIndex === -1) {
    // If no query terms found, return the beginning
    return content.substring(0, maxLength) + (content.length > maxLength ? '...' : '');
  }
  
  // Extract snippet around the best match
  const start = Math.max(0, bestIndex - maxLength / 2);
  const end = Math.min(content.length, start + maxLength);
  
  let snippet = content.substring(start, end);
  
  // Add ellipsis if we're not at the beginning or end
  if (start > 0) snippet = '...' + snippet;
  if (end < content.length) snippet = snippet + '...';
  
  return snippet;
}
