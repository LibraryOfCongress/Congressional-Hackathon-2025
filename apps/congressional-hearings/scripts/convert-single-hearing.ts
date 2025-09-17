#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { join } from 'path'
import axios from 'axios'
import * as cheerio from 'cheerio'
import pdf from 'pdf-parse'

// Load environment variables from scripts/.env.local
config({ path: join(__dirname, '.env.local') })

// You'll need to provide your actual environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL_HERE'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY_HERE'

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('YOUR_') || supabaseKey.includes('YOUR_')) {
  console.error('❌ Please set your Supabase environment variables:')
  console.error('NEXT_PUBLIC_SUPABASE_URL=your_actual_url')
  console.error('SUPABASE_SERVICE_ROLE_KEY=your_actual_service_key')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Define the structure of your congressional_hearings table
interface CongressionalHearing {
  id: number
  title: string
  committee?: string
  date?: string // Keep for backward compatibility
  hearing_date?: string // Primary date field
  transcript_status?: string
  witnesses?: string[]
  pages?: number
  citations?: number
  related_docs?: number
  topics?: string[]
  summary?: string
  content?: string // The main hearing content/transcript
  govinfo_url?: string // URL to government info page
  pdf_url?: string // URL to PDF document
  created_at?: string
  updated_at?: string
}

// Define the structure for the new markdown table
interface CongressionalHearingMarkdown {
  id?: number
  original_hearing_id: number
  title: string
  committee?: string
  date: string
  markdown_content: string
  word_count: number
  content_source: string // 'govinfo', 'pdf', 'database', or 'none'
  created_at?: string
}

/**
 * Fetch content from a govinfo URL
 */
async function fetchGovinfoContent(url: string): Promise<string | null> {
  try {
    console.log(`   🌐 Fetching content from govinfo URL...`)
    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Congressional-Hearings-Bot/1.0)'
      }
    })
    
    const $ = cheerio.load(response.data)
    
    // Try different selectors for govinfo content
    let content = ''
    
    // Look for main content areas
    const selectors = [
      '.document-content',
      '#content',
      '.main-content',
      'main',
      '.body-content',
      'article'
    ]
    
    for (const selector of selectors) {
      const element = $(selector)
      if (element.length > 0) {
        content = element.text().trim()
        if (content.length > 100) break // Found substantial content
      }
    }
    
    // If no structured content found, get all text
    if (!content || content.length < 100) {
      content = $('body').text().trim()
    }
    
    // Clean up the content
    content = content
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim()
    
    console.log(`   ✅ Fetched ${content.length} characters from govinfo`)
    return content.length > 50 ? content : null
    
  } catch (error) {
    console.log(`   ⚠️  Failed to fetch govinfo content: ${error instanceof Error ? error.message : error}`)
    return null
  }
}

/**
 * Fetch and parse content from a PDF URL
 */
async function fetchPdfContent(url: string): Promise<string | null> {
  try {
    console.log(`   📄 Fetching and parsing PDF content...`)
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 60000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Congressional-Hearings-Bot/1.0)'
      }
    })
    
    const pdfBuffer = Buffer.from(response.data)
    const pdfData = await pdf(pdfBuffer)
    
    let content = pdfData.text.trim()
    
    // Clean up PDF text
    content = content
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim()
    
    console.log(`   ✅ Parsed ${content.length} characters from PDF (${pdfData.numpages} pages)`)
    return content.length > 50 ? content : null
    
  } catch (error) {
    console.log(`   ⚠️  Failed to fetch PDF content: ${error instanceof Error ? error.message : error}`)
    return null
  }
}

/**
 * Fetch hearing content from available sources
 */
async function fetchHearingContent(hearing: CongressionalHearing): Promise<{ content: string, source: string }> {
  console.log('\n📥 Fetching hearing content...')
  
  // Try govinfo URL first
  if (hearing.govinfo_url) {
    console.log(`   🔗 Trying govinfo URL: ${hearing.govinfo_url}`)
    const govinfoContent = await fetchGovinfoContent(hearing.govinfo_url)
    if (govinfoContent) {
      return { content: govinfoContent, source: 'govinfo' }
    }
  }
  
  // Try PDF URL second
  if (hearing.pdf_url) {
    console.log(`   🔗 Trying PDF URL: ${hearing.pdf_url}`)
    const pdfContent = await fetchPdfContent(hearing.pdf_url)
    if (pdfContent) {
      return { content: pdfContent, source: 'pdf' }
    }
  }
  
  // Fall back to database content
  if (hearing.content && hearing.content.trim().length > 50) {
    console.log(`   💾 Using database content (${hearing.content.length} characters)`)
    return { content: hearing.content, source: 'database' }
  }
  
  console.log(`   ⚠️  No substantial content found from any source`)
  return { 
    content: hearing.summary || 'No content available for this hearing.', 
    source: 'none' 
  }
}

