"use client"

import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Filter, Users } from "lucide-react"
import { cn } from "@/lib/utils"

interface TranscriptSegment {
  timestamp: string
  speaker: string
  role: string
  text: string
}

interface TranscriptFilterPanelProps {
  segments: TranscriptSegment[]
  searchTerm: string
  onSearchChange: (term: string) => void
  showAllSpeakers: boolean
  selectedSpeaker: string | null
  onSpeakerFilterChange: (showAll: boolean, speaker: string | null) => void
}

export function TranscriptFilterPanel({
  segments,
  searchTerm,
  onSearchChange,
  showAllSpeakers,
  selectedSpeaker,
  onSpeakerFilterChange
}: TranscriptFilterPanelProps) {
  // Get unique speakers
  const speakers = Array.from(
    new Map(segments.map(seg => [seg.speaker, seg.role])).entries()
  ).map(([name, role]) => ({ name, role }))

  const getSpeakerColor = (role: string) => {
    if (role.toLowerCase().includes('committee')) return 'bg-blue-50 text-blue-700 border-blue-200'
    if (role.toLowerCase().includes('witness')) return 'bg-green-50 text-green-700 border-green-200'
    if (role.toLowerCase().includes('chair')) return 'bg-purple-50 text-purple-700 border-purple-200'
    return 'bg-gray-50 text-gray-700 border-gray-200'
  }

  const getSpeakerCount = (speakerName: string) => {
    return segments.filter(s => s.speaker === speakerName).length
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Search className="h-4 w-4" />
          Search Transcript
        </h4>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search content..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        {searchTerm && (
          <p className="text-xs text-muted-foreground">
            Searching for: "{searchTerm}"
          </p>
        )}
      </div>

      {/* Speaker Filter */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filter by Speaker
        </h4>

        <Button
          variant={showAllSpeakers ? "default" : "outline"}
          size="sm"
          onClick={() => onSpeakerFilterChange(true, null)}
          className="w-full justify-start"
        >
          <Users className="mr-2 h-4 w-4" />
          All Speakers ({segments.length} segments)
        </Button>

        <ScrollArea className="h-80">
          <div className="space-y-2">
            {speakers.map(speaker => (
              <Button
                key={speaker.name}
                variant={!showAllSpeakers && selectedSpeaker === speaker.name ? "default" : "outline"}
                size="sm"
                onClick={() => onSpeakerFilterChange(false, speaker.name)}
                className="w-full justify-start text-left h-auto p-3"
              >
                <div className="flex flex-col items-start gap-1 w-full">
                  <div className="flex items-center gap-2 w-full">
                    <span className="font-medium text-sm truncate flex-1">
                      {speaker.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {getSpeakerCount(speaker.name)}
                    </span>
                  </div>
                  <Badge
                    variant="secondary"
                    className={cn("text-xs px-1.5 py-0", getSpeakerColor(speaker.role))}
                  >
                    {speaker.role}
                  </Badge>
                </div>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Active Filters */}
      {(!showAllSpeakers || searchTerm) && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Active Filters</h4>
          <div className="space-y-1">
            {!showAllSpeakers && selectedSpeaker && (
              <Badge variant="secondary" className="text-xs">
                Speaker: {selectedSpeaker}
              </Badge>
            )}
            {searchTerm && (
              <Badge variant="secondary" className="text-xs">
                Search: "{searchTerm}"
              </Badge>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onSpeakerFilterChange(true, null)
              onSearchChange("")
            }}
            className="w-full text-xs"
          >
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  )
}