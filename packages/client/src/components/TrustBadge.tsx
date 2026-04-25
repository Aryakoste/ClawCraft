import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react'
import type { ScanResult } from '../lib/types'

interface TrustBadgeProps {
  score: ScanResult['trustScore']
  size?: 'sm' | 'md'
}

export default function TrustBadge({ score, size = 'md' }: TrustBadgeProps) {
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm'

  if (score === 'safe') {
    return (
      <span className={`badge-safe ${textSize}`}>
        <ShieldCheck className={iconSize} />
        Safe
      </span>
    )
  }
  if (score === 'review') {
    return (
      <span className={`badge-review ${textSize}`}>
        <Shield className={iconSize} />
        Review
      </span>
    )
  }
  return (
    <span className={`badge-dangerous ${textSize}`}>
      <ShieldAlert className={iconSize} />
      Dangerous
    </span>
  )
}
