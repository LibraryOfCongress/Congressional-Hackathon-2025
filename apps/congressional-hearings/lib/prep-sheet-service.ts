import { z } from 'zod';
import { Client } from 'pg';

// Define comprehensive prep sheet structure
const PrepSheetSchema = z.object({
  executive_summary: z.string().describe('A comprehensive 3-4 paragraph executive summary of the hearing, its importance, and expected outcomes'),

  background_context: z.string().describe('Detailed background and historical context leading to this hearing'),

  key_issues: z.object({
    primary_issues: z.array(z.object({
      issue: z.string(),
      description: z.string(),
      significance: z.string(),
      current_status: z.string()
    })).describe('3-5 primary issues to be addressed'),

    secondary_issues: z.array(z.object({
      issue: z.string(),
      brief_description: z.string()
    })).optional().describe('Additional secondary issues')
  }),

  witness_analysis: z.object({
    witnesses: z.array(z.object({
      name: z.string(),
      title: z.string(),
      organization: z.string(),
      expected_position: z.string(),
      key_points: z.array(z.string()),
      potential_questions: z.array(z.string())
    })).describe('Detailed analysis of each witness'),

    witness_dynamics: z.string().describe('Analysis of potential dynamics between witnesses')
  }),

  policy_implications: z.object({
    immediate_impacts: z.array(z.string()),
    long_term_consequences: z.array(z.string()),
    regulatory_changes: z.array(z.string()).optional(),
    budgetary_impacts: z.string().optional()
  }),

  legislative_context: z.object({
    related_bills: z.array(z.object({
      bill_number: z.string(),
      title: z.string(),
      status: z.string(),
      relevance: z.string()
    })),
    legislative_history: z.array(z.string()),
    upcoming_votes: z.array(z.string()).optional()
  }),

  stakeholder_positions: z.array(z.object({
    group: z.string(),
    position: z.string(),
    key_concerns: z.array(z.string()),
    influence_level: z.enum(['low', 'medium', 'high'])
  })).describe('Positions of key stakeholder groups'),

  member_priorities: z.array(z.object({
    member: z.string(),
    party: z.string(),
    known_positions: z.array(z.string()),
    likely_questions: z.array(z.string()),
    political_considerations: z.string()
  })).describe('Key committee member priorities and likely questions'),

  talking_points: z.object({
    opening_points: z.array(z.string()),
    supporting_arguments: z.array(z.string()),
    counterarguments: z.array(z.object({
      opposition_point: z.string(),
      response: z.string()
    })),
    closing_points: z.array(z.string())
  }),

  controversy_analysis: z.object({
    contentious_issues: z.array(z.object({
      issue: z.string(),
      opposing_views: z.array(z.string()),
      potential_flashpoints: z.array(z.string())
    })),
    media_attention_level: z.enum(['low', 'medium', 'high', 'very_high']),
    public_interest_factors: z.array(z.string())
  }),

  data_points: z.array(z.object({
    metric: z.string(),
    value: z.string(),
    source: z.string(),
    relevance: z.string()
  })).describe('Key statistics and data points relevant to the hearing'),

  recommended_preparation: z.object({
    must_review_documents: z.array(z.string()),
    suggested_reading: z.array(z.string()),
    expert_contacts: z.array(z.object({
      name: z.string(),
      expertise: z.string(),
      contact_reason: z.string()
    })).optional()
  }),

  strategic_considerations: z.object({
    opportunities: z.array(z.string()),
    risks: z.array(z.string()),
    messaging_strategy: z.string(),
    follow_up_actions: z.array(z.string())
  })
});

export type PrepSheet = z.infer<typeof PrepSheetSchema>;

interface HearingContext {
  id: number;
  event_id: string;
  title: string;
  committee_name: string;
  chamber: string;
  event_date: string;
  meeting_type?: string;
  related_bills?: any[];
  related_nominations?: any[];
  meeting_documents?: any[];
  location_building?: string;
  location_room?: string;
  ai_summary?: string;
  ai_key_topics?: any;
}

