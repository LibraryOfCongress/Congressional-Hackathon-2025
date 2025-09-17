import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
// Try anon key first, fallback to service role key for development
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and either:')
  console.error('- NEXT_PUBLIC_SUPABASE_ANON_KEY (for production)')
  console.error('- SUPABASE_SERVICE_ROLE_KEY (for development)')
  throw new Error('Missing Supabase environment variables')
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseKey)

// Types for your congressional hearings data
export interface CongressionalHearing {
  id: number
  title: string
  committee: string
  date: string
  transcript_status: string
  witnesses: string[]
  pages?: number
  citations?: number
  related_docs?: number
  topics: string[]
  summary: string
  created_at?: string
  updated_at?: string
}

// Types for congressional hearings markdown data
export interface CongressionalHearingMarkdown {
  id: number
  original_hearing_id: number
  title: string
  committee?: string
  date: string
  markdown_content: string
  word_count: number
  content_source: string
  created_at?: string
  updated_at?: string
}

// Helper functions for database operations
export const db = {
  // Get all hearings
  async getAllHearings() {
    const { data, error } = await supabase
      .from('congressional_hearings')
      .select('*')
      .order('date', { ascending: false })
    
    if (error) throw error
    return data as CongressionalHearing[]
  },

  // Get hearing by ID
  async getHearingById(id: number) {
    const { data, error } = await supabase
      .from('congressional_hearings')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data as CongressionalHearing
  },

  // Search hearings by title or committee
  async searchHearings(query: string) {
    const { data, error } = await supabase
      .from('congressional_hearings')
      .select('*')
      .or(`title.ilike.%${query}%,committee.ilike.%${query}%,summary.ilike.%${query}%`)
      .order('date', { ascending: false })
    
    if (error) throw error
    return data as CongressionalHearing[]
  },

  // Get hearings by committee
  async getHearingsByCommittee(committee: string) {
    const { data, error } = await supabase
      .from('congressional_hearings')
      .select('*')
      .eq('committee', committee)
      .order('date', { ascending: false })
    
    if (error) throw error
    return data as CongressionalHearing[]
  },

  // Get recent hearings (last 30 days)
  async getRecentHearings() {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { data, error } = await supabase
      .from('congressional_hearings')
      .select('*')
      .gte('date', thirtyDaysAgo.toISOString())
      .order('date', { ascending: false })
    
    if (error) throw error
    return data as CongressionalHearing[]
  },

  // Insert new hearing
  async insertHearing(hearing: Omit<CongressionalHearing, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('congressional_hearings')
      .insert([hearing])
      .select()
      .single()
    
    if (error) throw error
    return data as CongressionalHearing
  },

  // Update hearing
  async updateHearing(id: number, updates: Partial<CongressionalHearing>) {
    const { data, error } = await supabase
      .from('congressional_hearings')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as CongressionalHearing
  },

  // Markdown hearings functions
  // Get all markdown hearings
  async getAllMarkdownHearings() {
    const { data, error } = await supabase
      .from('congressional_hearings_markdown')
      .select('*')
      .order('date', { ascending: false })
    
    if (error) throw error
    return data as CongressionalHearingMarkdown[]
  },

  // Get markdown hearing by ID
  async getMarkdownHearingById(id: number) {
    const { data, error } = await supabase
      .from('congressional_hearings_markdown')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data as CongressionalHearingMarkdown
  },

  // Search markdown hearings
  async searchMarkdownHearings(query: string) {
    const { data, error } = await supabase
      .from('congressional_hearings_markdown')
      .select('*')
      .or(`title.ilike.%${query}%,committee.ilike.%${query}%`)
      .order('date', { ascending: false })
    
    if (error) throw error
    return data as CongressionalHearingMarkdown[]
  },

  // Get markdown hearings by committee
  async getMarkdownHearingsByCommittee(committee: string) {
    const { data, error } = await supabase
      .from('congressional_hearings_markdown')
      .select('*')
      .eq('committee', committee)
      .order('date', { ascending: false })
    
    if (error) throw error
    return data as CongressionalHearingMarkdown[]
  }
}

// Helper function to transform markdown hearing data for the historical page
export function transformMarkdownHearingForDisplay(hearing: CongressionalHearingMarkdown) {
  return {
    id: hearing.id,
    title: hearing.title,
    committee: hearing.committee || "Committee information not available",
    date: hearing.date,
    transcriptStatus: "available", // All markdown hearings have content
    witnesses: ["Witness information not yet extracted"], // Placeholder
    pages: Math.ceil(hearing.word_count / 250) || 1, // Estimate pages from word count
    citations: 0, // Placeholder - to be extracted later
    relatedDocs: 0, // Placeholder - to be extracted later  
    topics: ["Topics to be extracted from content"], // Placeholder
    summary: "Summary to be extracted from markdown content", // Placeholder
    // Additional fields from our table
    wordCount: hearing.word_count,
    contentSource: hearing.content_source,
    originalHearingId: hearing.original_hearing_id,
    markdownContent: hearing.markdown_content, // For transcript viewer
  }
}
