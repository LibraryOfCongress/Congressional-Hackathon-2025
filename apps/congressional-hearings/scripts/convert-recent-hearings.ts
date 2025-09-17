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
  hearing_date?: string // Changed from 'date' to 'hearing_date'
  transcript_status?: string
  witnesses?: string[]
  pages?: number
  citations?: number
  related_docs?: number
  topics?: string[]
  summary?: string
  content?: string
  govinfo_url?: string
  pdf_url?: string
  created_at?: string
  updated_at?: string
}

// Define the structure for the new markdown table
interface CongressionalHearingMarkdown {
  id?: number
  original_hearing_id: number
  title: string
  committee?: string
  date: string // Will use hearing_date
  markdown_content: string
  word_count: number
  content_source: string
  created_at?: string
}

/**
 * Fetch content from a govinfo URL
 */
async function fetchGovinfoContent(url: string): Promise<string | null> {
  try {
    console.log(`      🌐 Fetching from govinfo...`)
    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Congressional-Hearings-Bot/1.0)'
      }
    })
    
    const $ = cheerio.load(response.data)
    
    // Try different selectors for govinfo content
    let content = ''
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
        if (content.length > 100) break
      }
    }
    
    if (!content || content.length < 100) {
      content = $('body').text().trim()
    }
    
    content = content
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim()
    
    console.log(`      ✅ Govinfo: ${content.length} chars`)
    return content.length > 50 ? content : null
    
  } catch (error) {
    console.log(`      ⚠️  Govinfo failed: ${error instanceof Error ? error.message.substring(0, 50) : error}`)
    return null
  }
}

/**
 * Fetch and parse content from a PDF URL
 */
async function fetchPdfContent(url: string): Promise<string | null> {
  try {
    console.log(`      📄 Fetching PDF...`)
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
    content = content
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim()
    
    console.log(`      ✅ PDF: ${content.length} chars (${pdfData.numpages} pages)`)
    return content.length > 50 ? content : null
    
  } catch (error) {
    console.log(`      ⚠️  PDF failed: ${error instanceof Error ? error.message.substring(0, 50) : error}`)
    return null
  }
}

/**
 * Fetch hearing content from available sources
 */
