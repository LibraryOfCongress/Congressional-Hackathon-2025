#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { join } from 'path'
import { readFileSync, readdirSync } from 'fs'

// Load environment variables from scripts/.env.local
config({ path: join(__dirname, '.env.local') })

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL_HERE'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY_HERE'

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('YOUR_') || supabaseKey.includes('YOUR_')) {
  console.error('❌ Please set your Supabase environment variables:')
  console.error('NEXT_PUBLIC_SUPABASE_URL=your_actual_url')
  console.error('SUPABASE_SERVICE_ROLE_KEY=your_actual_service_key')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Define the structure for GAO reports
interface GAOReport {
  id?: number
  gao_id: string
  title: string
  processed_date?: string
  source_file?: string
  conversion_method?: string
  author?: string
  creation_date?: string
  modified_date?: string
  markdown_content: string
  word_count: number
  page_count: number
  content_source: string
  created_at?: string
  updated_at?: string
}

/**
 * Parse GAO markdown file and extract metadata
 */
function parseGAOMarkdown(filePath: string, filename: string): GAOReport {
  const content = readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')
  
  // Extract frontmatter metadata
  let inFrontmatter = false
  let frontmatterEnd = 0
  const metadata: any = {}
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    if (line === '---') {
      if (!inFrontmatter) {
        inFrontmatter = true
        continue
      } else {
        frontmatterEnd = i
        break
      }
    }
    
    if (inFrontmatter && line.includes(':')) {
      const [key, ...valueParts] = line.split(':')
      const value = valueParts.join(':').trim().replace(/"/g, '')
      metadata[key.trim()] = value
    }
  }
  
  // Get the main content (everything after frontmatter)
  const mainContent = lines.slice(frontmatterEnd + 1).join('\n').trim()
  
  // Extract title from Document Metadata section (preferred method)
  let title = metadata.title || filename.replace('.md', '')
  
  // Look for the Title in Document Metadata section
  const titleMatch = mainContent.match(/- \*\*Title\*\*:\s*(.+)/i)
  if (titleMatch && titleMatch[1]) {
    title = titleMatch[1].trim()
    // Clean up the title - remove GAO ID from the beginning if it exists
    title = title.replace(/^GAO-[\w-]+,?\s*/, '').trim()
  } else {
    // Fallback: look for main heading after metadata
    const headingMatch = mainContent.match(/^#\s+(.+)$/m)
    if (headingMatch && headingMatch[1] && headingMatch[1] !== 'Document Metadata') {
      title = headingMatch[1].trim()
    }
  }
  
  // Extract GAO ID from filename
  const gaoId = filename.replace('.md', '').toLowerCase()
  
  // Count pages (look for "## Page" markers)
  const pageMatches = mainContent.match(/^## Page \d+/gm)
  const pageCount = pageMatches ? pageMatches.length : 1
  
  // Count words
  const wordCount = mainContent.split(/\s+/).length
  
  // Parse dates
  let processedDate: string | undefined
  let creationDate: string | undefined
  let modifiedDate: string | undefined
  
  try {
    if (metadata.processed_date) {
      processedDate = new Date(metadata.processed_date).toISOString()
    }
    if (metadata.CreationDate) {
      // Parse PDF date format like "D:20250915153409-04'00'"
      const dateStr = metadata.CreationDate.replace(/D:|'|"/g, '').substring(0, 14)
      if (dateStr.length >= 8) {
        const year = dateStr.substring(0, 4)
        const month = dateStr.substring(4, 6)
        const day = dateStr.substring(6, 8)
        creationDate = new Date(`${year}-${month}-${day}`).toISOString()
      }
    }
    if (metadata.ModDate) {
      const dateStr = metadata.ModDate.replace(/D:|'|"/g, '').substring(0, 14)
      if (dateStr.length >= 8) {
        const year = dateStr.substring(0, 4)
        const month = dateStr.substring(4, 6)
        const day = dateStr.substring(6, 8)
        modifiedDate = new Date(`${year}-${month}-${day}`).toISOString()
      }
    }
  } catch (error) {
    console.log(`   ⚠️  Date parsing failed for ${filename}:`, error)
  }
  
  return {
    gao_id: gaoId,
    title: title,
    processed_date: processedDate,
    source_file: metadata.source_file,
    conversion_method: metadata.conversion_method || 'pdfplumber',
    author: 'U.S. Government Accountability Office',
    creation_date: creationDate,
    modified_date: modifiedDate,
    markdown_content: mainContent,
    word_count: wordCount,
    page_count: pageCount,
    content_source: 'pdf'
  }
}

/**
 * Import a single GAO report
 */
async function importSingleReport(filePath: string, filename: string): Promise<{ success: boolean, error?: string }> {
  try {
    // Parse the markdown file
    const report = parseGAOMarkdown(filePath, filename)
    
    // Check if already exists
    const { data: existing } = await supabase
      .from('gao_reports')
      .select('id')
      .eq('gao_id', report.gao_id)
      .single()
    
    if (existing) {
      console.log(`   ⚠️  Already exists (ID: ${existing.id})`)
      return { success: false, error: 'already_exists' }
    }
    
    // Insert into database
    const { data: inserted, error: insertError } = await supabase
      .from('gao_reports')
      .insert([report])
      .select()
      .single()
    
    if (insertError) {
      throw new Error(`Insert failed: ${insertError.message}`)
    }
    
    console.log(`   ✅ Imported as ID: ${inserted.id}`)
    console.log(`   📊 ${report.word_count} words, ${report.page_count} pages`)
    
    return { success: true }
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.log(`   ❌ Failed: ${errorMsg}`)
    return { success: false, error: errorMsg }
  }
}

/**
 * Main import function
 */
async function importGAOReports() {
  console.log('📊 GAO Reports Database Importer')
  console.log('='.repeat(40))
  
  try {
    const gaoReportsDir = join(process.cwd(), '../../gao_reports')
    
    // Get all markdown files
    const files = readdirSync(gaoReportsDir).filter(file => file.endsWith('.md'))
    
    if (files.length === 0) {
      console.log('❌ No .md files found in gao_reports directory')
      return
    }
    
    console.log(`\n📄 Found ${files.length} GAO report files`)
    
    let successful = 0
    let skipped = 0
    let failed = 0
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const progress = `[${i + 1}/${files.length}]`
      
      console.log(`\n${progress} Processing: ${file}`)
      
      const filePath = join(gaoReportsDir, file)
      const result = await importSingleReport(filePath, file)
      
      if (result.success) {
        successful++
      } else if (result.error === 'already_exists') {
        skipped++
      } else {
        failed++
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(40))
    console.log('🎉 Import Complete!')
    console.log(`   ✅ Successfully imported: ${successful}`)
    console.log(`   ⚠️  Already existed (skipped): ${skipped}`)
    console.log(`   ❌ Failed: ${failed}`)
    console.log(`   📊 Total processed: ${files.length}`)
    
    if (successful > 0) {
      console.log(`\n🗃️  Check your gao_reports table for ${successful} new records!`)
    }
    
  } catch (error) {
    console.error('❌ Import failed:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

// Main execution
async function main() {
  await importGAOReports()
}

if (require.main === module) {
  main().catch(console.error)
}

export { importGAOReports }