interface GAOReport {
  gao_id: string;
  title: string;
  markdown_content: string;
  author?: string;
  creation_date?: string;
}

export class PrepSheetGenerator {
  private dbClient: Client;

  constructor() {
    this.dbClient = new Client({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_DATABASE,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });
  }

  async connect() {
    await this.dbClient.connect();
  }

  async disconnect() {
    await this.dbClient.end();
  }

  async generatePrepSheet(hearingId: number): Promise<PrepSheet | null> {
    try {
      // Fetch hearing details
      const hearing = await this.fetchHearing(hearingId);
      if (!hearing) {
        throw new Error(`Hearing with ID ${hearingId} not found`);
      }
      console.log('Fetched hearing:', { id: hearing.id, event_id: hearing.event_id, title: hearing.title });

      // Fetch relevant GAO reports
      const gaoReports = await this.fetchRelevantGAOReports(hearing);
      console.log(`Fetched ${gaoReports.length} GAO reports`);

      // Build comprehensive context
      const context = this.buildContext(hearing, gaoReports);

      // Generate prep sheet using OpenAI
      console.log('Generating prep sheet with OpenAI...');
      const prepSheet = await this.generateWithOpenAI(context);

      if (prepSheet) {
        console.log('Prep sheet generated successfully, saving to database...');
        // Save to database
        await this.savePrepSheet(hearing, prepSheet, gaoReports);
        console.log('Prep sheet saved successfully');
      } else {
        console.log('No prep sheet generated from OpenAI');
      }

      return prepSheet;
    } catch (error) {
      console.error('Error generating prep sheet:', error);
      throw error;
    }
  }

  private async fetchHearing(hearingId: number): Promise<HearingContext | null> {
    const query = `
      SELECT * FROM upcoming_committee_hearings
      WHERE id = $1
    `;

    const result = await this.dbClient.query(query, [hearingId]);
    return result.rows[0] || null;
  }

  private async fetchRelevantGAOReports(hearing: HearingContext): Promise<GAOReport[]> {
    // Search for relevant GAO reports based on hearing title and committee
    const searchTerms = this.extractSearchTerms(hearing);

    const query = `
      SELECT gao_id, title, markdown_content, author, creation_date
      FROM gao_reports
      WHERE
        to_tsvector('english', title || ' ' || COALESCE(markdown_content, ''))
        @@ plainto_tsquery('english', $1)
      ORDER BY
        ts_rank(
          to_tsvector('english', title || ' ' || COALESCE(markdown_content, '')),
          plainto_tsquery('english', $1)
        ) DESC
      LIMIT 5
    `;

    try {
      const result = await this.dbClient.query(query, [searchTerms]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching GAO reports:', error);
      // Return empty array if the search fails
      return [];
    }
  }

  private extractSearchTerms(hearing: HearingContext): string {
    // Extract key terms from hearing title and committee name
    const terms = [];

    // Add key words from title (remove common words)
    const titleWords = hearing.title
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3 && !['hearing', 'committee', 'the', 'and', 'for', 'with'].includes(word));

    terms.push(...titleWords.slice(0, 5));

    // Add committee focus area
    if (hearing.committee_name) {
      const committeeWords = hearing.committee_name
        .toLowerCase()
        .replace(/committee|subcommittee|on|the/gi, '')
        .trim()
        .split(/\s+/)
        .filter(word => word.length > 3);
      terms.push(...committeeWords.slice(0, 3));
    }

    return terms.join(' ');
  }

