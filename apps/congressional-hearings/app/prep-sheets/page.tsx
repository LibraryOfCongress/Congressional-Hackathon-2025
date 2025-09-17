"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Plus, Search, Calendar, Users, Clock, Edit, Eye, Sparkles, Building, AlertTriangle, RefreshCw, FileCheck } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface PrepSheet {
  id: number
  event_id: string
  hearing_title: string
  committee_name: string
  chamber: string
  hearing_date: string
  executive_summary: string
  generated_at: string
  view_count: number
  confidence_score: number
  version: number
  location_building?: string
  location_room?: string
  meeting_status?: string
}

interface Hearing {
  id: number
  event_id: string
  title: string
  committee_name: string
  chamber: string
  event_date: string
  has_prep_sheet?: boolean
}

// Mock data for prep sheets (fallback)
const mockPrepSheets = [
  {
    id: 1,
    title: "AI Regulation Oversight - Prep Sheet",
    hearingTitle: "Oversight of Federal AI Regulation",
    committee: "House Science, Space, and Technology",
    date: "2024-01-15",
    status: "in-progress",
    lastModified: "2024-01-10",
    assignedTo: "Sarah Johnson",
    completionPercentage: 75,
    sections: {
      completed: 6,
      total: 8,
    },
    relatedDocs: 12,
    priority: "high",
  },
  {
    id: 2,
    title: "Banking Cybersecurity - Prep Sheet",
    hearingTitle: "Banking Sector Cybersecurity Measures",
    committee: "Senate Banking, Housing, and Urban Affairs",
    date: "2024-01-18",
    status: "completed",
    lastModified: "2024-01-08",
    assignedTo: "Michael Chen",
    completionPercentage: 100,
    sections: {
      completed: 7,
      total: 7,
    },
    relatedDocs: 8,
    priority: "medium",
  },
  {
    id: 3,
    title: "Climate Agriculture Impact - Prep Sheet",
    hearingTitle: "Climate Change Impact on Agriculture",
    committee: "House Agriculture",
    date: "2024-01-22",
    status: "not-started",
    lastModified: "2024-01-05",
    assignedTo: "Lisa Rodriguez",
    completionPercentage: 0,
    sections: {
      completed: 0,
      total: 9,
    },
    relatedDocs: 15,
    priority: "high",
  },
  {
    id: 4,
    title: "Healthcare Data Privacy - Prep Sheet",
    hearingTitle: "Healthcare Data Privacy Standards",
    committee: "Senate HELP Committee",
    date: "2024-01-25",
    status: "in-progress",
    lastModified: "2024-01-09",
    assignedTo: "David Park",
    completionPercentage: 45,
    sections: {
      completed: 3,
      total: 6,
    },
    relatedDocs: 6,
    priority: "medium",
  },
]

