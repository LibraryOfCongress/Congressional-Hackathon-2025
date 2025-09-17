import { z } from 'zod';


// Define the structure for hearing summary using Zod
const HearingSummarySchema = z.object({
  summary: z.string().describe('A concise 2-3 sentence summary of what the hearing is about'),
  purpose: z.string().describe('The main purpose or goal of this hearing'),
  key_topics: z.array(z.string()).describe('List of 3-5 key topics to be discussed'),
  potential_outcomes: z.array(z.string()).describe('List of 2-3 potential outcomes or decisions'),
  stakeholders: z.array(z.string()).describe('Key stakeholder groups affected by this hearing'),
  importance_level: z.enum(['low', 'medium', 'high', 'critical']).describe('Importance level based on impact'),
  witnesses: z.array(z.union([
    z.object({
      name: z.string().optional(),
      title: z.string().optional(),
      organization: z.string().optional(),
      focus_area: z.string().optional()
    }),
    z.string()
  ])).optional().describe('List of witnesses if available'),
  related_legislation: z.array(z.union([
    z.object({
      bill_number: z.string(),
      title: z.string(),
      impact: z.string()
    }),
    z.string()
  ])).optional().describe('Related bills and their potential impact')
});

export type HearingSummary = z.infer<typeof HearingSummarySchema>;

export interface HearingContext {
  title: string;
  committee_name: string;
  chamber: string;
  meeting_type?: string;
  related_bills?: any[];
  related_nominations?: any[];
  meeting_documents?: any[];
  event_date: string;
  document_content?: string;
}

export async function generateHearingSummary(context: HearingContext): Promise<HearingSummary | null> {
  try {
    // Build the context prompt
    let contextPrompt = `Congressional Hearing Analysis:
Title: ${context.title}
Committee: ${context.committee_name}
Chamber: ${context.chamber}
Date: ${context.event_date}
Type: ${context.meeting_type || 'Not specified'}

`;

    // Add related bills information
    if (context.related_bills && context.related_bills.length > 0) {
      contextPrompt += '\nRelated Bills:\n';
      context.related_bills.forEach((bill: any) => {
        contextPrompt += `- ${bill.billNumber || 'Unknown'}: ${bill.title || 'No title'}\n`;
      });
    }

    // Add related nominations information
    if (context.related_nominations && context.related_nominations.length > 0) {
      contextPrompt += '\nRelated Nominations:\n';
      context.related_nominations.forEach((nom: any) => {
        contextPrompt += `- ${nom.name || 'Unknown nominee'} for ${nom.position || 'Unknown position'}\n`;
      });
    }

    // Add meeting documents information
    if (context.meeting_documents && context.meeting_documents.length > 0) {
      contextPrompt += '\nMeeting Documents:\n';
      context.meeting_documents.slice(0, 5).forEach((doc: any) => {
        contextPrompt += `- ${doc.description || doc.documentType || 'Document'}\n`;
      });
    }

    // Add document content if available
    if (context.document_content) {
      // Limit document content to prevent token overflow
      const truncatedContent = context.document_content.substring(0, 3000);
      contextPrompt += `\nDocument Content Preview:\n${truncatedContent}\n`;
    }

    const prompt = `You are an expert congressional analyst. Analyze the hearing information and generate a structured JSON summary that helps congressional staff and the public understand what this hearing is about and why it matters. Be specific and factual based on the available information. If information is limited, provide analysis based on the committee, title, and any available context.

${contextPrompt}

Provide a JSON response with these exact fields:
{
  "summary": "A concise 2-3 sentence summary",
  "purpose": "The main purpose or goal",
  "key_topics": ["topic1", "topic2", "topic3"],
  "potential_outcomes": ["outcome1", "outcome2"],
  "stakeholders": ["stakeholder1", "stakeholder2"],
  "importance_level": "low|medium|high|critical",
  "witnesses": [],
  "related_legislation": []
}`;

    // Use GPT-5 Responses API format
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5', // Use GPT-5 for best performance
        input: prompt,
        reasoning: {
          effort: 'medium' // Medium reasoning for balanced analysis
        },
        text: {
          verbosity: 'low' // Low verbosity for structured data
        }
      })
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Unable to read error response');
      console.error(`OpenAI API error ${response.status}: ${errorBody}`);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiResponse = await response.json();

    // Handle GPT-5 Responses API format
    let jsonContent: string = '';

    if (typeof aiResponse === 'string') {
      jsonContent = aiResponse;
    } else if (aiResponse?.output && Array.isArray(aiResponse.output)) {
      // GPT-5 Responses API format - look for output_text in array
      const textOutput = aiResponse.output.find((item: any) =>
        item.type === 'message' && item.content?.[0]?.type === 'output_text'
      );
      jsonContent = textOutput?.content?.[0]?.text || '';
    } else if (aiResponse?.output_text) {
      jsonContent = aiResponse.output_text;
    } else if (aiResponse?.text) {
      jsonContent = aiResponse.text;
    } else if (aiResponse?.content) {
      jsonContent = aiResponse.content;
    }

    if (jsonContent) {
      try {
        // Extract JSON from the response (it might be wrapped in markdown or text)
        const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return HearingSummarySchema.parse(parsed);
        }
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        return null;
      }
    }

    return null;
  } catch (error) {
    console.error('Error generating hearing summary:', error);
    return null;
  }
}

// Helper function to fetch document content from Congress.gov
export async function fetchDocumentContent(documentUrl: string, apiKey: string): Promise<string | null> {
  try {
    // Add API key to URL
    const urlWithKey = documentUrl.includes('?')
      ? `${documentUrl}&api_key=${apiKey}`
      : `${documentUrl}?api_key=${apiKey}`;

    const response = await fetch(urlWithKey);
    if (!response.ok) {
      console.error(`Failed to fetch document: ${response.status}`);
      return null;
    }

    // Check content type - if it's PDF, we can't process it directly
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('pdf')) {
      console.log('Document is PDF format - skipping content extraction');
      return null;
    }

    // Try to parse as JSON
    try {
      const data = await response.json();

      // Extract text content from various possible fields
      let content = '';
      if (data.text) {
        content = data.text;
      } else if (data.description) {
        content = data.description;
      } else if (data.summary) {
        content = data.summary;
      } else if (data.content) {
        content = data.content;
      }

      return content || null;
    } catch (jsonError) {
      // If not JSON, try to get as text
      const text = await response.text();
      // Only return if it looks like text content (not HTML or PDF)
      if (text && !text.startsWith('%PDF') && !text.startsWith('<!DOCTYPE')) {
        return text.substring(0, 3000); // Limit to 3000 chars
      }
      return null;
    }
  } catch (error) {
    console.error('Error fetching document content:', error);
    return null;
  }
}

