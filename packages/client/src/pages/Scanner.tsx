import { useState, useEffect } from 'react'
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Search,
  Link,
  RefreshCw,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Download,
  Save,
} from 'lucide-react'
import TrustBadge from '../components/TrustBadge'
import FindingCard from '../components/FindingCard'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import { scanApi, skillsApi } from '../lib/api'
import type { ScanResult, ParsedSkill } from '../lib/types'

function ScanSummaryBar({
  total,
  safe,
  review,
  dangerous,
}: {
  total: number
  safe: number
  review: number
  dangerous: number
}) {
  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {[
        { label: 'Total', value: total, color: 'text-zinc-300', bg: 'bg-zinc-800' },
        { label: 'Safe', value: safe, color: 'text-green-400', bg: 'bg-green-900/20 border border-green-800/30' },
        { label: 'Review', value: review, color: 'text-yellow-400', bg: 'bg-yellow-900/20 border border-yellow-800/30' },
        { label: 'Dangerous', value: dangerous, color: 'text-red-400', bg: 'bg-red-900/20 border border-red-800/30' },
      ].map(({ label, value, color, bg }) => (
        <div key={label} className={`card p-4 ${bg}`}>
          <div className={`text-2xl font-bold ${color}`}>{value}</div>
          <div className="text-xs text-zinc-500 mt-0.5">{label}</div>
        </div>
      ))}
    </div>
  )
}