/**
 * Convert hearing content to markdown format
 */
function convertToMarkdown(hearing: CongressionalHearing, fetchedContent?: string, contentSource?: string): string {
  let markdown = `# ${hearing.title}\n\n`
  
  if (hearing.committee) {
    markdown += `**Committee:** ${hearing.committee}\n\n`
  }
  
  // Use hearing_date if available, fallback to date field
  const hearingDate = hearing.hearing_date || hearing.date
  const dateDisplay = hearingDate ? new Date(hearingDate).toLocaleDateString() : 'Date not available'
  markdown += `**Date:** ${dateDisplay}\n\n`
  
  if (hearing.transcript_status) {
    markdown += `**Status:** ${hearing.transcript_status}\n\n`
  }
  
  if (hearing.witnesses && hearing.witnesses.length > 0) {
    markdown += `**Witnesses:**\n`
    hearing.witnesses.forEach(witness => {
      // Handle both string and object witnesses
      const witnessName = typeof witness === 'string' ? witness : 
                          (witness as any)?.name || (witness as any)?.full_name || 
                          JSON.stringify(witness)
      markdown += `- ${witnessName}\n`
    })
    markdown += '\n'
  }
  
  if (hearing.topics && hearing.topics.length > 0) {
    markdown += `**Topics:** ${hearing.topics.join(', ')}\n\n`
  }
  
  if (hearing.summary) {
    markdown += `## Summary\n\n${hearing.summary}\n\n`
  }
  
  // Add content source info
  if (contentSource) {
    markdown += `**Content Source:** ${contentSource}\n\n`
  }
  
  // Add the fetched content or fallback to database content
  const contentToUse = fetchedContent || hearing.content
  if (contentToUse && contentToUse.trim().length > 0) {
    markdown += `## Full Content\n\n${contentToUse}\n\n`
  }
  
  if (hearing.pages) {
    markdown += `---\n\n**Pages:** ${hearing.pages}`
  }
  
  if (hearing.citations) {
    markdown += ` | **Citations:** ${hearing.citations}`
  }
  
  if (hearing.related_docs) {
    markdown += ` | **Related Documents:** ${hearing.related_docs}`
  }
  
  return markdown
}

/**
 * Create the congressional_hearings_markdown table if it doesn't exist
 */
async function createMarkdownTable() {
  console.log('📊 Creating congressional_hearings_markdown table...')
  
  const { error } = await supabase.rpc('exec', {
    sql: `
      CREATE TABLE IF NOT EXISTS congressional_hearings_markdown (
        id SERIAL PRIMARY KEY,
        original_hearing_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        committee TEXT,
        date DATE NOT NULL,
        markdown_content TEXT NOT NULL,
        word_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (original_hearing_id) REFERENCES congressional_hearings(id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_markdown_hearings_original_id 
        ON congressional_hearings_markdown(original_hearing_id);
      CREATE INDEX IF NOT EXISTS idx_markdown_hearings_date 
        ON congressional_hearings_markdown(date);
    `
  })
  
  if (error) {
    console.log('⚠️  Could not create table via RPC, trying direct approach...')
    // If RPC doesn't work, we'll create it manually in Supabase dashboard
    return false
  }
  
  console.log('✅ Table created successfully')
  return true
}

/**
 * Validate and clean hearing data
 */
function validateHearingData(hearing: CongressionalHearing): CongressionalHearing {
  // Handle missing or invalid date - prefer hearing_date over date
  let validDate = hearing.hearing_date || hearing.date
  if (!validDate || validDate === 'undefined' || validDate === 'null') {
    console.log('⚠️  Missing hearing date, using current date as fallback')
    validDate = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
  }
  
  // Ensure title exists
  const validTitle = hearing.title || `Untitled Hearing ${hearing.id}`
  
  return {
    ...hearing,
    title: validTitle,
    hearing_date: validDate,
    date: validDate // Keep both for compatibility
  }
}

/**
 * Convert a single hearing to markdown and insert it
 */
