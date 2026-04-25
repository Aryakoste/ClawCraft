import { useState, useEffect, useCallback } from 'react'
import {
  FolderOpen,
  Search,
  Plus,
  Edit,
  Trash2,
  Copy,
  Download,
  Shield,
  Clock,
  ChevronRight,
  X,
  Save,
  Loader2,
  History,
  RotateCcw,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'
import SkillEditor from '../components/SkillEditor'
import TrustBadge from '../components/TrustBadge'
import FindingCard from '../components/FindingCard'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import { skillsApi, scanApi } from '../lib/api'
import type { ParsedSkill, ScanResult, SkillVersion, ConflictReport } from '../lib/types'

function SkillCard({
  skill,
  onEdit,
  onDelete,
  onDuplicate,
  onScan,
}: {
  skill: ParsedSkill & { scanResult?: ScanResult }
  onEdit: () => void
  onDelete: () => void
  onDuplicate: () => void
  onScan: () => void
}) {
  const [deleting, setDeleting] = useState(false)

  return (
    <div className={`card p-4 hover:border-zinc-700 transition-colors ${
      skill.scanResult?.trustScore === 'dangerous' ? 'trust-ring-dangerous' :
      skill.scanResult?.trustScore === 'review' ? 'trust-ring-review' : ''
    }`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-zinc-100 truncate">{skill.frontmatter.name || skill.name}</h3>
            {skill.scanResult && <TrustBadge score={skill.scanResult.trustScore} size="sm" />}
          </div>
          <p className="text-sm text-zinc-400 mt-0.5 line-clamp-2">
            {skill.frontmatter.description || 'No description'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-zinc-500 mb-3 flex-wrap">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {new Date(skill.lastModified).toLocaleDateString()}
        </span>
        <span>v{skill.frontmatter.version || '1.0.0'}</span>
        {skill.frontmatter.trigger && (
          <span className="bg-zinc-800 px-1.5 py-0.5 rounded">
            {skill.frontmatter.trigger}
          </span>
        )}
        {skill.frontmatter.tags?.slice(0, 3).map(tag => (
          <span key={tag} className="bg-zinc-800 px-1.5 py-0.5 rounded">{tag}</span>
        ))}
      </div>

      <div className="flex items-center gap-1 flex-wrap">
        <button className="btn-ghost text-xs" onClick={onEdit}>
          <Edit className="w-3.5 h-3.5" /> Edit
        </button>
        <button className="btn-ghost text-xs" onClick={onScan}>
          <Shield className="w-3.5 h-3.5" /> Scan
        </button>
        <button className="btn-ghost text-xs" onClick={onDuplicate}>
          <Copy className="w-3.5 h-3.5" /> Duplicate
        </button>
        <a
          className="btn-ghost text-xs"
          href={skillsApi.downloadUrl(skill.name)}
          download
        >
          <Download className="w-3.5 h-3.5" /> ZIP
        </a>
        <button
          className="btn-danger text-xs ml-auto"
          onClick={async () => {
            if (!confirm(`Delete "${skill.name}"?`)) return
            setDeleting(true)
            await onDelete()
            setDeleting(false)
          }}
          disabled={deleting}
        >
          {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  )
}

function SkillEditModal({
  skill,
  onClose,
  onSave,
}: {
  skill: ParsedSkill
  onClose: () => void
  onSave: (content: string) => Promise<void>
}) {
  const [content, setContent] = useState(skill.raw)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'editor' | 'history' | 'scan'>('editor')
  const [history, setHistory] = useState<SkillVersion[]>([])
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [scanning, setScanning] = useState(false)
  const [historyContent, setHistoryContent] = useState<string | null>(null)

  useEffect(() => {
    skillsApi.history(skill.name).then((h: unknown) => setHistory(h as SkillVersion[]))
  }, [skill.name])

  const handleScan = async () => {
    setScanning(true)
    const result = await scanApi.content(skill.name, content) as ScanResult
    setScanResult(result)
    setScanning(false)
    setActiveTab('scan')
  }

  const handleRestore = async (version: SkillVersion) => {
    if (!confirm('Restore this version? Current changes will be backed up.')) return
    await skillsApi.restore(skill.name, version.filePath)
    const v = await skillsApi.historyContent(skill.name, version.filePath) as { content: string }
    setContent(v.content)
    setActiveTab('editor')
  }

  const handleViewVersion = async (version: SkillVersion) => {
    const v = await skillsApi.historyContent(skill.name, version.filePath) as { content: string }
    setHistoryContent(v.content)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-stretch bg-black/70">
      <div className="flex-1 flex flex-col bg-zinc-950 max-w-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div>
            <h2 className="font-semibold text-zinc-100">Edit: {skill.name}</h2>
            <p className="text-xs text-zinc-500">{skill.filePath}</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-secondary text-xs" onClick={handleScan} disabled={scanning}>
              {scanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
              Scan
            </button>
            <button
              className="btn-primary text-xs"
              onClick={async () => {
                setSaving(true)
                await onSave(content)
                setSaving(false)
              }}
              disabled={saving}
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save
            </button>
            <button className="btn-ghost" onClick={onClose}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-3 border-b border-zinc-800">
          {(['editor', 'history', 'scan'] as const).map(tab => (
            <button
              key={tab}
              className={`px-3 py-1.5 text-sm font-medium rounded-t-lg capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-zinc-800 text-zinc-100 border-b-2 border-claw-500'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
              {tab === 'history' && history.length > 0 && (
                <span className="ml-1 text-xs text-zinc-500">({history.length})</span>
              )}
              {tab === 'scan' && scanResult && (
                <span className={`ml-1 text-xs ${
                  scanResult.trustScore === 'safe' ? 'text-green-400' :
                  scanResult.trustScore === 'review' ? 'text-yellow-400' : 'text-red-400'
                }`}>●</span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'editor' && (
            <SkillEditor value={content} onChange={setContent} />
          )}

          {activeTab === 'history' && (
            <div className="flex h-full">
              {/* Version list */}
              <div className="w-64 border-r border-zinc-800 overflow-y-auto">
                {history.length === 0 ? (
                  <div className="p-4 text-sm text-zinc-500">No version history yet. Save the skill to start tracking changes.</div>
                ) : (
                  history.map((v, i) => (
                    <div
                      key={i}
                      className="px-4 py-3 border-b border-zinc-800 hover:bg-zinc-800 cursor-pointer"
                      onClick={() => handleViewVersion(v)}
                    >
                      <div className="text-sm text-zinc-300">{v.label}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          className="text-xs text-claw-400 hover:text-claw-300 flex items-center gap-1"
                          onClick={e => { e.stopPropagation(); handleRestore(v) }}
                        >
                          <RotateCcw className="w-3 h-3" /> Restore
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {/* Version preview */}
              <div className="flex-1">
                {historyContent ? (
                  <SkillEditor value={historyContent} readOnly />
                ) : (
                  <div className="flex items-center justify-center h-full text-zinc-600 text-sm">
                    Click a version to preview
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'scan' && (
            <div className="overflow-y-auto p-6">
              {!scanResult ? (
                <div className="text-center text-zinc-500 py-8">
                  <Shield className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Click "Scan" to analyze this skill</p>
                </div>
              ) : (
                <div className="space-y-4 max-w-2xl">
                  <div className="flex items-center gap-3">
                    <TrustBadge score={scanResult.trustScore} />
                    <p className="text-sm text-zinc-300">{scanResult.summary}</p>
                  </div>
                  {scanResult.findings.length === 0 ? (
                    <div className="card p-4 text-center text-green-400 text-sm">
                      ✓ No security issues found
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {scanResult.findings.map((f, i) => (
                        <FindingCard key={i} finding={f} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function MySkillsPage() {
  const [skills, setSkills] = useState<ParsedSkill[]>([])
  const [scanResults, setScanResults] = useState<Record<string, ScanResult>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editingSkill, setEditingSkill] = useState<ParsedSkill | null>(null)
  const [conflicts, setConflicts] = useState<ConflictReport[]>([])
  const [scanning, setScanning] = useState(false)

  const loadSkills = useCallback(async () => {
    setLoading(true)
    const data = await skillsApi.list() as ParsedSkill[]
    setSkills(data)
    setLoading(false)
  }, [])

  const loadConflicts = useCallback(async () => {
    const data = await scanApi.conflicts() as { conflicts: ConflictReport[] }
    setConflicts(data.conflicts || [])
  }, [])

  useEffect(() => {
    loadSkills()
    loadConflicts()
  }, [loadSkills, loadConflicts])

  const handleScanAll = async () => {
    setScanning(true)
    const results: Record<string, ScanResult> = {}
    for (const skill of skills) {
      try {
        const r = await skillsApi.scan(skill.name) as ScanResult
        results[skill.name] = r
      } catch { /* skip */ }
    }
    setScanResults(results)
    setScanning(false)
  }

  const handleDelete = async (name: string) => {
    await skillsApi.delete(name)
    setSkills(s => s.filter(sk => sk.name !== name))
  }

  const handleDuplicate = async (name: string) => {
    const newName = prompt('New skill name:', `${name}-copy`)
    if (!newName) return
    await skillsApi.duplicate(name, newName)
    loadSkills()
  }

  const handleSave = async (filePath: string, content: string) => {
    await skillsApi.update(filePath, content)
    await loadSkills()
    setEditingSkill(null)
  }

  const filtered = skills.filter(
    s =>
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.frontmatter.description?.toLowerCase().includes(search.toLowerCase()) ||
      s.frontmatter.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="p-6">
      <PageHeader
        title="My Skills"
        subtitle={`${skills.length} skill${skills.length !== 1 ? 's' : ''} installed`}
        icon={<FolderOpen className="w-5 h-5" />}
        actions={
          <div className="flex items-center gap-2">
            <button
              className="btn-secondary text-sm"
              onClick={handleScanAll}
              disabled={scanning || skills.length === 0}
            >
              {scanning ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Shield className="w-4 h-4" />
              )}
              Scan All
            </button>
            <button className="btn-ghost" onClick={loadSkills}>
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        }
      />

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          className="input pl-9"
          placeholder="Search skills..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Conflicts */}
      {conflicts.length > 0 && (
        <div className="card p-4 mb-6 border-yellow-500/30 bg-yellow-900/10">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium text-yellow-400">
              {conflicts.length} conflict{conflicts.length > 1 ? 's' : ''} detected
            </span>
          </div>
          {conflicts.map((c, i) => (
            <div key={i} className="text-sm text-zinc-300 mb-2">
              <span className="font-medium text-yellow-300">{c.skill1}</span> vs{' '}
              <span className="font-medium text-yellow-300">{c.skill2}</span>: {c.explanation}
            </div>
          ))}
        </div>
      )}

      {/* Skills grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <LoadingSpinner text="Loading skills..." />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-sm">
            {search ? 'No skills match your search.' : 'No skills installed yet. Install from Templates or generate with AI.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(skill => (
            <SkillCard
              key={skill.name}
              skill={{ ...skill, scanResult: scanResults[skill.name] }}
              onEdit={() => setEditingSkill(skill)}
              onDelete={() => handleDelete(skill.name)}
              onDuplicate={() => handleDuplicate(skill.name)}
              onScan={async () => {
                const r = await skillsApi.scan(skill.name) as ScanResult
                setScanResults(prev => ({ ...prev, [skill.name]: r }))
              }}
            />
          ))}
        </div>
      )}

      {/* Edit modal */}
      {editingSkill && (
        <SkillEditModal
          skill={editingSkill}
          onClose={() => setEditingSkill(null)}
          onSave={content => handleSave(editingSkill.filePath, content)}
        />
      )}
    </div>
  )
}
