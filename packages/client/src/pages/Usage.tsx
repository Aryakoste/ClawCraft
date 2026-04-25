import { useState, useEffect } from 'react'
import {
  BarChart3,
  TrendingUp,
  Clock,
  Zap,
  Activity,
  RefreshCw,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import { usageApi } from '../lib/api'
import type { UsageStats } from '../lib/types'

interface UsageSummary {
  totalSkillFires: number
  totalTimeSavedHours: number
  mostUsedSkill: string | null
  skillsWithUsage: number
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: typeof Zap
  label: string
  value: string | number
  sub?: string
  color?: string
}) {
  return (
    <div className="card p-5">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${color ?? 'bg-zinc-800 text-zinc-400'}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-2xl font-bold text-zinc-100">{value}</div>
      <div className="text-sm text-zinc-400 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-zinc-600 mt-1">{sub}</div>}
    </div>
  )
}

function MiniBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-claw-500 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-zinc-500 w-6 text-right">{value}</span>
    </div>
  )
}

function SparkLine({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).slice(-14)
  if (entries.length === 0) return <span className="text-xs text-zinc-600">No data</span>
  const max = Math.max(...entries.map(([, v]) => v), 1)
  const w = 100
  const h = 30
  const points = entries.map(([, v], i) => {
    const x = (i / (entries.length - 1)) * w
    const y = h - (v / max) * h
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke="#a855f7"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function UsagePage() {
  const [summary, setSummary] = useState<UsageSummary | null>(null)
  const [stats, setStats] = useState<UsageStats[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const [s, a] = await Promise.all([
      usageApi.summary() as Promise<UsageSummary>,
      usageApi.all() as Promise<UsageStats[]>,
    ])
    setSummary(s)
    setStats(a)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const maxFires = Math.max(...stats.map(s => s.totalFires), 1)

  return (
    <div className="p-6">
      <PageHeader
        title="Usage Tracker"
        subtitle="How often each skill fires and time saved"
        icon={<BarChart3 className="w-5 h-5" />}
        actions={
          <button className="btn-ghost" onClick={load}>
            <RefreshCw className="w-4 h-4" />
          </button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <LoadingSpinner text="Loading usage data..." />
        </div>
      ) : (
        <>
          {/* Summary cards */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard
                icon={Zap}
                label="Total Skill Fires"
                value={summary.totalSkillFires.toLocaleString()}
                color="bg-claw-900/50 text-claw-400"
              />
              <StatCard
                icon={Clock}
                label="Time Saved"
                value={`${summary.totalTimeSavedHours}h`}
                sub="Estimated based on logged sessions"
                color="bg-green-900/50 text-green-400"
              />
              <StatCard
                icon={TrendingUp}
                label="Most Used"
                value={summary.mostUsedSkill ?? '—'}
                color="bg-yellow-900/50 text-yellow-400"
              />
              <StatCard
                icon={Activity}
                label="Active Skills"
                value={summary.skillsWithUsage}
                color="bg-blue-900/50 text-blue-400"
              />
            </div>
          )}

          {/* Per-skill breakdown */}
          {stats.length === 0 ? (
            <div className="text-center py-16 text-zinc-500">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-sm">No usage data yet.</p>
              <p className="text-xs mt-1">
                Usage is logged automatically when skills fire through OpenClaw.
                You can also record usage manually via the companion skill.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-zinc-400 mb-4">Per-Skill Usage</h2>
              {stats.map(s => (
                <div key={s.skillName} className="card p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-medium text-zinc-100 text-sm truncate">{s.skillName}</span>
                        <span className="text-xs text-zinc-500">{s.totalFires} fires</span>
                        {s.totalTimeSavedSeconds > 0 && (
                          <span className="text-xs text-green-400">
                            {s.totalTimeSavedSeconds >= 3600
                              ? `${(s.totalTimeSavedSeconds / 3600).toFixed(1)}h saved`
                              : `${Math.round(s.totalTimeSavedSeconds / 60)}m saved`}
                          </span>
                        )}
                        {s.lastFired && (
                          <span className="text-xs text-zinc-600">
                            Last: {new Date(s.lastFired).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <MiniBar value={s.totalFires} max={maxFires} />
                    </div>
                    <div className="shrink-0">
                      <SparkLine data={s.firesByDay} />
                    </div>
                  </div>

                  {Object.keys(s.channels).length > 0 && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {Object.entries(s.channels).map(([ch, count]) => (
                        <span key={ch} className="badge bg-zinc-800 text-zinc-400 text-xs">
                          {ch}: {count}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
