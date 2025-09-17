"use client"

import { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface TranscriptSegment {
  timestamp: string
  speaker: string
  role: string
  text: string
}

interface LabeledTranscriptViewerProps {
  content: string
  searchTerm?: string
  showAllSpeakers?: boolean
  selectedSpeaker?: string | null
}

export function LabeledTranscriptViewer({
  content,
  searchTerm = "",
  showAllSpeakers = true,
  selectedSpeaker = null
}: LabeledTranscriptViewerProps) {

  // Parse the labeled transcript into segments
  const segments = useMemo<TranscriptSegment[]>(() => {
    const lines = content.split('\n')
    const parsed: TranscriptSegment[] = []

    for (const line of lines) {
      // Match format: [00:00:00 - 00:00:00] Speaker Name (Role): Text
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
  }, [content])

  // Get unique speakers
  const speakers = useMemo(() => {
    const speakerSet = new Map<string, string>()
    segments.forEach(seg => {
      speakerSet.set(seg.speaker, seg.role)
    })
    return Array.from(speakerSet.entries()).map(([name, role]) => ({ name, role }))
  }, [segments])

  // Filter segments based on search and speaker selection
  const filteredSegments = useMemo(() => {
    return segments.filter(seg => {
      const matchesSearch = !searchTerm ||
        seg.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        seg.speaker.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesSpeaker = showAllSpeakers ||
        !selectedSpeaker ||
        seg.speaker === selectedSpeaker

      return matchesSearch && matchesSpeaker
    })
  }, [segments, searchTerm, showAllSpeakers, selectedSpeaker])

  const getSpeakerColor = (role: string) => {
    if (role.toLowerCase().includes('committee')) return 'bg-blue-50 text-blue-700 border-blue-200'
    if (role.toLowerCase().includes('witness')) return 'bg-green-50 text-green-700 border-green-200'
    if (role.toLowerCase().includes('chair')) return 'bg-purple-50 text-purple-700 border-purple-200'
    return 'bg-gray-50 text-gray-700 border-gray-200'
  }

  const getSpeakerTextColor = (role: string) => {
    if (role.toLowerCase().includes('committee')) return 'text-blue-900'
    if (role.toLowerCase().includes('witness')) return 'text-green-900'
    if (role.toLowerCase().includes('chair')) return 'text-purple-900'
    return 'text-gray-900'
  }

  const highlightSearchTerm = (text: string) => {
    if (!searchTerm) return text
    const regex = new RegExp(`(${searchTerm})`, "gi")
    return text.replace(regex, '<mark class="bg-yellow-200 font-semibold px-0.5">$1</mark>')
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {filteredSegments.map((segment, index) => (
        <div key={index} className="group">
          {/* Speaker Header */}
          <div className="flex items-baseline gap-2 mb-2">
            <span className={cn("font-semibold", getSpeakerTextColor(segment.role))}>
              {segment.speaker}
            </span>
            <Badge
              variant="outline"
              className={cn("text-xs px-1.5 py-0", getSpeakerColor(segment.role))}
            >
              {segment.role}
            </Badge>
            <span className="text-xs text-muted-foreground">
              ({segment.timestamp})
            </span>
          </div>

          {/* Text Content */}
          <div
            className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 pl-0 mb-4"
            dangerouslySetInnerHTML={{
              __html: highlightSearchTerm(segment.text)
            }}
          />

          {/* Separator between speakers */}
          {index < filteredSegments.length - 1 && (
            <div className="border-b border-gray-100 dark:border-gray-800" />
          )}
        </div>
      ))}

      {filteredSegments.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No transcript segments found matching your filters.</p>
        </div>
      )}
    </div>
  )
}