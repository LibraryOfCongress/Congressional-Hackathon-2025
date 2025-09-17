"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, MapPin, Users, FileText, Plus, Filter, RefreshCw, Building, Sparkles, Target, AlertCircle } from "lucide-react"
import Link from "next/link"

interface Hearing {
  id: number
  event_id: string
  chamber: string
  congress: number
  event_date: string
  title: string
  committee_name: string
  committee_system_code: string
  location_building: string
  location_room: string
  meeting_type: string
  meeting_status: string
  api_url: string
  related_bills: any[]
  related_nominations: any[]
  meeting_documents: any[]
  ai_summary?: string
  ai_key_topics?: {
    topics?: string[]
    outcomes?: string[]
    stakeholders?: string[]
    importance?: string
  }
  ai_witnesses?: any[]
  ai_bills_impact?: any[]
  ai_generated_at?: string
}

export default function UpcomingHearings() {
  const [hearings, setHearings] = useState<Hearing[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedChamber, setSelectedChamber] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")

  useEffect(() => {
    fetchHearings()
  }, [selectedChamber])

  const fetchHearings = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedChamber !== "all") {
        params.append("chamber", selectedChamber)
      }
      params.append("limit", "50")

      const response = await fetch(`/api/hearings?${params.toString()}`)
      const data = await response.json()
      setHearings(data.hearings || [])
    } catch (error) {
      console.error("Error fetching hearings:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredHearings = hearings.filter((hearing) => {
    const matchesSearch =
      hearing.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hearing.committee_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === "all" || hearing.meeting_status?.toLowerCase() === selectedStatus

    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "scheduled":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "postponed":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getChamberColor = (chamber: string) => {
    switch (chamber?.toLowerCase()) {
      case "house":
        return "bg-green-100 text-green-800 border-green-200"
      case "senate":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "joint":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Date TBD"
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric"
    })
  }

  const formatTime = (dateStr: string) => {
    if (!dateStr) return ""
    const date = new Date(dateStr)
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short"
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Upcoming Hearings</h1>
          <p className="text-muted-foreground mt-2">Live congressional committee hearings and meetings</p>
        </div>
        <Button onClick={fetchHearings} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <Input
                placeholder="Search hearings..."
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
                  <SelectItem value="House">House</SelectItem>
                  <SelectItem value="Senate">Senate</SelectItem>
                  <SelectItem value="Joint">Joint</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="postponed">Postponed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setSelectedChamber("all")
                  setSelectedStatus("all")
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
            <h3 className="text-lg font-medium mb-2">Loading hearings...</h3>
            <p className="text-muted-foreground">Fetching latest committee meetings from Congress.gov</p>
          </CardContent>
        </Card>
      )}

      {/* Hearings List */}
      {!loading && (
        <div className="space-y-4">
          {filteredHearings.map((hearing) => (
            <Card key={hearing.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-xl text-balance">
                      {hearing.title || "Committee Meeting"}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {hearing.committee_name || `${hearing.chamber} Committee`}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getChamberColor(hearing.chamber)}>
                      {hearing.chamber}
                    </Badge>
                    {hearing.meeting_status && (
                      <Badge className={getStatusColor(hearing.meeting_status)}>
                        {hearing.meeting_status}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{formatDate(hearing.event_date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{formatTime(hearing.event_date) || "Time TBD"}</span>
                  </div>
                  {(hearing.location_building || hearing.location_room) && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {hearing.location_room ? `Room ${hearing.location_room}, ` : ""}
                        {hearing.location_building || "Location TBD"}
                      </span>
                    </div>
                  )}
                  {hearing.meeting_type && (
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{hearing.meeting_type}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t">

                </div>
                {hearing.ai_summary && (
                  <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                    <div className="flex items-start gap-2 mb-2">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">Summary</h4>
                        <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                          {hearing.ai_summary}
                        </p>
                      </div>
                    </div>

                    {hearing.ai_key_topics && (
                      <div className="mt-3 space-y-2">
                        {hearing.ai_key_topics.stakeholders && hearing.ai_key_topics.stakeholders.length > 0 && (
                          <div>
                            <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1 mb-1">
                              Key Stakeholders:
                            </span>
                            <p className="text-xs text-blue-600 dark:text-blue-300">
                              {hearing.ai_key_topics.stakeholders.join(', ')}
                            </p>
                          </div>
                        )}
                        {hearing.ai_key_topics.topics && hearing.ai_key_topics.topics.length > 0 && (
                          <div>
                            <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1 mb-1">
                              Key Topics:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {hearing.ai_key_topics.topics.map((topic, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs bg-white dark:bg-gray-800">
                                  {topic}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}


                      </div>
                    )}
                  </div>
                )}



                {/* Potential Outcomes */}
                {hearing.ai_key_topics?.outcomes && hearing.ai_key_topics.outcomes.length > 0 && (
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <h4 className="text-sm font-medium mb-2">Potential Outcomes:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {hearing.ai_key_topics.outcomes.map((outcome: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          {outcome}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredHearings.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No hearings found</h3>
            <p className="text-muted-foreground">Try adjusting your filters or search terms.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
