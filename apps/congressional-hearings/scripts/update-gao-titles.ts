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

/**
 * Extract proper title from GAO markdown file
 */
function extractTitleFromMarkdown(filePath: string): string | null {
  try {
    const content = readFileSync(filePath, 'utf-8')
    
    // Look for the Title in Document Metadata section
    const titleMatch = content.match(/- \*\*Title\*\*:\s*(.+)/i)
    
    if (titleMatch && titleMatch[1]) {
      let title = titleMatch[1].trim()
      
      // Clean up the title - remove GAO ID from the beginning if it exists
      title = title.replace(/^GAO-[\w-]+,?\s*/, '').trim()
      
      return title
    }
    
    // Fallback: look for main heading after metadata
    const headingMatch = content.match(/^#\s+(.+)$/m)
    if (headingMatch && headingMatch[1] && headingMatch[1] !== 'Document Metadata') {
      return headingMatch[1].trim()
    }
    
    return null
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error)
    return null
  }
}

/**
 * Update titles for all GAO reports
 */
async function updateGAOTitles() {
  console.log('📝 GAO Reports Title Updater')
  console.log('='.repeat(40))
  
  try {
    // Get all GAO reports from database
    console.log('\n📄 Fetching GAO reports from database...')
    const { data: reports, error: fetchError } = await supabase
      .from('gao_reports')
      .select('id, gao_id, title')
      .order('gao_id')
    
    if (fetchError) {
      throw new Error(`Failed to fetch reports: ${fetchError.message}`)
    }
    
    if (!reports || reports.length === 0) {
      console.log('❌ No GAO reports found in database')
      console.log('💡 Run "pnpm import-gao-reports" first to import the reports')
      return
    }
    
    console.log(`✅ Found ${reports.length} reports in database`)
    
    const gaoReportsDir = join(process.cwd(), '../../gao_reports')
    let updated = 0
    let skipped = 0
    let failed = 0
    
    for (let i = 0; i < reports.length; i++) {
      const report = reports[i]
      const progress = `[${i + 1}/${reports.length}]`
      
      console.log(`\n${progress} Processing: ${report.gao_id}`)
      console.log(`   Current title: "${report.title}"`)
      
      // Find the corresponding markdown file
      const possibleFilenames = [
        `${report.gao_id}.md`,
        `${report.gao_id.toUpperCase()}.md`,
        `${report.gao_id.replace('gao-', 'GAO-')}.md`
      ]
      
      let filePath: string | null = null
      for (const filename of possibleFilenames) {
        const testPath = join(gaoReportsDir, filename)
        try {
          readFileSync(testPath, 'utf-8')
          filePath = testPath
          break
        } catch {
          // File doesn't exist, try next
        }
      }
      
      if (!filePath) {
        console.log(`   ⚠️  Markdown file not found for ${report.gao_id}`)
        skipped++
        continue
      }
      
      // Extract the proper title
      const newTitle = extractTitleFromMarkdown(filePath)
      
      if (!newTitle) {
        console.log(`   ⚠️  Could not extract title from markdown`)
        skipped++
        continue
      }
      
      // Check if title needs updating
      if (report.title === newTitle) {
        console.log(`   ✓ Title already correct`)
        skipped++
        continue
      }
      
      console.log(`   📝 New title: "${newTitle}"`)
      
      // Update the title in database
      const { error: updateError } = await supabase
        .from('gao_reports')
        .update({ title: newTitle })
        .eq('id', report.id)
      
      if (updateError) {
        console.log(`   ❌ Failed to update: ${updateError.message}`)
        failed++
        continue
      }
      
      console.log(`   ✅ Title updated successfully`)
      updated++
    }
    
    // Summary
    console.log('\n' + '='.repeat(40))
    console.log('🎉 Title Update Complete!')
    console.log(`   ✅ Updated: ${updated}`)
    console.log(`   ⚠️  Skipped (no change needed): ${skipped}`)
    console.log(`   ❌ Failed: ${failed}`)
    console.log(`   📊 Total processed: ${reports.length}`)
    
    if (updated > 0) {
      console.log(`\n🗃️  ${updated} titles updated in gao_reports table!`)
    }
    
  } catch (error) {
    console.error('❌ Update failed:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

/**
 * Preview titles without updating
 */
async function previewTitles() {
  console.log('👀 GAO Reports Title Preview')
  console.log('='.repeat(40))
  
  try {
    const gaoReportsDir = join(process.cwd(), '../../gao_reports')
    const files = readdirSync(gaoReportsDir).filter(file => file.endsWith('.md'))
    
    console.log(`\n📄 Found ${files.length} markdown files`)
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const progress = `[${i + 1}/${files.length}]`
      
      console.log(`\n${progress} ${file}`)
      
      const filePath = join(gaoReportsDir, file)
      const title = extractTitleFromMarkdown(filePath)
      
      if (title) {
        console.log(`   📝 Title: "${title}"`)
      } else {
        console.log(`   ⚠️  Could not extract title`)
      }
    }
    
  } catch (error) {
    console.error('❌ Preview failed:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

// Main execution
async function main() {
  const command = process.argv[2]
  
  if (command === 'preview') {
    await previewTitles()
  } else {
    await updateGAOTitles()
  }
}

if (require.main === module) {
  main().catch(console.error)
}

export { updateGAOTitles, extractTitleFromMarkdown }
