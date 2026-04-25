import { useState, useRef, useEffect } from 'react'
import {
  Wand2,
  Send,
  MessageSquare,
  FormInput,
  Sunrise,
  Download,
  Save,
  Copy,
  Loader2,
  ChevronDown,
} from 'lucide-react'
import SkillEditor from '../components/SkillEditor'
import PageHeader from '../components/PageHeader'
import { generateApi, skillsApi } from '../lib/api'

type Mode = 'form' | 'chat' | 'day'

const PERMISSIONS = [
  { id: 'read_email', label: 'Read email', risk: 'medium', desc: 'Can read but not send your emails' },
  { id: 'write_email', label: 'Send email', risk: 'medium', desc: 'Can compose and send emails on your behalf' },
  { id: 'read_calendar', label: 'Read calendar', risk: 'low', desc: 'Can read your calendar events' },
  { id: 'write_files', label: 'Write files', risk: 'medium', desc: 'Can create and modify files on your computer' },
  { id: 'read_files', label: 'Read files', risk: 'low', desc: 'Can read but not modify your files' },
  { id: 'execute', label: 'Execute commands', risk: 'high', desc: 'Can run any terminal command — use with care' },
  { id: 'browse_web', label: 'Browse web', risk: 'medium', desc: 'Can access websites on your behalf' },
  { id: 'send_messages', label: 'Send messages', risk: 'medium', desc: 'Can send messages through your connected channels' },
]

const CHANNELS = ['WhatsApp', 'Telegram', 'Slack', 'Discord']
const TRIGGERS = [
  { id: 'slash', label: 'Slash command — user types /skillname' },
  { id: 'scheduled', label: 'Scheduled — runs automatically on a cron schedule' },
  { id: 'always', label: 'Always available — model decides when to use it' },
]
const OUTPUT_FORMATS = [
  'Bullet points',
  'Numbered list',
  'Paragraph summary',
  'Table',
  'JSON',
  'Raw text',
]