  private buildContext(hearing: HearingContext, gaoReports: GAOReport[]): string {
    let context = `# Congressional Hearing Preparation

## Hearing Details
- **Title**: ${hearing.title}
- **Committee**: ${hearing.committee_name}
- **Chamber**: ${hearing.chamber}
- **Date**: ${new Date(hearing.event_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
- **Type**: ${hearing.meeting_type || 'Not specified'}
- **Location**: ${hearing.location_room ? `Room ${hearing.location_room}, ` : ''}${hearing.location_building || 'TBD'}

`;

    // Add existing AI summary if available
    if (hearing.ai_summary) {
      context += `## Initial Analysis\n${hearing.ai_summary}\n\n`;
    }

    // Add related bills
    if (hearing.related_bills && hearing.related_bills.length > 0) {
      context += '## Related Legislation\n';
      hearing.related_bills.forEach((bill: any) => {
        context += `- **${bill.billNumber || 'Bill'}**: ${bill.title || 'No title'}\n`;
      });
      context += '\n';
    }

    // Add related nominations
    if (hearing.related_nominations && hearing.related_nominations.length > 0) {
      context += '## Related Nominations\n';
      hearing.related_nominations.forEach((nom: any) => {
        context += `- ${nom.name || 'Nominee'} for ${nom.position || 'position'}\n`;
      });
      context += '\n';
    }

    // Add GAO report summaries
    if (gaoReports.length > 0) {
      context += '## Relevant GAO Reports\n';
      gaoReports.forEach((report, index) => {
        context += `\n### GAO Report ${index + 1}: ${report.title}\n`;
        context += `- **Report ID**: ${report.gao_id}\n`;
        if (report.author) context += `- **Author**: ${report.author}\n`;
        if (report.creation_date) context += `- **Date**: ${report.creation_date}\n`;

        // Add excerpt from content (first 500 characters)
        if (report.markdown_content) {
          const excerpt = report.markdown_content.substring(0, 500);
          context += `\n**Excerpt**: ${excerpt}...\n`;
        }
      });
      context += '\n';
    }

    // Add meeting documents
    if (hearing.meeting_documents && hearing.meeting_documents.length > 0) {
      context += '## Meeting Documents\n';
      hearing.meeting_documents.slice(0, 5).forEach((doc: any) => {
        context += `- ${doc.description || doc.documentType || 'Document'}\n`;
      });
      context += '\n';
    }

    return context;
  }

