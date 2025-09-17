"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  FileText, Calendar, Building, Users, Target, AlertCircle,
  ChevronRight, Sparkles, BookOpen, MessageCircle, TrendingUp,
  Shield, Gavel, Eye, Download, Share2, ArrowLeft, ExternalLink, Search
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface PrepSheet {
  id: number
  event_id: string
  hearing_title: string
  committee_name: string
  chamber: string
  hearing_date: string
  location_building?: string
  location_room?: string

  executive_summary: string
  background_context: string
  key_issues: any

  witness_testimonies: any[]
  witness_backgrounds: any[]
  anticipated_questions: any[]

  policy_implications: any
  legislative_history: any[]
  stakeholder_positions: any[]

  related_bills: any[]
  gao_reports: any[]

  member_priorities: any[]
  talking_points: any
  suggested_questions: any[]

  controversy_points: any
  data_visualizations: any[]

  generated_at: string
  view_count: number
  confidence_score: number
}

interface GAOReportResult {
  id: string;
  score: number;
  content: string;
  title: string;
  report_id: string;
  date: string;
  topics: string[];
  snippet: string;
}

export default function PrepSheetView() {
  const params = useParams()
  const { toast } = useToast()
  const [prepSheet, setPrepSheet] = useState<PrepSheet | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [gaoReports, setGaoReports] = useState<GAOReportResult[]>([])
  const [loadingGaoReports, setLoadingGaoReports] = useState(false)

  useEffect(() => {
    if (params.eventId) {
      fetchPrepSheet(params.eventId as string)
    }
  }, [params.eventId])

  useEffect(() => {
    if (prepSheet) {
      searchRelevantGAOReports()
    }
  }, [prepSheet])

  const fetchPrepSheet = async (eventId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/prep-sheets?event_id=${eventId}`)
      if (response.ok) {
        const data = await response.json()
        setPrepSheet(data.prepSheet)
      } else {
        throw new Error('Prep sheet not found')
      }
    } catch (error) {
      console.error('Error fetching prep sheet:', error)
      toast({
        title: "Error",
        description: "Failed to load prep sheet",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const searchRelevantGAOReports = async () => {
    if (!prepSheet) return

    setLoadingGaoReports(true)
    try {
      // Create search queries based on hearing content
      const searchQueries = [
        prepSheet.hearing_title,
        prepSheet.committee_name,
        prepSheet.executive_summary,
        prepSheet.background_context
      ].filter(Boolean)

      // Extract key terms from key issues
      if (prepSheet.key_issues?.primary_issues) {
        prepSheet.key_issues.primary_issues.forEach((issue: any) => {
          if (issue.issue) searchQueries.push(issue.issue)
          if (issue.description) searchQueries.push(issue.description)
        })
      }

      // Combine and search
      const combinedQuery = searchQueries.slice(0, 3).join(' ')
      
      const response = await fetch('/api/search-gao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: combinedQuery,
          limit: 5,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setGaoReports(data.results || [])
      }
    } catch (error) {
      console.error('Error searching GAO reports:', error)
    } finally {
      setLoadingGaoReports(false)
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Date TBD"
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <Card>
          <CardContent className="text-center py-12">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!prepSheet) {
    return (
      <div className="container mx-auto p-8">
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Prep sheet not found</h3>
            <Button asChild>
              <Link href="/prep-sheets">Back to Prep Sheets</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/prep-sheets">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Prep Sheets
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{prepSheet.hearing_title}</CardTitle>
                <CardDescription className="text-base">
                  {prepSheet.committee_name}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="mr-1 h-3 w-3" />
                  Export
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="mr-1 h-3 w-3" />
                  Share
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mt-4">
              <Badge variant="outline" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(prepSheet.hearing_date)}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Building className="h-3 w-3" />
                {prepSheet.location_room ? `Room ${prepSheet.location_room}, ` : ""}
                {prepSheet.location_building || "TBD"}
              </Badge>
              <Badge variant="secondary">{prepSheet.chamber}</Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {prepSheet.view_count} views
              </Badge>

            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="witnesses">Witnesses</TabsTrigger>
          <TabsTrigger value="policy">Policy</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="talking">Talking Points</TabsTrigger>
          <TabsTrigger value="gao-reports">GAO Reports</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Executive Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Executive Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base leading-relaxed">{prepSheet.executive_summary}</p>
            </CardContent>
          </Card>

          {/* Background Context */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Background & Context
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base leading-relaxed">{prepSheet.background_context}</p>
            </CardContent>
          </Card>

          {/* Key Issues */}
          {prepSheet.key_issues && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Key Issues
                </CardTitle>
              </CardHeader>
              <CardContent>
                {prepSheet.key_issues.primary_issues && (
                  <div className="space-y-4">
                    {prepSheet.key_issues.primary_issues.map((issue: any, idx: number) => (
                      <div key={idx} className="p-4 bg-secondary/50 rounded-lg">
                        <h4 className="font-semibold mb-2">{issue.issue}</h4>
                        <p className="text-sm mb-2">{issue.description}</p>
                        <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                          <div>
                            <span className="font-medium">Significance:</span>
                            <p className="text-muted-foreground">{issue.significance}</p>
                          </div>
                          <div>
                            <span className="font-medium">Current Status:</span>
                            <p className="text-muted-foreground">{issue.current_status}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}


          {/* Controversy Analysis */}
          {prepSheet.controversy_points && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  Controversy Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {prepSheet.controversy_points.contentious_issues?.map((issue: any, idx: number) => (
                    <div key={idx} className="border-l-4 border-orange-500 pl-4">
                      <h4 className="font-semibold mb-2">{issue.issue}</h4>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm font-medium">Opposing Views:</span>
                          <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
                            {issue.opposing_views?.map((view: string, vIdx: number) => (
                              <li key={vIdx}>{view}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <span className="text-sm font-medium">Potential Flashpoints:</span>
                          <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
                            {issue.potential_flashpoints?.map((point: string, pIdx: number) => (
                              <li key={pIdx}>{point}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="witnesses" className="space-y-6">
          {prepSheet.witness_testimonies && prepSheet.witness_testimonies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Witness Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {prepSheet.witness_testimonies.map((witness: any, idx: number) => (
                    <div key={idx} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-lg">{witness.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {witness.title} • {witness.organization}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <span className="text-sm font-medium">Expected Position:</span>
                          <p className="text-sm mt-1">{witness.expected_position}</p>
                        </div>

                        {witness.key_points && (
                          <div>
                            <span className="text-sm font-medium">Key Points:</span>
                            <ul className="list-disc list-inside text-sm mt-1 space-y-1">
                              {witness.key_points.map((point: string, pIdx: number) => (
                                <li key={pIdx}>{point}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {witness.potential_questions && (
                          <div>
                            <span className="text-sm font-medium">Suggested Questions:</span>
                            <ol className="list-decimal list-inside text-sm mt-1 space-y-1">
                              {witness.potential_questions.map((question: string, qIdx: number) => (
                                <li key={qIdx}>{question}</li>
                              ))}
                            </ol>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="policy" className="space-y-6">
          {prepSheet.policy_implications && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Policy Implications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Immediate Impacts</h4>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {prepSheet.policy_implications.immediate_impacts?.map((impact: string, idx: number) => (
                      <li key={idx}>{impact}</li>
                    ))}
                  </ul>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">Long-term Consequences</h4>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {prepSheet.policy_implications.long_term_consequences?.map((consequence: string, idx: number) => (
                      <li key={idx}>{consequence}</li>
                    ))}
                  </ul>
                </div>

                {prepSheet.policy_implications.budgetary_impacts && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-2">Budgetary Impacts</h4>
                      <p className="text-sm">{prepSheet.policy_implications.budgetary_impacts}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {prepSheet.stakeholder_positions && prepSheet.stakeholder_positions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Stakeholder Positions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {prepSheet.stakeholder_positions.map((stakeholder: any, idx: number) => (
                    <div key={idx} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{stakeholder.group}</h4>
                        <Badge variant={
                          stakeholder.influence_level === 'high' ? 'destructive' :
                          stakeholder.influence_level === 'medium' ? 'default' : 'secondary'
                        }>
                          {stakeholder.influence_level} influence
                        </Badge>
                      </div>
                      <p className="text-sm mb-2">{stakeholder.position}</p>
                      <div>
                        <span className="text-sm font-medium">Key Concerns:</span>
                        <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
                          {stakeholder.key_concerns?.map((concern: string, cIdx: number) => (
                            <li key={cIdx}>{concern}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          {prepSheet.member_priorities && prepSheet.member_priorities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gavel className="h-5 w-5" />
                  Committee Member Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {prepSheet.member_priorities.map((member: any, idx: number) => (
                    <div key={idx} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <h4 className="font-semibold text-lg">{member.member}</h4>
                        <Badge variant={member.party === 'D' ? 'default' : 'destructive'}>
                          {member.party}
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <span className="text-sm font-medium">Known Positions:</span>
                          <ul className="list-disc list-inside text-sm mt-1">
                            {member.known_positions?.map((position: string, pIdx: number) => (
                              <li key={pIdx}>{position}</li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <span className="text-sm font-medium">Likely Questions:</span>
                          <ol className="list-decimal list-inside text-sm mt-1">
                            {member.likely_questions?.map((question: string, qIdx: number) => (
                              <li key={qIdx}>{question}</li>
                            ))}
                          </ol>
                        </div>

                        <div>
                          <span className="text-sm font-medium">Political Considerations:</span>
                          <p className="text-sm mt-1 text-muted-foreground">{member.political_considerations}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="talking" className="space-y-6">
          {prepSheet.talking_points && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Talking Points
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Opening Points</h4>
                  <ol className="list-decimal list-inside text-sm space-y-1">
                    {prepSheet.talking_points.opening_points?.map((point: string, idx: number) => (
                      <li key={idx}>{point}</li>
                    ))}
                  </ol>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">Supporting Arguments</h4>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {prepSheet.talking_points.supporting_arguments?.map((arg: string, idx: number) => (
                      <li key={idx}>{arg}</li>
                    ))}
                  </ul>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">Counter-Arguments & Responses</h4>
                  <div className="space-y-3">
                    {prepSheet.talking_points.counterarguments?.map((counter: any, idx: number) => (
                      <div key={idx} className="border-l-4 border-blue-500 pl-4">
                        <p className="text-sm font-medium mb-1">Opposition: {counter.opposition_point}</p>
                        <p className="text-sm text-muted-foreground">Response: {counter.response}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">Closing Points</h4>
                  <ol className="list-decimal list-inside text-sm space-y-1">
                    {prepSheet.talking_points.closing_points?.map((point: string, idx: number) => (
                      <li key={idx}>{point}</li>
                    ))}
                  </ol>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="gao-reports" className="space-y-6">
          {/* Active Things to Consider - GAO Reports */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-blue-500" />
                Active Things to Consider
                {loadingGaoReports && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                )}
              </CardTitle>
              <CardDescription>
                Relevant GAO reports and findings that may inform your questions and positions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingGaoReports ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              ) : gaoReports.length > 0 ? (
                <div className="space-y-4">
                  {gaoReports.map((report, idx) => (
                    <div key={report.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-lg">{report.title}</h4>
                            <Badge variant="secondary">{report.report_id}</Badge>
                            <Badge variant="outline" className="text-xs">
                              {(report.score * 100).toFixed(1)}% relevance
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(report.date).toLocaleDateString()}
                            </span>
                            {report.topics && report.topics.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {report.topics.slice(0, 3).map((topic) => (
                                  <Badge key={topic} variant="outline" className="text-xs">
                                    {topic}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 p-3 rounded-md mb-3">
                        <p className="text-sm italic text-blue-800 mb-1">Key finding:</p>
                        <p className="text-sm text-blue-900">{report.snippet}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/gao-reports/view/${report.report_id}`}>
                            <FileText className="h-4 w-4 mr-1" />
                            View Full Report
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <a href={`/gao_reports/${report.report_id.toLowerCase()}.md`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Raw MD
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No relevant GAO reports found for this hearing.</p>
                  <p className="text-sm">Try searching manually in the GAO Reports section.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Search Summary */}
          {gaoReports.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Search Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-secondary/50 rounded-lg">
                    <div className="text-2xl font-bold mb-1">{gaoReports.length}</div>
                    <div className="text-sm font-medium">Reports Found</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Based on hearing content
                    </div>
                  </div>
                  <div className="p-4 bg-secondary/50 rounded-lg">
                    <div className="text-2xl font-bold mb-1">
                      {gaoReports.length > 0 ? (gaoReports.reduce((sum, report) => sum + report.score, 0) / gaoReports.length * 100).toFixed(1) : 0}%
                    </div>
                    <div className="text-sm font-medium">Avg Relevance</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Semantic match score
                    </div>
                  </div>
                  <div className="p-4 bg-secondary/50 rounded-lg">
                    <div className="text-2xl font-bold mb-1">
                      {new Set(gaoReports.flatMap(report => report.topics || [])).size}
                    </div>
                    <div className="text-sm font-medium">Unique Topics</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Across all reports
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          {prepSheet.related_bills && prepSheet.related_bills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Related Legislation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {prepSheet.related_bills.map((bill: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 pb-3 border-b last:border-0">
                      <Badge variant="outline">{bill.bill_number}</Badge>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{bill.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Status: {bill.status} • {bill.relevance}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Static GAO Reports (fallback) */}
          {prepSheet.gao_reports && prepSheet.gao_reports.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Pre-configured GAO Reports</CardTitle>
                <CardDescription>
                  Manually curated reports for this hearing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {prepSheet.gao_reports.map((report: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 pb-3 border-b last:border-0">
                      <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">{report.title}</p>
                        <p className="text-xs text-muted-foreground">GAO-{report.gao_id}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {prepSheet.data_visualizations && prepSheet.data_visualizations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Key Data Points
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {prepSheet.data_visualizations.map((data: any, idx: number) => (
                    <div key={idx} className="p-4 bg-secondary/50 rounded-lg">
                      <div className="text-2xl font-bold mb-1">{data.value}</div>
                      <div className="text-sm font-medium">{data.metric}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Source: {data.source}
                      </div>
                      <div className="text-xs mt-2">{data.relevance}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}