const RISK_COLORS: Record<string, string> = {
  low: 'text-green-400',
  medium: 'text-yellow-400',
  high: 'text-red-400',
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export default function GeneratorPage() {
  const [mode, setMode] = useState<Mode>('form')

  // Form state
  const [description, setDescription] = useState('')
  const [triggerType, setTriggerType] = useState('slash')
  const [schedule, setSchedule] = useState('0 8 * * *')
  const [permissions, setPermissions] = useState<string[]>([])
  const [channels, setChannels] = useState<string[]>([])
  const [outputFormat, setOutputFormat] = useState('Bullet points')
  const [generatedSkill, setGeneratedSkill] = useState('')
  const [generating, setGenerating] = useState(false)

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatGenerating, setChatGenerating] = useState(false)
  const [chatSkill, setChatSkill] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Day mode
  const [dayDescription, setDayDescription] = useState('')
  const [daySkills, setDaySkills] = useState<Array<{ name: string; title: string; content: string }>>([])
  const [dayGenerating, setDayGenerating] = useState(false)
  const [selectedDaySkill, setSelectedDaySkill] = useState(0)

  // Shared
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const togglePermission = (id: string) => {
    setPermissions(p =>
      p.includes(id) ? p.filter(x => x !== id) : [...p, id]
    )
  }

  const toggleChannel = (ch: string) => {
    setChannels(c =>
      c.includes(ch) ? c.filter(x => x !== ch) : [...c, ch]
    )
  }

  const handleGenerate = async () => {
    if (!description.trim()) return
    setGenerating(true)
    setGeneratedSkill('')
    try {
      const res = await generateApi.fromForm({
        description,
        triggerType,
        schedule: triggerType === 'scheduled' ? schedule : undefined,
        permissions,
        channels,
        outputFormat,
      }) as { content: string }
      setGeneratedSkill(res.content)
    } catch (e: unknown) {
      setGeneratedSkill(`# Error\n\n${(e as Error).message}`)
    }
    setGenerating(false)
  }

  const handleSend = async () => {
    if (!chatInput.trim()) return
    const msg: ChatMessage = { role: 'user', content: chatInput }
    setChatMessages(m => [...m, msg])
    setChatInput('')
    setChatGenerating(true)
    let response = ''

    try {
      await generateApi.chatStream(
        [...chatMessages, msg],
        (chunk, done) => {
          response += chunk
          if (!done) {
            setChatMessages(m => {
              const last = m[m.length - 1]
              if (last?.role === 'assistant') {
                return [...m.slice(0, -1), { ...last, content: last.content + chunk }]
              }
              return [...m, { role: 'assistant', content: chunk }]
            })
          }
        }
      )

      // Extract skill if present
      const skillMatch = response.match(/<SKILL>([\s\S]*?)<\/SKILL>/)
      if (skillMatch) {
        setChatSkill(skillMatch[1].trim())
      }
    } catch (e: unknown) {
      setChatMessages(m => [
        ...m,
        { role: 'assistant', content: `Error: ${(e as Error).message}` },
      ])
    }
    setChatGenerating(false)
  }

  const handleDayGenerate = async () => {
    if (!dayDescription.trim()) return
    setDayGenerating(true)
    setDaySkills([])
    try {
      const res = await generateApi.fromDay(dayDescription) as { skills: Array<{ name: string; title: string; content: string }> }
      setDaySkills(res.skills || [])
    } catch (e: unknown) {
      alert((e as Error).message)
    }
    setDayGenerating(false)
  }

  const currentSkill =
    mode === 'form'
      ? generatedSkill
      : mode === 'chat'
      ? chatSkill
      : daySkills[selectedDaySkill]?.content ?? ''

  const handleInstall = async () => {
    if (!currentSkill) return
    setSaving(true)
    try {
      const nameMatch = currentSkill.match(/^name:\s*["']?([^"'\n]+)["']?/m)
      const name = nameMatch?.[1]?.trim() || 'generated-skill'
      await skillsApi.create(name, currentSkill)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e: unknown) {
      alert((e as Error).message)
    }
    setSaving(false)
  }

  const handleInstallAll = async () => {
    setSaving(true)
    let installed = 0
    for (const skill of daySkills) {
      try {
        await skillsApi.create(skill.name, skill.content)
        installed++
      } catch {
        // continue
      }
    }
    setSaved(true)
    alert(`Installed ${installed}/${daySkills.length} skills!`)
    setTimeout(() => setSaved(false), 2000)
    setSaving(false)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(currentSkill)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleDownload = () => {
    if (!currentSkill) return
    const blob = new Blob([currentSkill], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'SKILL.md'
    a.click()
  }

  return (
    <div className="flex h-full">
      {/* Left panel */}
      <div className="w-[480px] shrink-0 flex flex-col border-r border-zinc-800 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-zinc-800">
          <PageHeader
            title="Skill Generator"
            subtitle="Describe what you want in plain English"
            icon={<Wand2 className="w-5 h-5" />}
          />

          {/* Mode switcher */}
          <div className="flex gap-1 p-1 bg-zinc-900 rounded-lg">
            {([
              { id: 'form', icon: FormInput, label: 'Form' },
              { id: 'chat', icon: MessageSquare, label: 'Chat' },
              { id: 'day', icon: Sunrise, label: 'My Day' },
            ] as const).map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-sm rounded-md font-medium transition-all ${
                  mode === id
                    ? 'bg-zinc-700 text-zinc-100'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                onClick={() => setMode(id)}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {mode === 'form' && (
            <div className="space-y-5">
              <div>
                <label className="label">What should this skill do?</label>
                <textarea
                  className="input h-24 resize-none"
                  placeholder="e.g. Every morning at 8am, summarize my last 10 unread emails and send me a WhatsApp message with the highlights"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="label">How should it be triggered?</label>
                <div className="space-y-2">
                  {TRIGGERS.map(t => (
                    <label key={t.id} className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="trigger"
                        value={t.id}
                        checked={triggerType === t.id}
                        onChange={() => setTriggerType(t.id)}
                        className="mt-0.5 accent-claw-500"
                      />
                      <span className="text-sm text-zinc-300 group-hover:text-zinc-100">{t.label}</span>
                    </label>
                  ))}
                </div>

                {triggerType === 'scheduled' && (
                  <div className="mt-3">
                    <label className="label">Cron schedule</label>
                    <input
                      className="input font-mono text-xs"
                      value={schedule}
                      onChange={e => setSchedule(e.target.value)}
                      placeholder="0 8 * * * (8am every day)"
                    />
                    <p className="text-xs text-zinc-500 mt-1">
                      Use a cron expression. Default: every day at 8am.
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="label">Permissions needed</label>
                <div className="space-y-2">
                  {PERMISSIONS.map(p => (
                    <label key={p.id} className="flex items-start gap-3 cursor-pointer group p-2 rounded-lg hover:bg-zinc-800 transition-colors">
                      <input
                        type="checkbox"
                        checked={permissions.includes(p.id)}
                        onChange={() => togglePermission(p.id)}
                        className="mt-0.5 accent-claw-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-zinc-200">{p.label}</span>
                          <span className={`text-xs ${RISK_COLORS[p.risk]}`}>
                            {p.risk} risk
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5">{p.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Channels</label>
                <div className="flex flex-wrap gap-2">
                  {CHANNELS.map(ch => (
                    <button
                      key={ch}
                      onClick={() => toggleChannel(ch)}
                      className={`px-3 py-1 rounded-full text-sm border transition-all ${
                        channels.includes(ch)
                          ? 'bg-claw-900/50 border-claw-500 text-claw-300'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                      }`}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Output format</label>
                <select
                  className="input"
                  value={outputFormat}
                  onChange={e => setOutputFormat(e.target.value)}
                >
                  {OUTPUT_FORMATS.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              <button
                className="btn-primary w-full"
                onClick={handleGenerate}
                disabled={!description.trim() || generating}
              >
                {generating ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                ) : (
                  <><Wand2 className="w-4 h-4" /> Generate Skill</>
                )}
              </button>
            </div>
          )}

          {mode === 'chat' && (
            <div className="flex flex-col h-full">
              <div className="flex-1 space-y-3 overflow-y-auto mb-4">
                {chatMessages.length === 0 && (
                  <div className="text-center text-zinc-500 py-8">
                    <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Chat with Claude to build your skill.</p>
                    <p className="text-xs mt-1">Try: "Help me build a morning email summary skill"</p>
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${
                        msg.role === 'user'
                          ? 'bg-claw-600 text-white rounded-tr-sm'
                          : 'bg-zinc-800 text-zinc-200 rounded-tl-sm'
                      }`}
                    >
                      <pre className="whitespace-pre-wrap font-sans break-words">{msg.content.replace(/<SKILL>[\s\S]*?<\/SKILL>/g, '[skill generated →]')}</pre>
                    </div>
                  </div>
                ))}
                {chatGenerating && (
                  <div className="flex justify-start">
                    <div className="bg-zinc-800 px-4 py-2.5 rounded-2xl rounded-tl-sm">
                      <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  placeholder="Describe what you want..."
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                />
                <button
                  className="btn-primary px-3"
                  onClick={handleSend}
                  disabled={!chatInput.trim() || chatGenerating}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {mode === 'day' && (
            <div className="space-y-5">
              <div>
                <label className="label">Describe your typical day</label>
                <textarea
                  className="input h-40 resize-none"
                  placeholder="I wake up at 7am, check emails, have standup at 9am, work on code until lunch, check Slack in the afternoon, wrap up at 6pm..."
                  value={dayDescription}
                  onChange={e => setDayDescription(e.target.value)}
                />
                <p className="text-xs text-zinc-500 mt-1">
                  Clawcraft will generate 6-10 skills that work together as a complete automation system.
                </p>
              </div>

              <button
                className="btn-primary w-full"
                onClick={handleDayGenerate}
                disabled={!dayDescription.trim() || dayGenerating}
              >
                {dayGenerating ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Generating your daily system...</>
                ) : (
                  <><Sunrise className="w-4 h-4" /> Generate My Day</>
                )}
              </button>

              {daySkills.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">{daySkills.length} skills generated</span>
                    <button
                      className="btn-primary text-xs"
                      onClick={handleInstallAll}
                      disabled={saving}
                    >
                      {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      Install All
                    </button>
                  </div>
                  {daySkills.map((skill, i) => (
                    <button
                      key={i}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                        selectedDaySkill === i
                          ? 'bg-claw-900/40 border border-claw-500/40 text-claw-300'
                          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                      }`}
                      onClick={() => setSelectedDaySkill(i)}
                    >
                      {skill.title || skill.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right panel — preview */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
          <span className="text-sm text-zinc-400 font-medium">SKILL.md Preview</span>
          {currentSkill && (
            <div className="flex items-center gap-2">
              <button className="btn-ghost text-xs" onClick={handleCopy}>
                <Copy className="w-3.5 h-3.5" />
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button className="btn-ghost text-xs" onClick={handleDownload}>
                <Download className="w-3.5 h-3.5" />
                Download
              </button>
              <button
                className="btn-primary text-xs"
                onClick={handleInstall}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                {saved ? 'Installed!' : 'Install Directly'}
              </button>
            </div>
          )}
        </div>

        <div className="flex-1">
          {currentSkill ? (
            <SkillEditor
              value={currentSkill}
              onChange={
                mode === 'form'
                  ? setGeneratedSkill
                  : mode === 'chat'
                  ? setChatSkill
                  : undefined
              }
            />
          ) : (
            <div className="flex items-center justify-center h-full text-zinc-600">
              <div className="text-center">
                <Wand2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-sm">Your generated skill will appear here</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