export default function ScannerPage() {
  const [mode, setMode] = useState<'installed' | 'clawhub'>('installed')
  const [scanResults, setScanResults] = useState<ScanResult[]>([])
  const [summary, setSummary] = useState({ total: 0, safe: 0, review: 0, dangerous: 0 })
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<ScanResult | null>(null)
  const [clawHubUrl, setClawHubUrl] = useState('')
  const [clawHubResult, setClawHubResult] = useState<ScanResult | null>(null)
  const [clawHubScanning, setClawHubScanning] = useState(false)
  const [installing, setInstalling] = useState(false)
  const [installed, setInstalled] = useState(false)
  const [clawHubContent, setClawHubContent] = useState('')

  const scanAll = async () => {
    setLoading(true)
    setSelected(null)
    const data = await scanApi.all() as { summary: typeof summary; results: ScanResult[] }
    setSummary(data.summary)
    setScanResults(data.results)
    setLoading(false)
  }

  useEffect(() => {
    if (mode === 'installed') scanAll()
  }, [mode])

  const handleClawHubScan = async () => {
    if (!clawHubUrl.trim()) return
    setClawHubScanning(true)
    setClawHubResult(null)
    setInstalled(false)
    try {
      const result = await scanApi.clawhub(clawHubUrl) as ScanResult
      setClawHubResult(result)
    } catch (e: unknown) {
      alert((e as Error).message)
    }
    setClawHubScanning(false)
  }

  const handleInstallFromClawHub = async () => {
    if (!clawHubContent) return
    setInstalling(true)
    try {
      const nameMatch = clawHubContent.match(/^name:\s*["']?([^"'\n]+)["']?/m)
      const name = nameMatch?.[1]?.trim() || 'clawhub-skill'
      await skillsApi.create(name, clawHubContent)
      setInstalled(true)
    } catch (e: unknown) {
      alert((e as Error).message)
    }
    setInstalling(false)
  }

  const trustIcon = (score: ScanResult['trustScore']) => {
    if (score === 'safe') return <ShieldCheck className="w-4 h-4 text-green-400" />
    if (score === 'review') return <Shield className="w-4 h-4 text-yellow-400" />
    return <ShieldAlert className="w-4 h-4 text-red-400" />
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Security Scanner"
        subtitle="Scan skills for malware, prompt injection, and vulnerabilities"
        icon={<Shield className="w-5 h-5" />}
      />

      {/* Mode tabs */}
      <div className="flex gap-1 p-1 bg-zinc-900 rounded-lg mb-6 w-fit">
        <button
          className={`px-4 py-1.5 text-sm rounded-md font-medium transition-all ${
            mode === 'installed' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
          }`}
          onClick={() => setMode('installed')}
        >
          Scan Installed Skills
        </button>
        <button
          className={`px-4 py-1.5 text-sm rounded-md font-medium transition-all ${
            mode === 'clawhub' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
          }`}
          onClick={() => setMode('clawhub')}
        >
          Scan ClawHub Skill
        </button>
      </div>

      {mode === 'installed' && (
        <>
          <div className="flex items-center justify-between mb-4">
            <div />
            <button className="btn-secondary text-sm" onClick={scanAll} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Refresh Scan
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <LoadingSpinner text="Scanning skills..." />
            </div>
          ) : (
            <>
              {scanResults.length > 0 && (
                <ScanSummaryBar {...summary} />
              )}

              <div className="flex gap-4">
                {/* Results list */}
                <div className="w-72 shrink-0 space-y-2">
                  {scanResults.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500">
                      <Shield className="w-8 h-8 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No skills installed</p>
                    </div>
                  ) : (
                    scanResults.map(r => (
                      <button
                        key={r.skillName}
                        className={`w-full text-left card p-3 hover:border-zinc-600 transition-all ${
                          selected?.skillName === r.skillName ? 'border-claw-500/50 bg-claw-900/10' : ''
                        }`}
                        onClick={() => setSelected(r)}
                      >
                        <div className="flex items-center gap-2">
                          {trustIcon(r.trustScore)}
                          <span className="text-sm font-medium text-zinc-200 truncate flex-1">
                            {r.skillName}
                          </span>
                          {r.findings.length > 0 && (
                            <span className="text-xs text-zinc-500">{r.findings.length}</span>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>

                {/* Detail panel */}
                <div className="flex-1">
                  {!selected ? (
                    <div className="flex items-center justify-center h-64 text-zinc-600">
                      <div className="text-center">
                        <Shield className="w-8 h-8 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">Select a skill to see scan results</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="card p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <h2 className="text-lg font-semibold text-zinc-100">{selected.skillName}</h2>
                          <TrustBadge score={selected.trustScore} />
                        </div>
                        <p className="text-sm text-zinc-400">{selected.summary}</p>
                        <p className="text-xs text-zinc-600 mt-2">
                          Scanned {new Date(selected.scannedAt).toLocaleString()}
                        </p>
                      </div>

                      {selected.findings.length === 0 ? (
                        <div className="card p-6 text-center">
                          <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
                          <p className="text-green-400 font-medium">No issues found</p>
                          <p className="text-sm text-zinc-400 mt-1">This skill passed all security checks.</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <h3 className="text-sm font-medium text-zinc-400">
                            {selected.findings.length} finding{selected.findings.length > 1 ? 's' : ''}
                          </h3>
                          {selected.findings.map((f, i) => (
                            <FindingCard key={i} finding={f} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {mode === 'clawhub' && (
        <div className="max-w-2xl space-y-6">
          <div className="card p-4">
            <p className="text-sm text-zinc-300 mb-1">
              Paste a ClawHub skill URL to scan it before installing.
            </p>
            <p className="text-xs text-zinc-500 mb-4">
              Based on community audits, 12% of ClawHub skills contain malware. Always scan before installing.
            </p>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  className="input pl-9"
                  placeholder="https://clawhub.io/skills/author/skill-name"
                  value={clawHubUrl}
                  onChange={e => setClawHubUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleClawHubScan()}
                />
              </div>
              <button
                className="btn-primary"
                onClick={handleClawHubScan}
                disabled={!clawHubUrl.trim() || clawHubScanning}
              >
                {clawHubScanning ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Scan
              </button>
            </div>
          </div>

          {clawHubResult && (
            <div className="space-y-4">
              <div className="card p-4">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-lg font-semibold text-zinc-100">{clawHubResult.skillName}</h2>
                  <TrustBadge score={clawHubResult.trustScore} />
                </div>
                <p className="text-sm text-zinc-400">{clawHubResult.summary}</p>

                {clawHubResult.trustScore === 'safe' && !installed && (
                  <button
                    className="btn-primary mt-4"
                    onClick={handleInstallFromClawHub}
                    disabled={installing}
                  >
                    {installing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Install Skill
                  </button>
                )}
                {installed && (
                  <div className="mt-4 flex items-center gap-2 text-green-400 text-sm">
                    <CheckCircle className="w-4 h-4" /> Skill installed successfully
                  </div>
                )}
                {clawHubResult.trustScore !== 'safe' && (
                  <div className="mt-4 flex items-center gap-2 text-red-400 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    Installation blocked due to security findings
                  </div>
                )}
              </div>

              {clawHubResult.findings.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-zinc-400">
                    {clawHubResult.findings.length} findings
                  </h3>
                  {clawHubResult.findings.map((f, i) => (
                    <FindingCard key={i} finding={f} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
