import { useState, useEffect, useRef, useCallback } from 'react'
import {
  GitBranch,
  Plus,
  Trash2,
  Save,
  Loader2,
  Wand2,
  X,
  Play,
  Zap,
  Filter,
  Box,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import { composerApi } from '../lib/api'
import type { ComposerCanvas, ComposerNode, ComposerEdge } from '../lib/types'

const NODE_COLORS: Record<ComposerNode['type'], string> = {
  trigger: 'bg-yellow-900/40 border-yellow-700 text-yellow-300',
  skill: 'bg-claw-900/40 border-claw-700 text-claw-300',
  condition: 'bg-blue-900/40 border-blue-700 text-blue-300',
  output: 'bg-green-900/40 border-green-700 text-green-300',
}

const NODE_ICONS: Record<ComposerNode['type'], typeof Zap> = {
  trigger: Zap,
  skill: Box,
  condition: Filter,
  output: Play,
}

function CanvasNode({
  node,
  selected,
  onSelect,
  onMove,
  onDelete,
}: {
  node: ComposerNode
  selected: boolean
  onSelect: () => void
  onMove: (dx: number, dy: number) => void
  onDelete: () => void
}) {
  const dragStart = useRef<{ x: number; y: number } | null>(null)
  const Icon = NODE_ICONS[node.type]

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect()
    dragStart.current = { x: e.clientX, y: e.clientY }

    const handleMouseMove = (me: MouseEvent) => {
      if (!dragStart.current) return
      onMove(me.clientX - dragStart.current.x, me.clientY - dragStart.current.y)
      dragStart.current = { x: me.clientX, y: me.clientY }
    }

    const handleMouseUp = () => {
      dragStart.current = null
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <div
      className={`absolute select-none cursor-grab active:cursor-grabbing
        border rounded-xl p-3 min-w-[140px] transition-shadow
        ${NODE_COLORS[node.type]}
        ${selected ? 'shadow-lg shadow-claw-500/20 ring-2 ring-claw-500/50' : 'hover:shadow-md'}
      `}
      style={{ left: node.x, top: node.y }}
      onMouseDown={handleMouseDown}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-3.5 h-3.5 shrink-0" />
        <span className="text-xs font-semibold truncate">{node.label}</span>
        {selected && (
          <button
            className="ml-auto text-red-400 hover:text-red-300"
            onClick={e => { e.stopPropagation(); onDelete() }}
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
      <div className="text-xs opacity-60 truncate">{node.skillName}</div>
      <span className={`text-xs px-1.5 py-0.5 rounded bg-black/20 mt-1 inline-block`}>
        {node.type}
      </span>
    </div>
  )
}

function CanvasEdge({
  edge,
  nodes,
}: {
  edge: ComposerEdge
  nodes: ComposerNode[]
}) {
  const source = nodes.find(n => n.id === edge.source)
  const target = nodes.find(n => n.id === edge.target)
  if (!source || !target) return null

  const x1 = source.x + 70
  const y1 = source.y + 35
  const x2 = target.x + 70
  const y2 = target.y + 35

  const midX = (x1 + x2) / 2
  const midY = (y1 + y2) / 2

  return (
    <g>
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke="#6d28d9" strokeWidth="1.5"
        strokeDasharray="4 2" opacity="0.6"
        markerEnd="url(#arrow)"
      />
      {edge.label && (
        <text x={midX} y={midY - 6} textAnchor="middle" className="fill-zinc-400" fontSize="10">
          {edge.label}
        </text>
      )}
    </g>
  )
}

export default function ComposerPage() {
  const [canvases, setCanvases] = useState<ComposerCanvas[]>([])
  const [activeCanvas, setActiveCanvas] = useState<ComposerCanvas | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [generateDesc, setGenerateDesc] = useState('')
  const [showGenerateModal, setShowGenerateModal] = useState(false)

  useEffect(() => {
    composerApi.list().then((c: unknown) => {
      setCanvases(c as ComposerCanvas[])
      setLoading(false)
    })
  }, [])

  const handleNewCanvas = () => {
    const canvas: ComposerCanvas = {
      id: `canvas-${Date.now()}`,
      name: 'New Workflow',
      description: '',
      nodes: [],
      edges: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setActiveCanvas(canvas)
    setSelectedNodeId(null)
  }

  const handleSave = async () => {
    if (!activeCanvas) return
    setSaving(true)
    const saved = await composerApi.save(activeCanvas) as ComposerCanvas
    setActiveCanvas(saved)
    setCanvases(c => {
      const idx = c.findIndex(x => x.id === saved.id)
      return idx >= 0 ? [...c.slice(0, idx), saved, ...c.slice(idx + 1)] : [...c, saved]
    })
    setSaving(false)
  }

  const handleGenerate = async () => {
    if (!generateDesc.trim()) return
    setGenerating(true)
    try {
      const result = await composerApi.generate(generateDesc) as { canvas: ComposerCanvas; installedSkills: string[] }
      setActiveCanvas(result.canvas)
      setCanvases(c => [...c, result.canvas])
      setShowGenerateModal(false)
      if (result.installedSkills.length > 0) {
        alert(`Generated workflow with ${result.installedSkills.length} skills installed!`)
      }
    } catch (e: unknown) {
      alert((e as Error).message)
    }
    setGenerating(false)
  }

  const handleMoveNode = useCallback((id: string, dx: number, dy: number) => {
    setActiveCanvas(canvas => {
      if (!canvas) return canvas
      return {
        ...canvas,
        nodes: canvas.nodes.map(n =>
          n.id === id ? { ...n, x: n.x + dx, y: n.y + dy } : n
        ),
      }
    })
  }, [])

  const handleDeleteNode = (id: string) => {
    setActiveCanvas(canvas => {
      if (!canvas) return canvas
      return {
        ...canvas,
        nodes: canvas.nodes.filter(n => n.id !== id),
        edges: canvas.edges.filter(e => e.source !== id && e.target !== id),
      }
    })
    setSelectedNodeId(null)
  }

  const handleAddNode = (type: ComposerNode['type']) => {
    if (!activeCanvas) return
    const id = `node-${Date.now()}`
    const node: ComposerNode = {
      id,
      skillName: type === 'trigger' ? 'trigger' : 'new-skill',
      label: type === 'trigger' ? 'Trigger' : type === 'output' ? 'Output' : 'New Skill',
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      type,
      config: {},
    }
    setActiveCanvas(c => c ? { ...c, nodes: [...c.nodes, node] } : c)
    setSelectedNodeId(id)
  }

  const handleDeleteCanvas = async (id: string) => {
    if (!confirm('Delete this workflow?')) return
    await composerApi.delete(id)
    setCanvases(c => c.filter(x => x.id !== id))
    if (activeCanvas?.id === id) setActiveCanvas(null)
  }

  return (
    <div className="p-6 h-full flex flex-col">
      <PageHeader
        title="Multi-Skill Composer"
        subtitle="Visual canvas to chain skills together into workflows"
        icon={<GitBranch className="w-5 h-5" />}
        actions={
          <div className="flex items-center gap-2">
            <button className="btn-secondary text-sm" onClick={() => setShowGenerateModal(true)}>
              <Wand2 className="w-4 h-4" /> AI Generate
            </button>
            <button className="btn-secondary text-sm" onClick={handleNewCanvas}>
              <Plus className="w-4 h-4" /> New Canvas
            </button>
          </div>
        }
      />

      <div className="flex gap-4 flex-1 overflow-hidden min-h-0">
        {/* Sidebar */}
        <div className="w-56 shrink-0 flex flex-col gap-2 overflow-y-auto">
          <div className="text-xs text-zinc-500 uppercase tracking-wide px-1">Workflows</div>
          {loading ? (
            <LoadingSpinner size="sm" />
          ) : canvases.length === 0 ? (
            <p className="text-xs text-zinc-500 px-1">No workflows yet. Create one!</p>
          ) : (
            canvases.map(c => (
              <div
                key={c.id}
                className={`card p-3 cursor-pointer hover:border-zinc-600 transition-all group ${
                  activeCanvas?.id === c.id ? 'border-claw-500/50 bg-claw-900/10' : ''
                }`}
                onClick={() => setActiveCanvas(c)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-200 truncate">{c.name}</span>
                  <button
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
                    onClick={e => { e.stopPropagation(); handleDeleteCanvas(c.id) }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-xs text-zinc-500 mt-0.5">
                  {c.nodes.length} nodes · {c.edges.length} connections
                </div>
              </div>
            ))
          )}
        </div>

        {/* Canvas area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!activeCanvas ? (
            <div className="flex items-center justify-center h-full text-zinc-600">
              <div className="text-center">
                <GitBranch className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-sm">Select a workflow or create a new one</p>
                <div className="flex items-center gap-2 mt-4 justify-center">
                  <button className="btn-secondary text-sm" onClick={handleNewCanvas}>
                    <Plus className="w-4 h-4" /> New Canvas
                  </button>
                  <button className="btn-primary text-sm" onClick={() => setShowGenerateModal(true)}>
                    <Wand2 className="w-4 h-4" /> Generate with AI
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Canvas toolbar */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <input
                  className="input text-sm h-8 w-48"
                  value={activeCanvas.name}
                  onChange={e => setActiveCanvas(c => c ? { ...c, name: e.target.value } : c)}
                  placeholder="Workflow name"
                />
                <div className="flex gap-1">
                  {(['trigger', 'skill', 'condition', 'output'] as const).map(type => {
                    const Icon = NODE_ICONS[type]
                    return (
                      <button
                        key={type}
                        className="btn-ghost text-xs capitalize"
                        onClick={() => handleAddNode(type)}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {type}
                      </button>
                    )
                  })}
                </div>
                <button
                  className="btn-primary text-sm ml-auto"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save
                </button>
              </div>

              {/* Canvas */}
              <div
                className="flex-1 composer-canvas rounded-xl border border-zinc-800 relative overflow-hidden"
                onClick={() => setSelectedNodeId(null)}
              >
                {activeCanvas.nodes.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-zinc-600 pointer-events-none">
                    <div className="text-center">
                      <p className="text-sm">Add nodes using the toolbar above</p>
                      <p className="text-xs mt-1">or use AI Generate to create a workflow automatically</p>
                    </div>
                  </div>
                )}

                {/* SVG edges */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <defs>
                    <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                      <path d="M0,0 L0,6 L6,3 z" fill="#6d28d9" />
                    </marker>
                  </defs>
                  {activeCanvas.edges.map(edge => (
                    <CanvasEdge key={edge.id} edge={edge} nodes={activeCanvas.nodes} />
                  ))}
                </svg>

                {/* Nodes */}
                {activeCanvas.nodes.map(node => (
                  <CanvasNode
                    key={node.id}
                    node={node}
                    selected={selectedNodeId === node.id}
                    onSelect={() => setSelectedNodeId(node.id)}
                    onMove={(dx, dy) => handleMoveNode(node.id, dx, dy)}
                    onDelete={() => handleDeleteNode(node.id)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Generate modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 w-full max-w-md">
            <h2 className="font-semibold text-zinc-100 mb-4">Generate Workflow with AI</h2>
            <textarea
              className="input h-28 resize-none mb-4"
              placeholder="Describe the workflow: e.g. Every morning, check emails for urgent items, summarize them, send to Slack, and create calendar reminders for any meetings mentioned"
              value={generateDesc}
              onChange={e => setGenerateDesc(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button className="btn-ghost" onClick={() => setShowGenerateModal(false)}>Cancel</button>
              <button
                className="btn-primary"
                onClick={handleGenerate}
                disabled={!generateDesc.trim() || generating}
              >
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                Generate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
