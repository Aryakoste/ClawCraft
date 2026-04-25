import { useState, useEffect } from 'react'
import {
  Settings,
  Key,
  FolderOpen,
  Cpu,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  EyeOff,
  Moon,
  Sun,
  Shield,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import { configApi } from '../lib/api'
import type { ClawcraftConfig } from '../lib/types'

const PROVIDERS = [
  { id: 'anthropic', label: 'Anthropic (Claude)', desc: 'claude-sonnet-4-6, claude-opus-4-6' },
  { id: 'openai', label: 'OpenAI', desc: 'GPT-4o, GPT-4o mini, GPT-3.5' },
  { id: 'ollama', label: 'Ollama (Local / Free)', desc: 'Llama 3, Mistral, Phi3 running on your machine' },
  { id: 'openai-compat', label: 'OpenAI-Compatible Endpoint', desc: 'LM Studio, Together.ai, Groq, etc.' },
  { id: 'openclaw', label: 'OpenClaw LLM', desc: "Use the LLM already configured in OpenClaw" },
]

const ANTHROPIC_MODELS = ['claude-sonnet-4-6', 'claude-opus-4-6', 'claude-haiku-4-5-20251001']
const OPENAI_MODELS = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo']
const OLLAMA_MODELS = ['llama3.2', 'llama3.1', 'mistral', 'phi3', 'qwen2.5', 'deepseek-r1', 'codellama']

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-6 space-y-4">
      <h2 className="font-semibold text-zinc-100 text-base border-b border-zinc-800 pb-3">{title}</h2>
      {children}
    </div>
  )
}

