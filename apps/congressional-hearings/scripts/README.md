# Congressional Hearings Markdown Converter

Convert congressional hearings from your Supabase database to rich markdown format with full content from PDFs and government sources.

## 🚀 Quick Start

### 1. Set Up Environment Variables

Create `.env.local` in the `scripts` folder:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 2. Set Up Database Table

Run `setup-database.sql` in your Supabase SQL editor to create the `congressional_hearings_markdown` table.

### 3. Install Dependencies

```bash
cd apps/congressional-hearings
pnpm install
```

### 4. Run Conversion

```bash
# Congressional Hearings
pnpm convert-recent-hearings        # Convert 100 most recent hearings
pnpm convert-recent-hearings 50     # Convert specific number
pnpm convert-single-hearing 123     # Convert single hearing by ID
pnpm convert-single-hearing         # Convert first available hearing

# GAO Reports  
pnpm import-gao-reports             # Import all GAO reports from gao_reports folder
pnpm preview-gao-titles             # Preview titles that will be extracted
pnpm update-gao-titles              # Update titles for existing GAO reports
```

## 📁 Files Overview

| File | Purpose |
|------|---------|
| `setup-database.sql` | Creates the congressional_hearings_markdown table |
| `setup-gao-table.sql` | Creates the gao_reports table |
| `convert-recent-hearings.ts` | Batch converts multiple hearings |
| `convert-single-hearing.ts` | Converts one hearing at a time |
| `import-gao-reports.ts` | Imports GAO reports from markdown files |
| `update-gao-titles.ts` | Updates titles for GAO reports |
| `.env.local` | Your Supabase credentials (create this) |

## 🔄 How It Works

### Content Sources (Priority Order):
1. **🌐 govinfo.gov** - Official government website
2. **📄 PDF files** - Full document content  
3. **💾 Database** - Existing content field
4. **📝 Summary** - Fallback option

### Output Format:
```markdown
# Hearing Title

**Committee:** Committee Name
**Date:** MM/DD/YYYY
**Status:** available

**Witnesses:**
- Witness Name 1
- Witness Name 2

**Topics:** Topic1, Topic2

## Summary
Brief hearing summary...

**Content Source:** pdf

## Full Content
Complete hearing transcript with all testimony, Q&A, and discussions...

---
**Pages:** 150 | **Citations:** 25
```

## 📊 Example Usage

### Batch Convert Recent Hearings
```bash
pnpm convert-recent-hearings 10
```

**Output:**
```
🏛️ Congressional Hearings Batch Converter
Converting 10 most recent hearings by hearing_date
============================================================

📄 Fetching 10 most recent hearings...
✅ Found 10 hearings
   📅 Date range: 2025-06-01 to 2025-07-16

[1/10] "AI Regulation Oversight"
   📅 2025-07-16 | 🏛️ Committee on Science
      📄 Fetching PDF...
      ✅ PDF: 156,432 chars (89 pages)
   📊 24,156 words, 152.7KB, source: pdf
   ✅ Saved as markdown ID: 15

============================================================
🎉 Batch Conversion Complete!
   ✅ Successfully converted: 8
   ⚠️  Already converted (skipped): 2
   ❌ Failed: 0
```

### Single Hearing Convert
```bash
pnpm convert-single-hearing 161
```

**Output:**
```
🏛️ Congressional Hearing to Markdown Converter
=============================================

✅ Found hearing: "The CFTC at 50: Examining Commodity Markets"
   Committee: Committee on Agriculture
   Date: 2025-06-25
   ID: 161

📥 Fetching hearing content...
   🔗 Trying PDF URL: https://www.govinfo.gov/content/pkg/...
   📄 Fetching and parsing PDF content...
   ✅ Parsed 826,688 characters from PDF (214 pages)

🔄 Converting to markdown...
   📊 Generated 125,738 words
   📏 Content size: 807.7KB
   📄 Content source: pdf

✅ Successfully converted and saved!
   📝 New markdown record ID: 12
```

## 🛠️ Troubleshooting

### Common Issues:

**"Missing Supabase environment variables"**
- Create `.env.local` file in scripts folder with your credentials

**"Could not find the 'content_source' column"**
- Run `setup-database.sql` in your Supabase SQL editor

**"Failed to fetch hearing"** 
- Check that your `congressional_hearings` table exists and has data
- Verify your Supabase credentials are correct

**"PDF failed" or "Govinfo failed"**
- Normal behavior - script will try multiple sources
- Uses database content or summary as fallback

## 📈 Performance Notes

- **PDF Processing**: Large PDFs (100+ pages) may take 30-60 seconds
- **Rate Limiting**: 1-second delay between hearings to be respectful to external APIs
- **Memory Usage**: Large batches may use significant memory for PDF parsing
- **Timeouts**: 30s for web content, 60s for PDFs

## 🗃️ Database Schema

The script creates a `congressional_hearings_markdown` table with:

- `original_hearing_id` - Links to your original hearing
- `markdown_content` - Full converted content  
- `content_source` - Where content came from (govinfo/pdf/database/none)
- `word_count` - Total words in markdown
- `date` - Uses actual hearing_date (not today's date)

## 📝 Tips

- Start with small batches (10-20 hearings) to test
- Monitor your Supabase database size - full PDFs create large records
- Check the `content_source` column to see which source was used
- Use `LIMIT` in SQL queries when viewing large markdown content

---

**Ready to convert your hearings?** Run `pnpm convert-recent-hearings` to get started! 🚀
=======
# Pinecone Upsert Script

This script fetches chunks from the `congressional_hearings_markdown` table in Supabase and upserts them into Pinecone with embeddings.

## Prerequisites

1. Make sure you have all required environment variables set in `.env`:
   - `PINECONE_API_KEY` - Your Pinecone API key
   - `OPENAI_API_KEY` - Your OpenAI API key (for generating embeddings)
   - `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD` - Supabase database connection details

2. Ensure the `congressional_hearings_markdown` table exists in your Supabase database with the following structure:
   - `id` - Unique identifier for each chunk
   - `content` - The text content of the chunk
   - `hearing_id` - ID of the hearing this chunk belongs to
   - `chunk_index` - Index of this chunk within the hearing
   - `metadata` - Additional metadata (JSON)

## Usage

Run the script using npm:

```bash
npm run upsert-pinecone
```

Or directly with tsx:

```bash
npx tsx scripts/upsert-to-pinecone.ts
```

## What the script does

1. Connects to your Supabase PostgreSQL database
2. Fetches chunks from the `congressional_hearings_markdown` table in batches
3. Generates embeddings for each chunk using OpenAI's text-embedding-3-small model
4. Upserts the chunks with their embeddings into Pinecone
5. Includes rate limiting to avoid API limits

## Configuration

- **Batch size**: Default is 50 chunks per batch (can be modified in the `processAllChunks` method)
- **Pinecone index**: Uses the `congresshacks` index (can be modified in the constructor)
- **Embedding model**: Uses `text-embedding-3-small` (can be modified in the `generateEmbedding` method)

## Error handling

The script includes error handling for:
- Database connection issues
- Embedding generation failures
- Pinecone upsert failures

Failed chunks will be logged but won't stop the overall process.