async function convertSingleHearing(hearingId?: number) {
  console.log('🏛️ Congressional Hearing to Markdown Converter')
  console.log('=============================================\n')
  
  try {
    // Get the first hearing if no ID specified
    let hearing: CongressionalHearing
    
    if (hearingId) {
      console.log(`📄 Fetching hearing with ID: ${hearingId}`)
      const { data, error } = await supabase
        .from('congressional_hearings')
        .select('*')
        .eq('id', hearingId)
        .single()
      
      if (error) throw new Error(`Failed to fetch hearing: ${error.message}`)
      hearing = data
    } else {
      console.log('📄 Fetching the first available hearing...')
      const { data, error } = await supabase
        .from('congressional_hearings')
        .select('*')
        .limit(1)
        .single()
      
      if (error) throw new Error(`Failed to fetch hearing: ${error.message}`)
      hearing = data
    }
    
    // Validate and clean the data
    hearing = validateHearingData(hearing)
    
    console.log(`✅ Found hearing: "${hearing.title}"`)
    console.log(`   Committee: ${hearing.committee || 'N/A'}`)
    console.log(`   Date: ${hearing.hearing_date || hearing.date || 'N/A'}`)
    console.log(`   ID: ${hearing.id}`)
    
    // Check if already converted
    const { data: existing } = await supabase
      .from('congressional_hearings_markdown')
      .select('id')
      .eq('original_hearing_id', hearing.id)
      .single()
    
    if (existing) {
      console.log(`⚠️  Hearing ${hearing.id} already converted (markdown ID: ${existing.id})`)
      return
    }
    
    // Fetch actual content from URLs
    const { content: fetchedContent, source: contentSource } = await fetchHearingContent(hearing)
    
    // Convert to markdown
    console.log('\n🔄 Converting to markdown...')
    const markdown = convertToMarkdown(hearing, fetchedContent, contentSource)
    const wordCount = markdown.split(/\s+/).length
    
    console.log(`   📊 Generated ${wordCount} words`)
    console.log(`   📏 Content size: ${(markdown.length / 1024).toFixed(1)}KB`)
    console.log(`   📄 Content source: ${contentSource}`)
    
    // Prepare data for insertion - use hearing_date if available
    const dateToUse = hearing.hearing_date || hearing.date || new Date().toISOString().split('T')[0]
    const insertData = {
      original_hearing_id: hearing.id,
      title: hearing.title,
      committee: hearing.committee || null,
      date: dateToUse,
      markdown_content: markdown,
      word_count: wordCount,
      content_source: contentSource
    }
    
    console.log('\n🔍 Data validation:')
    console.log(`   ✓ Original ID: ${insertData.original_hearing_id}`)
    console.log(`   ✓ Title: "${insertData.title}"`)
    console.log(`   ✓ Date: ${insertData.date}`)
    console.log(`   ✓ Committee: ${insertData.committee || 'None'}`)
    
    // Insert into markdown table
    console.log('\n💾 Saving to congressional_hearings_markdown table...')
    const { data: inserted, error: insertError } = await supabase
      .from('congressional_hearings_markdown')
      .insert([insertData])
      .select()
      .single()
    
    if (insertError) {
      console.error('❌ Insert error details:', insertError)
      throw new Error(`Failed to insert markdown: ${insertError.message}`)
    }
    
    console.log(`✅ Successfully converted and saved!`)
    console.log(`   📝 New markdown record ID: ${inserted.id}`)
    console.log(`   🔗 Original hearing ID: ${hearing.id}`)
    
    // Show preview
    console.log('\n📖 Markdown Preview (first 300 characters):')
    console.log('─'.repeat(50))
    console.log(markdown.substring(0, 300) + (markdown.length > 300 ? '...' : ''))
    console.log('─'.repeat(50))
    
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error)
    
    // Show more debugging info
    if (error instanceof Error && error.message.includes('violates not-null constraint')) {
      console.error('\n🔍 Debugging info:')
      console.error('This error occurs when required fields are missing or null.')
      console.error('Check that your congressional_hearings table has valid data.')
    }
    
    process.exit(1)
  }
}

// Main execution
async function main() {
  // Get hearing ID from command line argument
  const hearingId = process.argv[2] ? parseInt(process.argv[2]) : undefined
  
  if (hearingId && isNaN(hearingId)) {
    console.error('❌ Invalid hearing ID. Please provide a number.')
    process.exit(1)
  }
  
  // Try to create table (optional)
  await createMarkdownTable()
  
  // Convert the hearing
  await convertSingleHearing(hearingId)
  
  console.log('\n🎉 Conversion completed!')
  console.log('\nTo convert a specific hearing, run:')
  console.log('pnpm convert-single-hearing 123')
}

if (require.main === module) {
  main().catch(console.error)
}

export { convertSingleHearing, convertToMarkdown }