  private async generateWithOpenAI(context: string): Promise<PrepSheet | null> {
    const prompt = `<role_definition>
You are an expert congressional staff member with 20+ years of experience preparing comprehensive briefing materials for upcoming hearings. You specialize in political intelligence, policy analysis, and strategic communications for congressional committees.
</role_definition>

<task_context>
Create a detailed, actionable prep sheet that helps committee members and staff fully understand the issues, anticipate questions, and prepare effective strategies.
</task_context>

<quality_standards>
Be specific and detailed in your analysis. Include:
- Actual names of committee members when analyzing their priorities
- Specific policy implications and legislative connections
- Concrete talking points and questions
- Strategic considerations based on current political dynamics

Base your analysis on the provided context, but also draw on your knowledge of:
- Congressional procedures and protocols
- Current political landscape and party positions
- Historical precedents and similar hearings
- Stakeholder interests and lobbying positions
</quality_standards>

<hearing_information>
${context}
</hearing_information>

<output_specifications>
Generate a comprehensive prep sheet in JSON format with ALL of the following fields (provide empty arrays if no data):

{
  "executive_summary": "3-4 paragraph comprehensive executive summary",
  "background_context": "Detailed background and historical context",
  "key_issues": {
    "primary_issues": [
      {
        "issue": "Issue name",
        "description": "Detailed description",
        "significance": "Why this matters",
        "current_status": "Current state of this issue"
      }
    ],
    "secondary_issues": [
      {
        "issue": "Issue name",
        "brief_description": "Brief description"
      }
    ]
  },
  "witness_analysis": {
    "witnesses": [
      {
        "name": "Witness name",
        "title": "Their title",
        "organization": "Their organization",
        "expected_position": "What position they'll likely take",
        "key_points": ["Point 1", "Point 2"],
        "potential_questions": ["Question 1", "Question 2"]
      }
    ],
    "witness_dynamics": "Analysis of dynamics between witnesses"
  },
  "policy_implications": {
    "immediate_impacts": ["Impact 1", "Impact 2"],
    "long_term_consequences": ["Consequence 1", "Consequence 2"],
    "regulatory_changes": ["Change 1"],
    "budgetary_impacts": "Budget impact description"
  },
  "legislative_context": {
    "related_bills": [
      {
        "bill_number": "H.R. XXX",
        "title": "Bill title",
        "status": "Current status",
        "relevance": "How it relates"
      }
    ],
    "legislative_history": ["Historical point 1", "Historical point 2"],
    "upcoming_votes": ["Vote 1"]
  },
  "stakeholder_positions": [
    {
      "group": "Stakeholder group",
      "position": "Their position",
      "key_concerns": ["Concern 1", "Concern 2"],
      "influence_level": "high"
    }
  ],
  "member_priorities": [
    {
      "member": "Member name",
      "party": "D or R",
      "known_positions": ["Position 1"],
      "likely_questions": ["Question 1"],
      "political_considerations": "Political context"
    }
  ],
  "talking_points": {
    "opening_points": ["Point 1", "Point 2"],
    "supporting_arguments": ["Argument 1", "Argument 2"],
    "counterarguments": [
      {
        "opposition_point": "What opposition says",
        "response": "How to respond"
      }
    ],
    "closing_points": ["Point 1", "Point 2"]
  },
  "controversy_analysis": {
    "contentious_issues": [
      {
        "issue": "Issue name",
        "opposing_views": ["View 1", "View 2"],
        "potential_flashpoints": ["Flashpoint 1"]
      }
    ],
    "media_attention_level": "high",
    "public_interest_factors": ["Factor 1", "Factor 2"]
  },
  "data_points": [
    {
      "metric": "Metric name",
      "value": "Value",
      "source": "Source",
      "relevance": "Why it matters"
    }
  ],
  "recommended_preparation": {
    "must_review_documents": ["Document 1", "Document 2"],
    "suggested_reading": ["Reading 1", "Reading 2"],
    "expert_contacts": [
      {
        "name": "Expert name",
        "expertise": "Their expertise",
        "contact_reason": "Why to contact them"
      }
    ]
  },
  "strategic_considerations": {
    "opportunities": ["Opportunity 1", "Opportunity 2"],
    "risks": ["Risk 1", "Risk 2"],
    "messaging_strategy": "Overall messaging approach",
    "follow_up_actions": ["Action 1", "Action 2"]
  }
}
</output_specifications>`;

    try {
      // Use GPT-5 Responses API format
      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-5', // Use GPT-5 for comprehensive analysis
          input: prompt,
          reasoning: {
            effort: 'high' // High reasoning effort for complex analysis
          },
          text: {
            verbosity: 'high' // High verbosity for detailed prep sheets
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
          // Extract JSON from the response (it might be wrapped in text)
          const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return PrepSheetSchema.parse(parsed);
          }
        } catch (parseError) {
          console.error('Error parsing prep sheet response:', parseError);
          return null;
        }
      }

