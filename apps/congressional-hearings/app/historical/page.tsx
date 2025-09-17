"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Archive, Calendar, FileText, Users, ExternalLink, Download, Search, Filter, Info } from "lucide-react"
import Link from "next/link"
import { db, transformMarkdownHearingForDisplay, type CongressionalHearingMarkdown } from "@/lib/supabase"

// This will be populated from the database
const historicalHearings: any[] = []

const committees = [
  "All Committees",
  "House Committee on Energy and Commerce",
  "Senate Committee on Banking, Housing, and Urban Affairs",
  "House Committee on Science, Space, and Technology",
  "Senate Committee on Health, Education, Labor and Pensions",
  "House Committee on Homeland Security",
]

const topics = [
  "All Topics",
  "AI",
  "Climate Change",
  "Cybersecurity",
  "Education",
  "Energy",
  "Healthcare",
  "Infrastructure",
  "Monetary Policy",
  "National Security",
  "Privacy",
  "Social Media",
]

export default function HistoricalHearings() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCommittee, setSelectedCommittee] = useState("All Committees")
  const [selectedTopic, setSelectedTopic] = useState("All Topics")
  const [dateRange, setDateRange] = useState("all")
  const [hearings, setHearings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load hearings from database
  useEffect(() => {
    async function loadHearings() {
      try {
        setLoading(true)
        setError(null)
        const markdownHearings = await db.getAllMarkdownHearings()
        const transformedHearings = markdownHearings.map(transformMarkdownHearingForDisplay)
        setHearings(transformedHearings)
      } catch (err) {
        console.error('Error loading hearings:', err)
        setError(err instanceof Error ? err.message : 'Failed to load hearings')
      } finally {
        setLoading(false)
      }
    }
    loadHearings()
  }, [])

  const filteredHearings = hearings.filter((hearing) => {
    const matchesSearch =
      hearing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hearing.committee.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hearing.witnesses.some((witness) => witness.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCommittee = selectedCommittee === "All Committees" || hearing.committee === selectedCommittee
    const matchesTopic = selectedTopic === "All Topics" || hearing.topics.some((topic) => topic === selectedTopic)

    let matchesDate = true
    if (dateRange !== "all") {
      const hearingDate = new Date(hearing.date)
      const now = new Date()
      const monthsAgo = Number.parseInt(dateRange)
      const cutoffDate = new Date(now.getFullYear(), now.getMonth() - monthsAgo, now.getDate())
      matchesDate = hearingDate >= cutoffDate
    }

    return matchesSearch && matchesCommittee && matchesTopic && matchesDate
  })

  const getTranscriptStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800 border-green-200"
      case "processing":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "unavailable":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Historical Hearings</h1>
          <p className="text-muted-foreground mt-2">Browse and analyze past committee hearings and transcripts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/search">
              <Search className="mr-2 h-4 w-4" />
              Advanced Search
            </Link>
          </Button>
        </div>
      </div>

      {/* Data source info */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Showing {hearings.length} hearings from your database. Some fields (witnesses, topics, detailed summaries) are placeholders and will be enhanced in future updates.
        </AlertDescription>
      </Alert>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            Error loading hearings: {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hearings</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : hearings.length}</div>
            <p className="text-xs text-muted-foreground">In database</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transcripts Available</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : hearings.length}</div>
            <p className="text-xs text-muted-foreground">100% coverage</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Words</CardTitle>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : hearings.reduce((sum, h) => sum + (h.wordCount || 0), 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Full content</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Content Sources</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : new Set(hearings.map(h => h.contentSource)).size}
            </div>
            <p className="text-xs text-muted-foreground">PDF, govinfo, etc.</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <Input
                placeholder="Search hearings, witnesses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Committee</label>
              <Select value={selectedCommittee} onValueChange={setSelectedCommittee}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {committees.map((committee) => (
                    <SelectItem key={committee} value={committee}>
                      {committee}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Topic</label>
              <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {topics.map((topic) => (
                    <SelectItem key={topic} value={topic}>
                      {topic}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="3">Last 3 months</SelectItem>
                  <SelectItem value="6">Last 6 months</SelectItem>
                  <SelectItem value="12">Last year</SelectItem>
                  <SelectItem value="24">Last 2 years</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setSelectedCommittee("All Committees")
                  setSelectedTopic("All Topics")
                  setDateRange("all")
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hearings List */}
      <div className="space-y-4">
        {loading ? (
          // Loading skeletons
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-18" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))
        ) : filteredHearings.map((hearing) => (
          <Card key={hearing.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-xl text-balance">{hearing.title}</CardTitle>
                  <CardDescription>{hearing.committee}</CardDescription>
                  <p className="text-sm text-muted-foreground">
                    {hearing.summary}
                    {hearing.summary === "Summary to be extracted from markdown content" && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Placeholder
                      </Badge>
                    )}
                  </p>
                </div>
                <Badge className={getTranscriptStatusColor(hearing.transcriptStatus)}>{hearing.transcriptStatus}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{new Date(hearing.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{hearing.pages} pages</span>
                </div>
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{hearing.citations} citations</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{hearing.witnesses.length} witnesses</span>
                </div>
              </div>

              {/* Topics */}
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {hearing.topics.map((topic, index) => (
                    <Badge key={index} variant="secondary">
                      {topic}
                      {topic === "Topics to be extracted from content" && (
                        <span className="ml-1 text-xs opacity-60">(placeholder)</span>
                      )}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Witnesses */}
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">Witnesses:</h4>
                <div className="flex flex-wrap gap-2">
                  {hearing.witnesses.map((witness, index) => (
                    <Badge key={index} variant="outline">
                      {witness}
                      {witness === "Witness information not yet extracted" && (
                        <span className="ml-1 text-xs opacity-60">(placeholder)</span>
                      )}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">{hearing.relatedDocs} related documents</div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="mr-1 h-3 w-3" />
                      Download
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/historical/${hearing.id}/documents`}>View Documents</Link>
                    </Button>
                    <Button size="sm" asChild>
                      <Link href={`/historical/${hearing.id}/transcript`}>
                        {hearing.transcriptStatus === "available" ? "View Transcript" : "Check Status"}
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!loading && filteredHearings.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No hearings found</h3>
            <p className="text-muted-foreground">Try adjusting your filters or search terms.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
