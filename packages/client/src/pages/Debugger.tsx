import { useState } from 'react'
import {
  Bug,
  Sparkles,
  PlayCircle,
  Loader2,
  Save,
  CheckCircle,
  ChevronRight,
  AlertCircle,
  Lightbulb,
} from 'lucide-react'
import SkillEditor from '../components/SkillEditor'
import PageHeader from '../components/PageHeader'
import { debugApi, skillsApi } from '../lib/api'
import type { DebugResult, ImproveResult, SimulateResult } from '../lib/types'

type Tab = 'debug' | 'improve' | 'simulate'

function DiffView({ original, improved }: { original: string; improved: string }) {
  const origLines = original.split('\n')
  const impLines = improved.split('\n')
  const maxLen = Math.max(origLines.length, impLines.length)
  const rows = Array.from({ length: maxLen }, (_, i) => ({
    orig: origLines[i] ?? '',
    imp: impLines[i] ?? '',
    changed: origLines[i] !== impLines[i],
  }))

  return (
    <div className="grid grid-cols-2 gap-0 text-xs font-mono overflow-auto max-h-96 rounded-lg border border-zinc-700">
      <div className="border-r border-zinc-700">
        <div className="px-3 py-1.5 bg-zinc-800 text-zinc-400 text-xs font-sans border-b border-zinc-700">Original</div>
        {rows.map((r, i) => (
          <div
            key={i}
            className={`px-3 py-0.5 ${r.changed && r.orig ? 'bg-red-900/20 text-red-300' : 'text-zinc-300'}`}
          >
            {r.orig || ' '}
          </div>
        ))}
      </div>
      <div>
        <div className="px-3 py-1.5 bg-zinc-800 text-zinc-400 text-xs font-sans border-b border-zinc-700">Improved</div>
        {rows.map((r, i) => (
          <div
            key={i}
            className={`px-3 py-0.5 ${r.changed && r.imp ? 'bg-green-900/20 text-green-300' : 'text-zinc-300'}`}
          >
            {r.imp || ' '}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DebuggerPage() {
  const [activeTab, setActiveTab] = useState<Tab>('debug')

  // Debug
  const [debugContent, setDebugContent] = useState('')
  const [debugProblem, setDebugProblem] = useState('')
  const [debugResult, setDebugResult] = useState<DebugResult | null>(null)
  const [debugging, setDebugging] = useState(false)

  // Improve
  const [improveContent, setImproveContent] = useState('')
  const [improveResult, setImproveResult] = useState<ImproveResult | null>(null)
  const [improving, setImproving] = useState(false)

  // Simulate
  const [simContent, setSimContent] = useState('')
  const [simInput, setSimInput] = useState('')
  const [simResult, setSimResult] = useState<SimulateResult | null>(null)
  const [simulating, setSimulating] = useState(false)

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleDebug = async () => {
    if (!debugContent.trim() || !debugProblem.trim()) return
    setDebugging(true)
    try {
      const result = await debugApi.fix(debugContent, debugProblem) as DebugResult
      setDebugResult(result)
    } catch (e: unknown) {
      alert((e as Error).message)
    }
    setDebugging(false)
  }

  const handleImprove = async () => {
    if (!improveContent.trim()) return
    setImproving(true)
    try {
      const result = await debugApi.improve(improveContent) as ImproveResult
      setImproveResult(result)
    } catch (e: unknown) {
      alert((e as Error).message)
    }
    setImproving(false)
  }

  const handleSimulate = async () => {
    if (!simContent.trim() || !simInput.trim()) return
    setSimulating(true)
    try {
      const result = await debugApi.simulate(simContent, simInput) as SimulateResult
      setSimResult(result)
    } catch (e: unknown) {
      alert((e as Error).message)
    }
    setSimulating(false)
  }

  const handleInstallFixed = async (content: string) => {
    setSaving(true)
    try {
      const nameMatch = content.match(/^name:\s*["']?([^"'\n]+)["']?/m)
      const name = nameMatch?.[1]?.trim() || 'fixed-skill'
      await skillsApi.create(name, content)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e: unknown) {
      alert((e as Error).message)
    }
    setSaving(false)
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Skill Debugger"
        subtitle="Debug, improve, and simulate your skills"
        icon={<Bug className="w-5 h-5" />}
      />

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-zinc-900 rounded-lg mb-6 w-fit">
        {([
          { id: 'debug', icon: Bug, label: 'Debugger' },
          { id: 'improve', icon: Sparkles, label: 'Improver' },
          { id: 'simulate', icon: PlayCircle, label: 'Dry Run' },
        ] as const).map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-md font-medium transition-all ${
              activeTab === id
                ? 'bg-zinc-700 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            onClick={() => setActiveTab(id)}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Debugger */}
      {activeTab === 'debug' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Paste your skill (SKILL.md)</label>
              <div className="h-72 monaco-container">
                <SkillEditor value={debugContent} onChange={setDebugContent} />
              </div>
            </div>
            <div>
              <label className="label">What's going wrong?</label>
              <textarea
                className="input h-72 resize-none"
                placeholder="Describe the problem:&#10;- The skill runs but never sends the WhatsApp message&#10;- The skill never triggers even when I ask for it&#10;- Gets stuck and never finishes"
                value={debugProblem}
                onChange={e => setDebugProblem(e.target.value)}
              />
            </div>
          </div>

          <button
            className="btn-primary"
            onClick={handleDebug}
            disabled={!debugContent.trim() || !debugProblem.trim() || debugging}
          >
            {debugging ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Diagnosing...</>
            ) : (
              <><Bug className="w-4 h-4" /> Debug Skill</>
            )}
          </button>

          {debugResult && (
            <div className="space-y-4">
              <div className="card p-4">
                <div className="flex items-start gap-3 mb-3">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-zinc-100">Diagnosis</h3>
                    <p className="text-sm text-zinc-300 mt-1">{debugResult.diagnosis}</p>
                  </div>
                </div>
                <div className="border-t border-zinc-800 pt-3">
                  <span className="text-xs text-zinc-500">Root cause: </span>
                  <span className="text-xs text-zinc-300">{debugResult.rootCause}</span>
                </div>
              </div>

              <div className="card p-4">
                <h3 className="font-medium text-zinc-100 mb-3">Changes Made</h3>
                <ul className="space-y-1">
                  {debugResult.changes.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                      <ChevronRight className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-zinc-100">Fixed Skill</h3>
                  <button
                    className="btn-primary text-xs"
                    onClick={() => handleInstallFixed(debugResult.fixedSkill)}
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <CheckCircle className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                    {saved ? 'Installed!' : 'Install Fixed Skill'}
                  </button>
                </div>
                <div className="h-72 monaco-container">
                  <SkillEditor value={debugResult.fixedSkill} readOnly />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Improver */}
      {activeTab === 'improve' && (
        <div className="space-y-4">
          <div>
            <label className="label">Paste a skill to improve</label>
            <div className="h-72 monaco-container">
              <SkillEditor value={improveContent} onChange={setImproveContent} />
            </div>
          </div>

          <button
            className="btn-primary"
            onClick={handleImprove}
            disabled={!improveContent.trim() || improving}
          >
            {improving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Improving...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Improve Skill</>
            )}
          </button>

          {improveResult && (
            <div className="space-y-4">
              <div className="card p-4">
                <p className="text-sm text-zinc-300">{improveResult.summary}</p>
              </div>

              <div className="card p-4">
                <h3 className="font-medium text-zinc-100 mb-3">Changes ({improveResult.changes.length})</h3>
                <div className="space-y-3">
                  {improveResult.changes.map((c, i) => (
                    <div key={i} className="text-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`badge ${
                          c.type === 'security' ? 'badge-dangerous' :
                          c.type === 'fix' ? 'badge-review' : 'badge-safe'
                        }`}>{c.type}</span>
                        <span className="text-zinc-300">{c.description}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-zinc-100">Side-by-Side Diff</h3>
                </div>
                <DiffView original={improveContent} improved={improveResult.improvedSkill} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-zinc-100">Improved Skill</h3>
                  <button
                    className="btn-primary text-xs"
                    onClick={() => handleInstallFixed(improveResult.improvedSkill)}
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Install Improved Skill
                  </button>
                </div>
                <div className="h-64 monaco-container">
                  <SkillEditor value={improveResult.improvedSkill} readOnly />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Simulator */}
      {activeTab === 'simulate' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Skill (SKILL.md)</label>
              <div className="h-72 monaco-container">
                <SkillEditor value={simContent} onChange={setSimContent} />
              </div>
            </div>
            <div>
              <label className="label">Sample Input</label>
              <textarea
                className="input h-72 resize-none"
                placeholder="Paste sample data the skill would process:&#10;- For an email skill: paste a sample email&#10;- For a meeting notes skill: paste sample notes&#10;- For a code review skill: paste a code snippet"
                value={simInput}
                onChange={e => setSimInput(e.target.value)}
              />
            </div>
          </div>

          <button
            className="btn-primary"
            onClick={handleSimulate}
            disabled={!simContent.trim() || !simInput.trim() || simulating}
          >
            {simulating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Simulating...</>
            ) : (
              <><PlayCircle className="w-4 h-4" /> Run Simulation</>
            )}
          </button>

          {simResult && (
            <div className="space-y-4">
              {/* Step trace */}
              <div className="card p-4">
                <h3 className="font-medium text-zinc-100 mb-3">Execution Trace</h3>
                <div className="space-y-3">
                  {simResult.steps.map((step, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs text-zinc-400 shrink-0 mt-0.5">
                        {step.step}
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-zinc-500 mb-0.5">{step.instruction}</div>
                        <div className="text-sm text-zinc-200">{step.action}</div>
                        {step.toolCall && (
                          <div className="text-xs text-claw-400 font-mono mt-0.5">→ {step.toolCall}</div>
                        )}
                        {step.issues.length > 0 && (
                          <div className="mt-1 flex items-center gap-1 text-xs text-yellow-400">
                            <AlertCircle className="w-3 h-3" />
                            {step.issues.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Final output */}
              <div className="card p-4">
                <h3 className="font-medium text-zinc-100 mb-2">Final Output</h3>
                <pre className="text-sm text-zinc-300 whitespace-pre-wrap font-mono bg-zinc-800 rounded-lg p-3">
                  {simResult.finalOutput}
                </pre>
              </div>

              {/* Issues & suggestions */}
              {(simResult.issues.length > 0 || simResult.suggestions.length > 0) && (
                <div className="grid grid-cols-2 gap-4">
                  {simResult.issues.length > 0 && (
                    <div className="card p-4">
                      <h3 className="font-medium text-red-400 mb-2 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> Issues Found
                      </h3>
                      <ul className="space-y-1">
                        {simResult.issues.map((issue, i) => (
                          <li key={i} className="text-sm text-zinc-300">• {issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {simResult.suggestions.length > 0 && (
                    <div className="card p-4">
                      <h3 className="font-medium text-claw-400 mb-2 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4" /> Suggestions
                      </h3>
                      <ul className="space-y-1">
                        {simResult.suggestions.map((s, i) => (
                          <li key={i} className="text-sm text-zinc-300">• {s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
