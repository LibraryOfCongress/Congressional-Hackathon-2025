"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { BookOpen, Calendar, FileText, TrendingUp, Search, Download, Loader2 } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"

// Mock data for GAO reports - in a real app, this would come from an API
const mockGAOReports = [
  {
    id: "GAO-25-107121",
    title: "Cybersecurity: Federal Agencies Need to Address Weaknesses in Supply Chain Risk Management",
    date: "2025-01-15",
    summary: "This report examines federal agencies' implementation of supply chain risk management practices and identifies key weaknesses that need to be addressed.",
    topics: ["Cybersecurity", "Supply Chain", "Risk Management"],
    status: "Published",
    pages: 45,
    url: "#"
  },
  {
    id: "GAO-25-106543",
    title: "Climate Change: Federal Actions Needed to Improve Resilience and Adaptation Planning",
    date: "2025-01-10",
    summary: "A comprehensive review of federal climate adaptation efforts and recommendations for improving resilience planning across agencies.",
    topics: ["Climate Change", "Resilience", "Adaptation"],
    status: "Published",
    pages: 67,
    url: "#"
  },
  {
    id: "GAO-25-105987",
    title: "Healthcare: Medicare Advantage Plans Need Better Oversight and Transparency",
    date: "2025-01-05",
    summary: "Analysis of Medicare Advantage program oversight and recommendations for improving transparency and beneficiary protections.",
    topics: ["Healthcare", "Medicare", "Oversight"],
    status: "Published",
    pages: 52,
    url: "#"
  },
  {
    id: "GAO-25-105432",
    title: "Defense: Military Readiness Challenges in the Indo-Pacific Region",
    date: "2024-12-28",
    summary: "Assessment of U.S. military readiness and capabilities in the Indo-Pacific region with recommendations for improvement.",
    topics: ["Defense", "Military Readiness", "Indo-Pacific"],
    status: "Published",
    pages: 89,
    url: "#"
  },
  {
    id: "GAO-25-104876",
    title: "Education: Federal Student Aid Programs Need Modernization",
    date: "2024-12-20",
    summary: "Review of federal student aid programs and recommendations for modernizing systems and improving student outcomes.",
    topics: ["Education", "Student Aid", "Modernization"],
    status: "Published",
    pages: 73,
    url: "#"
  }
]

interface SearchResult {
  id: string;
  score: number;
  content: string;
  title: string;
  report_id: string;
  date: string;
  topics: string[];
  snippet: string;
}

interface GAOReport {
  id: string;
  title: string;
  date: string;
  filename: string;
  metadata?: any;
}

export default function GAOReportsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchNote, setSearchNote] = useState("");
  const [allReports, setAllReports] = useState<GAOReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);

  useEffect(() => {
    const fetchAllReports = async () => {
      try {
        const response = await fetch('/api/gao-reports');
        if (response.ok) {
          const data = await response.json();
          setAllReports(data.reports || []);
        }
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setLoadingReports(false);
      }
    };

    fetchAllReports();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      const response = await fetch('/api/search-gao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          limit: 10,
        }),
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setSearchResults(data.results || []);
      setSearchNote(data.note || "");
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="space-y-8">
             <div className="flex items-center justify-between">
               <div>
                 <h1 className="text-3xl font-bold text-balance">GAO Reports</h1>
                 <p className="text-muted-foreground mt-2">Browse and analyze Government Accountability Office reports and recommendations</p>
               </div>
               <div className="flex items-center space-x-2">
                 <Button variant="outline" asChild>
                   <a href="/gao_reports/" target="_blank" rel="noopener noreferrer">
                     <FileText className="mr-2 h-4 w-4" />
                     Browse Raw Files
                   </a>
                 </Button>
                 <Button variant="outline">
                   <Download className="mr-2 h-4 w-4" />
                   Export Data
                 </Button>
               </div>
             </div>

      {/* Semantic Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Semantic Search
          </CardTitle>
          <CardDescription>
            Search GAO reports using natural language to find the most relevant content and recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search for topics like 'cybersecurity', 'climate change', 'healthcare oversight'..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()}>
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {hasSearched && (
            <div className="text-sm text-muted-foreground">
              {isSearching ? (
                "Searching..."
              ) : searchResults.length > 0 ? (
                `Found ${searchResults.length} relevant results`
              ) : (
                "No results found. Try different keywords."
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search Results */}
      {hasSearched && !isSearching && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>
              Results for: "{searchQuery}"
              {searchNote && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                  {searchNote}
                </div>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {searchResults.length > 0 ? (
              searchResults.map((result) => (
                <div key={result.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{result.title}</h3>
                        <Badge variant="secondary">{result.report_id}</Badge>
                        <Badge variant="outline" className="text-xs">
                          {(result.score * 100).toFixed(1)}% match
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(result.date).toLocaleDateString()}
                        </span>
                        {result.topics && result.topics.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {result.topics.slice(0, 3).map((topic) => (
                              <Badge key={topic} variant="outline" className="text-xs">
                                {topic}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-muted/30 p-3 rounded-md mb-3">
                    <p className="text-sm italic text-muted-foreground mb-1">Relevant excerpt:</p>
                    <p className="text-sm">{result.snippet}</p>
                  </div>
                  
                         <div className="flex items-center gap-2">
                           <Button variant="outline" size="sm" asChild>
                             <a href={`/gao-reports/view/${result.report_id}`} target="_blank" rel="noopener noreferrer">
                               <FileText className="h-4 w-4 mr-1" />
                               View Full Report
                             </a>
                           </Button>
                           <Button variant="outline" size="sm" asChild>
                             <a href={`/gao_reports/${result.report_id.toLowerCase()}.md`} target="_blank" rel="noopener noreferrer">
                               <Download className="h-4 w-4 mr-1" />
                               View Raw MD
                             </a>
                           </Button>
                         </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No results found for your search.</p>
                <p className="text-sm">Try different keywords or check your spelling.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <p className="text-xs text-muted-foreground">Published this year</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">Under review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recommendations</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3,456</div>
            <p className="text-xs text-muted-foreground">Total recommendations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Implementation Rate</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78%</div>
            <p className="text-xs text-muted-foreground">Recommendations implemented</p>
          </CardContent>
        </Card>
      </div>

      {/* All Available Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Available GAO Reports
          </CardTitle>
          <CardDescription>
            {loadingReports ? 'Loading reports...' : `${allReports.length} reports available`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingReports ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span className="text-muted-foreground">Loading reports...</span>
            </div>
          ) : allReports.length > 0 ? (
            allReports.map((report) => (
              <div key={report.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{report.title}</h3>
                    <Badge variant="secondary">{report.id}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(report.date).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {report.filename}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/gao-reports/view/${report.id}`} target="_blank" rel="noopener noreferrer">
                      <FileText className="h-4 w-4 mr-1" />
                      View
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/gao_reports/${report.filename}`} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-1" />
                      Raw MD
                    </a>
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No GAO reports found.</p>
              <p className="text-sm">Make sure the gao_reports folder contains markdown files.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and workflows for GAO reports</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button asChild variant="outline" className="w-full justify-start bg-transparent">
            <Link href="/gao-reports/search">
              <Search className="mr-2 h-4 w-4" />
              Search Reports by Topic
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full justify-start bg-transparent">
            <Link href="/gao-reports/recommendations">
              <TrendingUp className="mr-2 h-4 w-4" />
              Track Implementation Status
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full justify-start bg-transparent">
            <Link href="/gao-reports/analytics">
              <BookOpen className="mr-2 h-4 w-4" />
              View Analytics Dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
