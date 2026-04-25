import { ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import type { Finding } from '../lib/types'

interface FindingCardProps {
  finding: Finding
}

export default function FindingCard({ finding }: FindingCardProps) {
  const [expanded, setExpanded] = useState(false)

  const borderColor = {
    critical: 'border-l-red-500',
    high: 'border-l-orange-500',
    medium: 'border-l-yellow-500',
    low: 'border-l-zinc-500',
  }[finding.severity]

  const badgeClass = `badge-${finding.severity}`

  return (
    <div className={`card p-4 border-l-4 ${borderColor}`}>
      <div
        className="flex items-start justify-between cursor-pointer"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-start gap-3 min-w-0">
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-zinc-500 mt-0.5 shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-zinc-500 mt-0.5 shrink-0" />
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-zinc-100 text-sm">
                {finding.ruleName}
              </span>
              <span className={badgeClass}>{finding.severity}</span>
              <span className="text-xs text-zinc-500">Line {finding.line}</span>
            </div>
            <code className="text-xs text-zinc-400 font-mono mt-1 block truncate">
              {finding.snippet}
            </code>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pl-7 space-y-2 text-sm">
          <div>
            <div className="text-zinc-400 font-medium mb-1">What this means</div>
            <p className="text-zinc-300">{finding.explanation}</p>
          </div>
          <div>
            <div className="text-zinc-400 font-medium mb-1">Recommendation</div>
            <p className="text-zinc-300">{finding.recommendation}</p>
          </div>
        </div>
      )}
    </div>
  )
}