export default function SettingsPage() {
  const [config, setConfig] = useState<ClawcraftConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null)
  const [showApiKey, setShowApiKey] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [pathStatus, setPathStatus] = useState<{ exists: boolean; isDefault: boolean } | null>(null)

  useEffect(() => {
    Promise.all([
      configApi.get() as Promise<ClawcraftConfig>,
      configApi.checkPath() as Promise<{ exists: boolean; isDefault: boolean }>,
    ]).then(([cfg, path]) => {
      setConfig(cfg)
      setPathStatus(path)
      setLoading(false)
    })
  }, [])

  const handleSave = async (updates: Partial<ClawcraftConfig>) => {
    if (!config) return
    setSaving(true)
    const payload: Record<string, unknown> = { ...updates }
    if (apiKeyInput) payload.apiKey = apiKeyInput
    const updated = await configApi.update(payload) as ClawcraftConfig
    setConfig(updated)
    setApiKeyInput('')
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setSaving(false)
  }

  const handleTestLLM = async () => {
    if (apiKeyInput) {
      // Save key first
      await configApi.update({ apiKey: apiKeyInput })
      setApiKeyInput('')
    }
    setTesting(true)
    setTestResult(null)
    try {
      const r = await configApi.testLLM() as { success: boolean; message: string; model: string }
      setTestResult({ success: r.success, message: `${r.message} (${r.model})` })
    } catch (e: unknown) {
      setTestResult({ success: false, error: (e as Error).message })
    }
    setTesting(false)
  }

  const handleCheckPath = async () => {
    const r = await configApi.checkPath() as { exists: boolean; isDefault: boolean }
    setPathStatus(r)
  }

  const modelsForProvider = (provider: string) => {
    if (provider === 'anthropic') return ANTHROPIC_MODELS
    if (provider === 'openai') return OPENAI_MODELS
    if (provider === 'ollama') return OLLAMA_MODELS
    return []
  }

  if (loading || !config) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <LoadingSpinner text="Loading settings..." />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Configure Clawcraft to your setup"
        icon={<Settings className="w-5 h-5" />}
      />

      {/* OpenClaw Path */}
      <Section title="OpenClaw Skills Path">
        <div>
          <label className="label">Skills directory</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                className="input pl-9"
                value={config.openclawSkillsPath}
                onChange={e => setConfig(c => c ? { ...c, openclawSkillsPath: e.target.value } : c)}
              />
            </div>
            <button className="btn-secondary text-sm" onClick={handleCheckPath}>
              Check
            </button>
          </div>
          {pathStatus && (
            <div className={`flex items-center gap-2 text-sm mt-2 ${pathStatus.exists ? 'text-green-400' : 'text-red-400'}`}>
              {pathStatus.exists ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              {pathStatus.exists ? 'Path found and accessible' : 'Path not found — OpenClaw may not be installed here'}
            </div>
          )}
          <p className="text-xs text-zinc-500 mt-2">
            Default: ~/.openclaw/skills/ — Change only if OpenClaw is installed elsewhere.
          </p>
        </div>
      </Section>

      {/* LLM Provider */}
      <Section title="AI / LLM Configuration">
        <div>
          <label className="label">Provider</label>
          <div className="space-y-2">
            {PROVIDERS.map(p => (
              <label
                key={p.id}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  config.llmProvider === p.id
                    ? 'border-claw-500/50 bg-claw-900/10'
                    : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <input
                  type="radio"
                  name="provider"
                  value={p.id}
                  checked={config.llmProvider === p.id}
                  onChange={() => setConfig(c => c ? { ...c, llmProvider: p.id as ClawcraftConfig['llmProvider'], model: modelsForProvider(p.id)[0] ?? '' } : c)}
                  className="mt-0.5 accent-claw-500"
                />
                <div>
                  <div className="text-sm font-medium text-zinc-200">{p.label}</div>
                  <div className="text-xs text-zinc-500">{p.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* API Key */}
        {config.llmProvider !== 'ollama' && config.llmProvider !== 'openclaw' && (
          <div>
            <label className="label">
              {config.llmProvider === 'anthropic' ? 'Anthropic API Key' :
               config.llmProvider === 'openai' ? 'OpenAI API Key' : 'API Key'}
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type={showApiKey ? 'text' : 'password'}
                className="input pl-9 pr-10"
                placeholder={config.hasApiKey ? '••••••••••••' + '(set)' : 'Enter API key...'}
                value={apiKeyInput}
                onChange={e => setApiKeyInput(e.target.value)}
              />
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                onClick={() => setShowApiKey(v => !v)}
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Stored locally in ~/.clawcraft/config.json. Never sent to any server we control.
            </p>
          </div>
        )}

        {/* Base URL for compat providers */}
        {(config.llmProvider === 'openai-compat' || config.llmProvider === 'openclaw') && (
          <div>
            <label className="label">Base URL</label>
            <input
              className="input font-mono text-sm"
              placeholder={
                config.llmProvider === 'openclaw'
                  ? 'http://localhost:3001/v1'
                  : 'https://api.your-provider.com/v1'
              }
              value={config.baseUrl ?? ''}
              onChange={e => setConfig(c => c ? { ...c, baseUrl: e.target.value } : c)}
            />
          </div>
        )}

        {/* Model selection */}
        {modelsForProvider(config.llmProvider).length > 0 && (
          <div>
            <label className="label">Model</label>
            <select
              className="input"
              value={config.model}
              onChange={e => setConfig(c => c ? { ...c, model: e.target.value } : c)}
            >
              {modelsForProvider(config.llmProvider).map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        )}

        {config.llmProvider === 'openai-compat' && (
          <div>
            <label className="label">Model name</label>
            <input
              className="input"
              placeholder="e.g. mixtral-8x7b, llama-3-70b"
              value={config.model}
              onChange={e => setConfig(c => c ? { ...c, model: e.target.value } : c)}
            />
          </div>
        )}

        {/* Test connection */}
        <div className="flex items-center gap-3">
          <button
            className="btn-secondary text-sm"
            onClick={handleTestLLM}
            disabled={testing}
          >
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}
            Test Connection
          </button>
          {testResult && (
            <div className={`flex items-center gap-2 text-sm ${testResult.success ? 'text-green-400' : 'text-red-400'}`}>
              {testResult.success ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              {testResult.success ? testResult.message : testResult.error}
            </div>
          )}
        </div>
      </Section>

      {/* Appearance */}
      <Section title="Appearance & Server">
        <div>
          <label className="label">Theme</label>
          <div className="flex gap-2">
            {(['dark', 'light'] as const).map(t => (
              <button
                key={t}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-all ${
                  config.theme === t
                    ? 'border-claw-500 bg-claw-900/20 text-claw-300'
                    : 'border-zinc-700 text-zinc-400 hover:border-zinc-600'
                }`}
                onClick={() => setConfig(c => c ? { ...c, theme: t } : c)}
              >
                {t === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Server port</label>
          <input
            className="input w-32"
            type="number"
            value={config.port}
            onChange={e => setConfig(c => c ? { ...c, port: parseInt(e.target.value) || 4000 } : c)}
          />
          <p className="text-xs text-zinc-500 mt-1">Changes take effect on next restart.</p>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-zinc-200">Auto-scan on startup</div>
            <div className="text-xs text-zinc-500">Run security scan when My Skills page loads</div>
          </div>
          <button
            className={`w-10 h-6 rounded-full transition-colors relative ${config.autoScan ? 'bg-claw-600' : 'bg-zinc-700'}`}
            onClick={() => setConfig(c => c ? { ...c, autoScan: !c.autoScan } : c)}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${config.autoScan ? 'translate-x-5' : 'translate-x-1'}`} />
          </button>
        </div>
      </Section>

      {/* Save button */}
      <div className="flex items-center gap-3">
        <button
          className="btn-primary"
          onClick={() => handleSave(config)}
          disabled={saving}
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <Settings className="w-4 h-4" />
          )}
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>

      {/* Info */}
      <div className="text-xs text-zinc-600 space-y-1">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5" />
          Config stored at ~/.clawcraft/config.json — no telemetry, no cloud sync.
        </div>
      </div>
    </div>
  )
}