async function fetchHearingContent(hearing: CongressionalHearing): Promise<{ content: string, source: string }> {
  // Try govinfo URL first
  if (hearing.govinfo_url) {
    const govinfoContent = await fetchGovinfoContent(hearing.govinfo_url)
    if (govinfoContent) {
      return { content: govinfoContent, source: 'govinfo' }
    }
  }
  
  // Try PDF URL second
  if (hearing.pdf_url) {
    const pdfContent = await fetchPdfContent(hearing.pdf_url)
    if (pdfContent) {
      return { content: pdfContent, source: 'pdf' }
    }
  }
  
  // Fall back to database content
  if (hearing.content && hearing.content.trim().length > 50) {
    console.log(`      💾 Using database content (${hearing.content.length} chars)`)
    return { content: hearing.content, source: 'database' }
  }
  
  console.log(`      📝 Using summary as fallback`)
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
  
  // Use hearing_date instead of current date
  const hearingDate = hearing.hearing_date ? new Date(hearing.hearing_date).toLocaleDateString() : 'Date not available'
  markdown += `**Date:** ${hearingDate}\n\n`
  
  if (hearing.transcript_status) {
    markdown += `**Status:** ${hearing.transcript_status}\n\n`
  }
  
  if (hearing.witnesses && hearing.witnesses.length > 0) {
    markdown += `**Witnesses:**\n`
    hearing.witnesses.forEach(witness => {
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
  
  if (contentSource) {
    markdown += `**Content Source:** ${contentSource}\n\n`
  }
  
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
 * Convert a single hearing to markdown
 */
async function convertSingleHearing(hearing: CongressionalHearing): Promise<{ success: boolean, error?: string }> {
  try {
    // Check if already converted
    const { data: existing } = await supabase
      .from('congressional_hearings_markdown')
      .select('id')
      .eq('original_hearing_id', hearing.id)
      .single()
    
    if (existing) {
      console.log(`   ⚠️  Already converted (ID: ${existing.id})`)
      return { success: false, error: 'already_converted' }
    }
    
    // Fetch actual content from URLs
    const { content: fetchedContent, source: contentSource } = await fetchHearingContent(hearing)
    
    // Convert to markdown
    const markdown = convertToMarkdown(hearing, fetchedContent, contentSource)
    const wordCount = markdown.split(/\s+/).length
    
    console.log(`   📊 ${wordCount} words, ${(markdown.length / 1024).toFixed(1)}KB, source: ${contentSource}`)
    
    // Use hearing_date or fallback to current date
    const dateToUse = hearing.hearing_date || new Date().toISOString().split('T')[0]
    
    // Prepare data for insertion
    const insertData = {
      original_hearing_id: hearing.id,
      title: hearing.title,
      committee: hearing.committee || null,
      date: dateToUse,
      markdown_content: markdown,
      word_count: wordCount,
      content_source: contentSource
    }
    
    // Insert into markdown table
    const { data: inserted, error: insertError } = await supabase
      .from('congressional_hearings_markdown')
      .insert([insertData])
      .select()
      .single()
    
    if (insertError) {
      throw new Error(`Insert failed: ${insertError.message}`)
    }
    
    console.log(`   ✅ Saved as markdown ID: ${inserted.id}`)
    return { success: true }
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.log(`   ❌ Failed: ${errorMsg}`)
    return { success: false, error: errorMsg }
  }
}

/**
 * Main batch conversion function
 */
async function convertRecentHearings(limit: number = 100) {
  console.log('🏛️ Congressional Hearings Batch Converter')
  console.log(`Converting ${limit} most recent hearings by hearing_date`)
  console.log('='.repeat(60))
  
  try {
    // Fetch the most recent hearings by hearing_date
    console.log(`\n📄 Fetching ${limit} most recent hearings...`)
    const { data: hearings, error } = await supabase
      .from('congressional_hearings')
      .select('*')
      .not('hearing_date', 'is', null) // Only hearings with dates
      .order('hearing_date', { ascending: false })
      .limit(limit)
    
    if (error) {
      throw new Error(`Failed to fetch hearings: ${error.message}`)
    }
    
    if (!hearings || hearings.length === 0) {
      console.log('❌ No hearings found')
      return
    }
    
    console.log(`✅ Found ${hearings.length} hearings`)
    console.log(`   📅 Date range: ${hearings[hearings.length - 1].hearing_date} to ${hearings[0].hearing_date}`)
    
    // Process each hearing
    let successful = 0
    let skipped = 0
    let failed = 0
    
    for (let i = 0; i < hearings.length; i++) {
      const hearing = hearings[i]
      const progress = `[${i + 1}/${hearings.length}]`
      
      console.log(`\n${progress} "${hearing.title}"`)
      console.log(`   📅 ${hearing.hearing_date} | 🏛️ ${hearing.committee || 'No committee'}`)
      
      const result = await convertSingleHearing(hearing)
      
      if (result.success) {
        successful++
      } else if (result.error === 'already_converted') {
        skipped++
      } else {
        failed++
      }
      
      // Add small delay to be respectful to external APIs
      if (i < hearings.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('🎉 Batch Conversion Complete!')
    console.log(`   ✅ Successfully converted: ${successful}`)
    console.log(`   ⚠️  Already converted (skipped): ${skipped}`)
    console.log(`   ❌ Failed: ${failed}`)
    console.log(`   📊 Total processed: ${hearings.length}`)
    
    if (successful > 0) {
      console.log(`\n🗃️  Check your congressional_hearings_markdown table for ${successful} new records!`)
    }
    
  } catch (error) {
    console.error('❌ Batch conversion failed:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

// Main execution
async function main() {
  // Get limit from command line argument (default 100)
  const limit = process.argv[2] ? parseInt(process.argv[2]) : 100
  
  if (isNaN(limit) || limit < 1 || limit > 1000) {
    console.error('❌ Invalid limit. Please provide a number between 1 and 1000.')
    console.error('Usage: pnpm convert-recent-hearings [limit]')
    console.error('Example: pnpm convert-recent-hearings 50')
    process.exit(1)
  }
  
  await convertRecentHearings(limit)
}

if (require.main === module) {
  main().catch(console.error)
}

export { convertRecentHearings }