      return null;
    } catch (error) {
      console.error('Error generating prep sheet with OpenAI:', error);
      return null;
    }
  }

  private prepSheetToJsonSchema(): any {
    // Simplified JSON schema for OpenAI
    // In production, you might want to use a library for this conversion
    return {
      type: 'object',
      properties: {
        executive_summary: { type: 'string' },
        background_context: { type: 'string' },
        key_issues: {
          type: 'object',
          properties: {
            primary_issues: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  issue: { type: 'string' },
                  description: { type: 'string' },
                  significance: { type: 'string' },
                  current_status: { type: 'string' }
                },
                required: ['issue', 'description', 'significance', 'current_status']
              }
            },
            secondary_issues: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  issue: { type: 'string' },
                  brief_description: { type: 'string' }
                },
                required: ['issue', 'brief_description']
              }
            }
          },
          required: ['primary_issues']
        },
        witness_analysis: {
          type: 'object',
          properties: {
            witnesses: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  title: { type: 'string' },
                  organization: { type: 'string' },
                  expected_position: { type: 'string' },
                  key_points: { type: 'array', items: { type: 'string' } },
                  potential_questions: { type: 'array', items: { type: 'string' } }
                },
                required: ['name', 'title', 'organization', 'expected_position', 'key_points', 'potential_questions']
              }
            },
            witness_dynamics: { type: 'string' }
          },
          required: ['witnesses', 'witness_dynamics']
        },
        policy_implications: {
          type: 'object',
          properties: {
            immediate_impacts: { type: 'array', items: { type: 'string' } },
            long_term_consequences: { type: 'array', items: { type: 'string' } },
            regulatory_changes: { type: 'array', items: { type: 'string' } },
            budgetary_impacts: { type: 'string' }
          },
          required: ['immediate_impacts', 'long_term_consequences']
        },
        legislative_context: {
          type: 'object',
          properties: {
            related_bills: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  bill_number: { type: 'string' },
                  title: { type: 'string' },
                  status: { type: 'string' },
                  relevance: { type: 'string' }
                },
                required: ['bill_number', 'title', 'status', 'relevance']
              }
            },
            legislative_history: { type: 'array', items: { type: 'string' } },
            upcoming_votes: { type: 'array', items: { type: 'string' } }
          },
          required: ['related_bills', 'legislative_history']
        },
        stakeholder_positions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              group: { type: 'string' },
              position: { type: 'string' },
              key_concerns: { type: 'array', items: { type: 'string' } },
              influence_level: { type: 'string', enum: ['low', 'medium', 'high'] }
            },
            required: ['group', 'position', 'key_concerns', 'influence_level']
          }
        },
        member_priorities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              member: { type: 'string' },
              party: { type: 'string' },
              known_positions: { type: 'array', items: { type: 'string' } },
              likely_questions: { type: 'array', items: { type: 'string' } },
              political_considerations: { type: 'string' }
            },
            required: ['member', 'party', 'known_positions', 'likely_questions', 'political_considerations']
          }
        },
        talking_points: {
          type: 'object',
          properties: {
            opening_points: { type: 'array', items: { type: 'string' } },
            supporting_arguments: { type: 'array', items: { type: 'string' } },
            counterarguments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  opposition_point: { type: 'string' },
                  response: { type: 'string' }
                },
                required: ['opposition_point', 'response']
              }
            },
            closing_points: { type: 'array', items: { type: 'string' } }
          },
          required: ['opening_points', 'supporting_arguments', 'counterarguments', 'closing_points']
        },
        controversy_analysis: {
          type: 'object',
          properties: {
            contentious_issues: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  issue: { type: 'string' },
                  opposing_views: { type: 'array', items: { type: 'string' } },
                  potential_flashpoints: { type: 'array', items: { type: 'string' } }
                },
                required: ['issue', 'opposing_views', 'potential_flashpoints']
              }
            },
            media_attention_level: { type: 'string', enum: ['low', 'medium', 'high', 'very_high'] },
            public_interest_factors: { type: 'array', items: { type: 'string' } }
          },
          required: ['contentious_issues', 'media_attention_level', 'public_interest_factors']
        },
        data_points: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              value: { type: 'string' },
              source: { type: 'string' },
              relevance: { type: 'string' }
            },
            required: ['metric', 'value', 'source', 'relevance']
          }
        },
        recommended_preparation: {
          type: 'object',
          properties: {
            must_review_documents: { type: 'array', items: { type: 'string' } },
            suggested_reading: { type: 'array', items: { type: 'string' } },
            expert_contacts: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  expertise: { type: 'string' },
                  contact_reason: { type: 'string' }
                },
                required: ['name', 'expertise', 'contact_reason']
              }
            }
          },
          required: ['must_review_documents', 'suggested_reading']
        },
        strategic_considerations: {
          type: 'object',
          properties: {
            opportunities: { type: 'array', items: { type: 'string' } },
            risks: { type: 'array', items: { type: 'string' } },
            messaging_strategy: { type: 'string' },
            follow_up_actions: { type: 'array', items: { type: 'string' } }
          },
          required: ['opportunities', 'risks', 'messaging_strategy', 'follow_up_actions']
        }
      },
      required: [
        'executive_summary', 'background_context', 'key_issues', 'witness_analysis',
        'policy_implications', 'legislative_context', 'stakeholder_positions',
        'member_priorities', 'talking_points', 'controversy_analysis',
        'data_points', 'recommended_preparation', 'strategic_considerations'
      ]
    };
  }

  private async savePrepSheet(hearing: HearingContext, prepSheet: PrepSheet, gaoReports: GAOReport[]) {
    try {
      const query = `
        INSERT INTO prep_sheets (
          hearing_id, event_id, hearing_title, committee_name, hearing_date, chamber,
          executive_summary, background_context, key_issues,
          witness_testimonies, witness_backgrounds, anticipated_questions,
          policy_implications, legislative_history, stakeholder_positions,
          related_bills, gao_reports, member_priorities, talking_points,
          suggested_questions, controversy_points, data_visualizations,
          generation_model, confidence_score, is_published
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
          $18, $19, $20, $21, $22, $23, $24, $25
        )
        RETURNING id
      `;

      const values = [
        hearing.id,
        hearing.event_id,
        hearing.title,
        hearing.committee_name,
        hearing.event_date,
        hearing.chamber,
        prepSheet.executive_summary,
        prepSheet.background_context,
        JSON.stringify(prepSheet.key_issues),
        JSON.stringify(prepSheet.witness_analysis.witnesses),
        JSON.stringify(prepSheet.witness_analysis.witnesses.map(w => ({ name: w.name, title: w.title, organization: w.organization }))),
        JSON.stringify(prepSheet.witness_analysis.witnesses.flatMap(w => w.potential_questions)),
        JSON.stringify(prepSheet.policy_implications),
        JSON.stringify(prepSheet.legislative_context.legislative_history),
        JSON.stringify(prepSheet.stakeholder_positions),
        JSON.stringify(prepSheet.legislative_context.related_bills),
        JSON.stringify(gaoReports.map(r => ({ gao_id: r.gao_id, title: r.title }))),
        JSON.stringify(prepSheet.member_priorities),
        JSON.stringify(prepSheet.talking_points),
        JSON.stringify(prepSheet.member_priorities.flatMap(m => m.likely_questions)),
        JSON.stringify(prepSheet.controversy_analysis),
        JSON.stringify(prepSheet.data_points),
        'gpt-5',  // Updated to GPT-5
        0.85,
        true
      ];

      const result = await this.dbClient.query(query, values);
      console.log(`✓ Prep sheet saved with ID: ${result.rows[0].id}`);
      return result.rows[0].id;
    } catch (error) {
      console.error('Error saving prep sheet to database:', error);
      console.error('Query values:', {
        hearing_id: hearing.id,
        event_id: hearing.event_id,
        title: hearing.title,
        committee: hearing.committee_name,
        date: hearing.event_date
      });
      throw error;
    }
  }

  async getPrepSheet(eventId: string): Promise<any> {
    const query = `
      SELECT * FROM prep_sheets
      WHERE event_id = $1 AND is_published = true
      ORDER BY version DESC
      LIMIT 1
    `;

    const result = await this.dbClient.query(query, [eventId]);
    return result.rows[0] || null;
  }
}