export default function PrepSheets() {
  const { toast } = useToast()
  const [prepSheets, setPrepSheets] = useState<PrepSheet[]>([])
  const [hearings, setHearings] = useState<Hearing[]>([])
  const [loading, setLoading] = useState(true)
  const [generatingFor, setGeneratingFor] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedChamber, setSelectedChamber] = useState("all")
  const [viewMode, setViewMode] = useState<"prep-sheets" | "hearings">("prep-sheets")

  useEffect(() => {
    fetchPrepSheets()
    fetchUpcomingHearings()
  }, [])

  const fetchPrepSheets = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/prep-sheets')
      const data = await response.json()
      setPrepSheets(data.prepSheets || [])
    } catch (error) {
      console.error('Error fetching prep sheets:', error)
      toast({
        title: "Error",
        description: "Failed to load prep sheets",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchUpcomingHearings = async () => {
    try {
      const response = await fetch('/api/hearings?limit=20')
      const data = await response.json()

      // Check which hearings have prep sheets
      const hearingsWithStatus = await Promise.all(
        data.hearings.map(async (hearing: any) => {
          const prepResponse = await fetch(`/api/prep-sheets?event_id=${hearing.event_id}`)
          const hasPrepSheet = prepResponse.ok
          return { ...hearing, has_prep_sheet: hasPrepSheet }
        })
      )

      setHearings(hearingsWithStatus)
    } catch (error) {
      console.error('Error fetching hearings:', error)
    }
  }

  const generatePrepSheet = async (hearingId: number, eventId: string) => {
    setGeneratingFor(eventId)

    toast({
      title: "Generating Prep Sheet",
      description: "This may take 30-60 seconds...",
    })

    try {
      const response = await fetch('/api/prep-sheets/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hearingId, eventId })
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Success",
          description: "Prep sheet generated successfully!",
        })

        // Refresh the lists
        await fetchPrepSheets()
        await fetchUpcomingHearings()
      } else {
        throw new Error('Failed to generate prep sheet')
      }
    } catch (error) {
      console.error('Error generating prep sheet:', error)
      toast({
        title: "Error",
        description: "Failed to generate prep sheet. Please try again.",
        variant: "destructive"
      })
    } finally {
      setGeneratingFor(null)
    }
  }

  const filteredPrepSheets = prepSheets.filter((sheet) => {
    const matchesSearch =
      sheet.hearing_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sheet.committee_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesChamber = selectedChamber === "all" || sheet.chamber?.toLowerCase() === selectedChamber.toLowerCase()

    return matchesSearch && matchesChamber
  })

  const filteredHearings = hearings.filter((hearing) => {
    const matchesSearch =
      hearing.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hearing.committee_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesChamber = selectedChamber === "all" || hearing.chamber?.toLowerCase() === selectedChamber.toLowerCase()

    return matchesSearch && matchesChamber
  })

  const getChamberColor = (chamber: string) => {
    switch (chamber?.toLowerCase()) {
      case "house":
        return "bg-green-100 text-green-800 border-green-200"
      case "senate":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return "bg-green-100 text-green-800"
    if (score >= 0.6) return "bg-yellow-100 text-yellow-800"
    return "bg-orange-100 text-orange-800"
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Date TBD"
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Hearing Prep Sheets</h1>
          <p className="text-muted-foreground mt-2">AI-generated comprehensive briefing documents for congressional hearings</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { fetchPrepSheets(); fetchUpcomingHearings(); }}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button asChild>
            <Link href="/upcoming">
              <Calendar className="mr-2 h-4 w-4" />
              View Hearings
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <Input
                placeholder="Search prep sheets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Chamber</label>
              <Select value={selectedChamber} onValueChange={setSelectedChamber}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Chambers</SelectItem>
                  <SelectItem value="house">House</SelectItem>
                  <SelectItem value="senate">Senate</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">View Mode</label>
              <Select value={viewMode} onValueChange={(v) => setViewMode(v as "prep-sheets" | "hearings")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prep-sheets">Generated Prep Sheets</SelectItem>
                  <SelectItem value="hearings">Upcoming Hearings</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setSelectedChamber("all")
                  setViewMode("prep-sheets")
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="text-center py-8">
            <RefreshCw className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-medium mb-2">Loading prep sheets...</h3>
            <p className="text-muted-foreground">Fetching your briefing documents</p>
          </CardContent>
        </Card>
      )}

      {/* Prep Sheets Grid */}
      {!loading && viewMode === "prep-sheets" && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPrepSheets.map((sheet) => (
            <Card key={sheet.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg text-balance line-clamp-2">
                      {sheet.hearing_title}
                    </CardTitle>
                    <CardDescription className="text-sm">{sheet.committee_name}</CardDescription>
                  </div>

                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {sheet.executive_summary && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <p className="text-sm text-blue-800 dark:text-blue-200 line-clamp-3">
                        {sheet.executive_summary}
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(sheet.hearing_date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span>{sheet.location_room || "TBD"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span>{sheet.view_count || 0} views</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(sheet.generated_at)}</span>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <Link href={`/prep-sheets/${sheet.event_id}`}>
                        <Eye className="mr-1 h-3 w-3" />
                        View Full Prep
                      </Link>
                    </Button>
                    <Button size="sm" asChild className="flex-1">
                      <Link href={`/upcoming`}>
                        <FileText className="mr-1 h-3 w-3" />
                        Hearing Details
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Hearings Without Prep Sheets */}
      {!loading && viewMode === "hearings" && (
        <div className="grid gap-4">
          {filteredHearings.map((hearing) => (
            <Card key={hearing.event_id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{hearing.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {hearing.committee_name} • {formatDate(hearing.event_date)}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getChamberColor(hearing.chamber)}>{hearing.chamber}</Badge>
                    {hearing.has_prep_sheet ? (
                      <Badge className="bg-green-100 text-green-800">
                        <FileCheck className="mr-1 h-3 w-3" />
                        Prep Ready
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        No Prep
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  {hearing.has_prep_sheet ? (
                    <Button size="sm" asChild className="flex-1">
                      <Link href={`/prep-sheets/${hearing.event_id}`}>
                        <Eye className="mr-1 h-3 w-3" />
                        View Prep Sheet
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => generatePrepSheet(hearing.id, hearing.event_id)}
                      disabled={generatingFor === hearing.event_id}
                    >
                      {generatingFor === hearing.event_id ? (
                        <>
                          <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-1 h-3 w-3" />
                          Generate Prep Sheet
                        </>
                      )}
                    </Button>
                  )}
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <Link href={`/upcoming`}>
                      <Calendar className="mr-1 h-3 w-3" />
                      View Details
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && viewMode === "prep-sheets" && filteredPrepSheets.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No prep sheets found</h3>
            <p className="text-muted-foreground mb-4">Switch to "Upcoming Hearings" view to generate prep sheets for hearings.</p>
            <Button onClick={() => setViewMode("hearings")}>
              View Upcoming Hearings
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
