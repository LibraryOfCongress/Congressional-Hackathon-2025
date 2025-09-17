"use client"

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Download, FileText, Calendar, User, ExternalLink, LinkIcon, Info, AlertCircle, Quote, Search } from "lucide-react"
import Link from "next/link"

interface GAOReportData {
  id: string;
  title: string;
  date: string;
  content: string;
  metadata?: {
    Author?: string;
    CreationDate?: string;
    Creator?: string;
    ModDate?: string;
    Producer?: string;
    SourceModified?: string;
    Title?: string;
  };
}

export default function GAOReportViewPage() {
  const params = useParams()
  const reportId = params.id as string
  const [reportData, setReportData] = useState<GAOReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/gao-reports/${reportId}`)
        
        if (!response.ok) {
          throw new Error('Report not found')
        }
        
        const data = await response.json()
        setReportData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load report')
      } finally {
        setLoading(false)
      }
    }

    if (reportId) {
      fetchReport()
    }
  }, [reportId])

  const highlightSearchTerm = (text: string, term: string) => {
    if (!term) return text
    const regex = new RegExp(`(${term})`, "gi")
    return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>')
  }

  const wordCount = reportData?.content ? reportData.content.split(/\s+/).length : 0

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/gao-reports">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to GAO Reports
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
            <Link href="/gao-reports">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to GAO Reports
            </Link>
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error loading report: {error}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/gao-reports">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to GAO Reports
            </Link>
          </Button>
        </div>
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Report not found. It may not be available in the system yet.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/gao-reports">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to GAO Reports
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-balance">{reportData.title}</h1>
          <p className="text-muted-foreground mt-2">GAO Report Analysis and Content</p>
        </div>
      </div>

      {/* Data source info */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Showing GAO report content from your database. Analysis features are placeholders and will be enhanced in future updates.
        </AlertDescription>
      </Alert>

      {/* Header Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">Government Accountability Office</CardTitle>
              <CardDescription className="mt-2">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(reportData.date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {wordCount.toLocaleString()} words
                  </div>
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Report ID: {reportData.id}
                  </div>
                </div>
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={`/gao_reports/${reportData.id.toLowerCase()}.md`} target="_blank" rel="noopener noreferrer">
                  <Download className="mr-2 h-4 w-4" />
                  Download Raw MD
                </a>
              </Button>
              <Button variant="outline" size="sm">
                <LinkIcon className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div>
            <h4 className="text-sm font-medium mb-2">Report Details:</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                <FileText className="mr-1 h-3 w-3" />
                GAO Report
              </Badge>
              <Badge variant="secondary">
                <Calendar className="mr-1 h-3 w-3" />
                {new Date(reportData.date).toLocaleDateString()}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Analysis Panel */}
        <div className="lg:col-span-1">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Quote className="h-5 w-5" />
                Report Analysis
              </CardTitle>
              <CardDescription>Key findings and recommendations from the report</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  placeholder="Search analysis..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />

                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg border-dashed">
                      <div className="text-center space-y-2">
                        <Quote className="h-8 w-8 text-muted-foreground mx-auto" />
                        <p className="text-sm text-muted-foreground">
                          Analysis features coming soon
                        </p>
                        <p className="text-xs text-muted-foreground">
                          We'll automatically extract key findings, recommendations, and insights from the report content
                        </p>
                        <Badge variant="outline" className="text-xs">
                          Feature in development
                        </Badge>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Report Content */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Full Report Content
              </CardTitle>
              <div className="flex items-center gap-4">
                <Input
                  placeholder="Search report content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
                <Badge variant="outline">{wordCount.toLocaleString()} words</Badge>
                <Badge variant="outline">GAO Report</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div
                  className="prose prose-sm max-w-none whitespace-pre-line"
                  dangerouslySetInnerHTML={{
                    __html: highlightSearchTerm(reportData.content || "No report content available", searchTerm),
                  }}
                />
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
