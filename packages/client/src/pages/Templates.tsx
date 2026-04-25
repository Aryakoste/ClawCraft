import { useState, useEffect } from 'react'
import {
  LayoutGrid,
  Search,
  Filter,
  Download,
  Eye,
  X,
  Loader2,
  CheckCircle,
  Shield,
} from 'lucide-react'
import SkillEditor from '../components/SkillEditor'
import TrustBadge from '../components/TrustBadge'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import { templatesApi } from '../lib/api'
import type { Template, ScanResult } from '../lib/types'

const CATEGORY_EMOJI: Record<string, string> = {
  Productivity: '⚡',
  Developer: '👨‍💻',
  'Smart Home': '🏠',
  Business: '💼',
  Personal: '🧘',
}

function TemplateCard({
  template,
  onPreview,
  onInstall,
  installing,
  installed,
}: {
  template: Template
  onPreview: () => void
  onInstall: () => void
  installing: boolean
  installed: boolean
}) {
  return (
    <div className="card p-4 hover:border-zinc-600 transition-all flex flex-col">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <h3 className="font-medium text-zinc-100 text-sm truncate">{template.title}</h3>
          <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">{template.description}</p>
        </div>
        <span className="text-lg shrink-0" title={template.category}>
          {CATEGORY_EMOJI[template.category] ?? '📦'}
        </span>
      </div>

      <div className="flex flex-wrap gap-1 mb-3">
        {template.permissions.slice(0, 4).map(p => (
          <span key={p} className="badge bg-zinc-800 text-zinc-400 text-xs">{p.replace('_', ' ')}</span>
        ))}
      </div>

      <div className="flex items-center gap-1 mt-auto">
        <button className="btn-ghost text-xs" onClick={onPreview}>
          <Eye className="w-3.5 h-3.5" /> Preview
        </button>
        <button
          className="btn-primary text-xs ml-auto"
          onClick={onInstall}
          disabled={installing || installed}
        >
          {installing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : installed ? (
            <CheckCircle className="w-3.5 h-3.5" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          {installed ? 'Installed' : 'Install'}
        </button>
      </div>
    </div>
  )
}

function TemplatePreviewModal({
  template,
  onClose,
  onInstall,
}: {
  template: Template
  onClose: () => void
  onInstall: () => Promise<void>
}) {
  const [fullTemplate, setFullTemplate] = useState<Template | null>(null)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [scanning, setScanning] = useState(false)
  const [installing, setInstalling] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    templatesApi.get(template.id).then(t => setFullTemplate(t as Template))
  }, [template.id])

  const handleScan = async () => {
    setScanning(true)
    const r = await templatesApi.scan(template.id) as ScanResult
    setScanResult(r)
    setScanning(false)
  }

  const handleInstall = async () => {
    setInstalling(true)
    await onInstall()
    setInstalled(true)
    setInstalling(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div>
            <h2 className="font-semibold text-zinc-100">{template.title}</h2>
            <p className="text-xs text-zinc-500">{template.description}</p>
          </div>
          <div className="flex items-center gap-2">
            {scanResult && <TrustBadge score={scanResult.trustScore} size="sm" />}
            <button className="btn-secondary text-xs" onClick={handleScan} disabled={scanning}>
              {scanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
              Verify
            </button>
            <button
              className="btn-primary text-xs"
              onClick={handleInstall}
              disabled={installing || installed}
            >
              {installing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : installed ? (
                <CheckCircle className="w-3.5 h-3.5" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              {installed ? 'Installed!' : 'Install'}
            </button>
            <button className="btn-ghost" onClick={onClose}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {fullTemplate?.content ? (
            <SkillEditor value={fullTemplate.content} readOnly />
          ) : (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner text="Loading template..." />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [previewing, setPreviewing] = useState<Template | null>(null)
  const [installed, setInstalled] = useState<Set<string>>(new Set())
  const [installing, setInstalling] = useState<Set<string>>(new Set())

  useEffect(() => {
    Promise.all([
      templatesApi.list() as Promise<Template[]>,
      templatesApi.categories() as Promise<string[]>,
    ]).then(([t, c]) => {
      setTemplates(t)
      setCategories(c)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    const timer = setTimeout(async () => {
      const data = await templatesApi.list({ category: category || undefined, search: search || undefined }) as Template[]
      setTemplates(data)
    }, 300)
    return () => clearTimeout(timer)
  }, [search, category])

  const handleInstall = async (id: string) => {
    setInstalling(s => new Set([...s, id]))
    try {
      await templatesApi.install(id)
      setInstalled(s => new Set([...s, id]))
    } catch (e: unknown) {
      alert((e as Error).message)
    }
    setInstalling(s => { const n = new Set(s); n.delete(id); return n })
  }

  const groupedTemplates = categories.reduce(
    (acc, cat) => {
      if (category && cat !== category) return acc
      const catTemplates = templates.filter(t => t.category === cat)
      if (catTemplates.length > 0) acc[cat] = catTemplates
      return acc
    },
    {} as Record<string, Template[]>
  )

  return (
    <div className="p-6">
      <PageHeader
        title="Templates Gallery"
        subtitle={`${templates.length} pre-built, security-verified skills`}
        icon={<LayoutGrid className="w-5 h-5" />}
      />

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            className="input pl-9"
            placeholder="Search templates..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-1">
          <button
            className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${
              !category
                ? 'bg-zinc-700 border-zinc-600 text-zinc-100'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600'
            }`}
            onClick={() => setCategory('')}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${
                category === cat
                  ? 'bg-zinc-700 border-zinc-600 text-zinc-100'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600'
              }`}
              onClick={() => setCategory(category === cat ? '' : cat)}
            >
              {CATEGORY_EMOJI[cat]} {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <LoadingSpinner text="Loading templates..." />
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedTemplates).map(([cat, catTemplates]) => (
            <div key={cat}>
              <h2 className="text-base font-semibold text-zinc-300 mb-3 flex items-center gap-2">
                <span>{CATEGORY_EMOJI[cat]}</span>
                {cat}
                <span className="text-zinc-500 font-normal text-sm">{catTemplates.length} templates</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
                {catTemplates.map(t => (
                  <TemplateCard
                    key={t.id}
                    template={t}
                    onPreview={() => setPreviewing(t)}
                    onInstall={() => handleInstall(t.id)}
                    installing={installing.has(t.id)}
                    installed={installed.has(t.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {previewing && (
        <TemplatePreviewModal
          template={previewing}
          onClose={() => setPreviewing(null)}
          onInstall={() => handleInstall(previewing.id)}
        />
      )}
    </div>
  )
}
