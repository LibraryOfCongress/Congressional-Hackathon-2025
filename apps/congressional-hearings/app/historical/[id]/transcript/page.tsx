"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar, Users, FileText, ExternalLink, ArrowLeft, Download, Quote, LinkIcon, Info, AlertCircle } from "lucide-react"
import Link from "next/link"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { db, type CongressionalHearingMarkdown } from "@/lib/supabase"
import { LabeledTranscriptViewer } from "@/components/labeled-transcript-viewer"
import { TranscriptFilterPanel } from "@/components/transcript-filter-panel"

// This will be populated from the database
const mockTranscriptData = {
  citations: [], // Placeholder for future citation extraction
}

export default function TranscriptView({ params }: { params: { id: string } }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCitation, setSelectedCitation] = useState<number | null>(null)
  const [hearing, setHearing] = useState<CongressionalHearingMarkdown | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAllSpeakers, setShowAllSpeakers] = useState(true)
  const [selectedSpeaker, setSelectedSpeaker] = useState<string | null>(null)

  // Load hearing data from database
  useEffect(() => {
    async function loadHearing() {
      try {
        setLoading(true)
        setError(null)
        const hearingData = await db.getMarkdownHearingById(parseInt(params.id))
        setHearing(hearingData)
      } catch (err) {
        console.error('Error loading hearing:', err)
        setError(err instanceof Error ? err.message : 'Failed to load hearing')
      } finally {
        setLoading(false)
      }
    }
    loadHearing()
  }, [params.id])

  const highlightSearchTerm = (text: string, term: string) => {
    if (!term) return text
    const regex = new RegExp(`(${term})`, "gi")
    return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>')
  }

  // Helper function to detect if content is markdown
  const isMarkdownContent = (content: string) => {
    if (!content) return false
    
    // Check for common markdown patterns
    const markdownPatterns = [
      /^#+\s/, // Headers (# ## ###)
      /\*\*.*\*\*/, // Bold text
      /^\*\s/, // Unordered lists
      /^\d+\.\s/, // Ordered lists
      /^\>\s/, // Blockquotes
      /```/, // Code blocks
      /\[.*\]\(.*\)/, // Links
      /^\|.*\|/, // Tables
      /^---+$/, // Horizontal rules
    ]
    
    // Split into lines and check for markdown patterns
    const lines = content.split('\n').slice(0, 20) // Check first 20 lines
    let markdownScore = 0
    
    for (const line of lines) {
      for (const pattern of markdownPatterns) {
        if (pattern.test(line.trim())) {
          markdownScore++
          break
        }
      }
    }
    
    // If more than 20% of lines have markdown patterns, consider it markdown
    return markdownScore > lines.length * 0.2
  }

  // Parse labeled transcript into segments
  const segments = useMemo(() => {
    if (!hearing?.markdown_content || hearing.content_source !== 'labeled_transcript') return []

    const lines = hearing.markdown_content.split('\n')
    const parsed: any[] = []

    for (const line of lines) {
      const match = line.match(/\[(\d{2}:\d{2}:\d{2}) - (\d{2}:\d{2}:\d{2})\] ([^(]+) \(([^)]+)\): (.*)/)
      if (match) {
        parsed.push({
          timestamp: `${match[1]} - ${match[2]}`,
          speaker: match[3].trim(),
          role: match[4].trim(),
          text: match[5].trim()
        })
      }
    }
    return parsed
  }, [hearing?.markdown_content, hearing?.content_source])

  const handleSpeakerFilterChange = (showAll: boolean, speaker: string | null) => {
    setShowAllSpeakers(showAll)
    setSelectedSpeaker(speaker)
  }

  const filteredCitations = mockTranscriptData.citations.filter(
    (citation: any) =>
      citation.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      citation.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
      citation.speaker.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/historical">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Historical Hearings
            </Link>
          </Button>
          <div>
            <Skeleton className="h-8 w-96 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-96 w-full" />
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/historical">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Historical Hearings
            </Link>
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error loading hearing: {error}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!hearing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/historical">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Historical Hearings
            </Link>
          </Button>
        </div>
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Hearing not found. It may not have been converted to markdown yet.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/historical">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Historical Hearings
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-balance">{hearing.title}</h1>
          <p className="text-muted-foreground mt-2">Transcript and Citation Analysis</p>
        </div>
      </div>

      {/* Data source info */}

      {/* Header Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{hearing.committee || "Committee information not available"}</CardTitle>
              <CardDescription className="mt-2">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(hearing.date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {hearing.word_count?.toLocaleString() || 0} words
                  </div>

                </div>
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
              <Button variant="outline" size="sm">
                <LinkIcon className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Filter Panel */}
        <div className="lg:col-span-1">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Transcript Filters</CardTitle>
              <CardDescription>Search and filter the hearing transcript</CardDescription>
            </CardHeader>
            <CardContent>
              {hearing?.content_source === 'labeled_transcript' ? (
                <TranscriptFilterPanel
                  segments={segments}
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  showAllSpeakers={showAllSpeakers}
                  selectedSpeaker={selectedSpeaker}
                  onSpeakerFilterChange={handleSpeakerFilterChange}
                />
              ) : (
                <div className="space-y-4">
                  <Input
                    placeholder="Search transcript..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                  <div className="p-3 border rounded-lg border-dashed">
                    <div className="text-center space-y-2">
                      <FileText className="h-8 w-8 text-muted-foreground mx-auto" />
                      <p className="text-sm text-muted-foreground">
                        Advanced filtering available for labeled transcripts
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Transcript */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Full Transcript
              </CardTitle>
              <div className="flex items-center gap-4">
                <Badge variant="outline">{hearing.word_count?.toLocaleString() || 0} words</Badge>
                <Badge variant="outline">Source: {hearing.content_source}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {hearing.content_source === 'labeled_transcript' ? (
                // Labeled transcript with speaker parsing
                <ScrollArea className="h-[600px]">
                  <LabeledTranscriptViewer
                    content={hearing.markdown_content || ""}
                    searchTerm={searchTerm}
                    showAllSpeakers={showAllSpeakers}
                    selectedSpeaker={selectedSpeaker}
                  />
                </ScrollArea>
              ) : isMarkdownContent(hearing.markdown_content || "") ? (
                // Markdown content (from PDFs, govinfo, etc.)
                <ScrollArea className="h-[600px]">
                  <div className="prose prose-sm max-w-none markdown-content">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        // Custom styling for markdown elements
                        h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 text-primary border-b border-border pb-2">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-xl font-semibold mb-3 mt-6 text-primary">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-lg font-medium mb-2 mt-4">{children}</h3>,
                        p: ({ children }) => <p className="mb-3 leading-relaxed">{children}</p>,
                        strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                        ul: ({ children }) => <ul className="list-disc ml-6 mb-3 space-y-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal ml-6 mb-3 space-y-1">{children}</ol>,
                        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-primary/30 pl-4 italic my-4 text-muted-foreground bg-muted/30 py-2">
                            {children}
                          </blockquote>
                        ),
                        code: ({ children }) => (
                          <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono">{children}</code>
                        ),
                        pre: ({ children }) => (
                          <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono mb-4">
                            {children}
                          </pre>
                        ),
                        table: ({ children }) => (
                          <table className="w-full border-collapse border border-border mb-4">
                            {children}
                          </table>
                        ),
                        th: ({ children }) => (
                          <th className="border border-border bg-muted px-3 py-2 text-left font-medium">
                            {children}
                          </th>
                        ),
                        td: ({ children }) => (
                          <td className="border border-border px-3 py-2">
                            {children}
                          </td>
                        ),
                      }}
                    >
                      {hearing.markdown_content || "No transcript content available"}
                    </ReactMarkdown>
                  </div>
                </ScrollArea>
              ) : (
                // Plain text content
                <ScrollArea className="h-96">
                  <div
                    className="prose prose-sm max-w-none whitespace-pre-line font-mono text-sm"
                    dangerouslySetInnerHTML={{
                      __html: highlightSearchTerm(hearing.markdown_content || "No transcript content available", searchTerm),
                    }}
                  />
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
