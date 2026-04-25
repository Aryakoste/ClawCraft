export interface SkillFrontmatter {
  name: string
  description: string
  version: string
  author: string
  tags: string[]
  trigger?: string
  schedule?: string
  permissions?: string[]
  channels?: string[]
}

export interface ParsedSkill {
  name: string
  fileName: string
  filePath: string
  frontmatter: SkillFrontmatter
  content: string
  raw: string
  lastModified: string
  size: number
  trustScore?: 'safe' | 'review' | 'dangerous'
}

export interface Finding {
  ruleId: string
  ruleName: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  line: number
  snippet: string
  explanation: string
  recommendation: string
}

export interface ScanResult {
  skillName: string
  trustScore: 'safe' | 'review' | 'dangerous'
  findings: Finding[]
  scannedAt: string
  summary: string
}

export interface Template {
  id: string
  name: string
  title: string
  description: string
  category: string
  tags: string[]
  permissions: string[]
  channels: string[]
  content?: string
}

export interface ClawcraftConfig {
  openclawSkillsPath: string
  llmProvider: 'anthropic' | 'openai' | 'openai-compat' | 'ollama' | 'openclaw'
  apiKey: string
  model: string
  baseUrl?: string
  port: number
  theme: 'dark' | 'light'
  autoScan: boolean
  version: string
  hasApiKey?: boolean
}

export interface SkillVersion {
  timestamp: string
  filePath: string
  label: string
}

export interface ConflictReport {
  skill1: string
  skill2: string
  type: 'description-overlap' | 'trigger-overlap'
  explanation: string
  suggestedFix: string
}

export interface DebugResult {
  diagnosis: string
  rootCause: string
  changes: string[]
  fixedSkill: string
}

export interface ImproveResult {
  summary: string
  changes: Array<{
    type: 'improvement' | 'fix' | 'security' | 'format'
    description: string
    before: string
    after: string
  }>
  improvedSkill: string
}

export interface SimulatorStep {
  step: number
  instruction: string
  action: string
  toolCall?: string
  output: string
  issues: string[]
}

export interface SimulateResult {
  steps: SimulatorStep[]
  finalOutput: string
  toolsUsed: string[]
  issues: string[]
  suggestions: string[]
}

export interface ComposerNode {
  id: string
  skillName: string
  label: string
  x: number
  y: number
  type: 'skill' | 'trigger' | 'condition' | 'output'
  config: Record<string, unknown>
}

export interface ComposerEdge {
  id: string
  source: string
  target: string
  label?: string
  condition?: string
}

export interface ComposerCanvas {
  id: string
  name: string
  description: string
  nodes: ComposerNode[]
  edges: ComposerEdge[]
  createdAt: string
  updatedAt: string
}

export interface UsageStats {
  skillName: string
  totalFires: number
  lastFired: string | null
  totalTimeSavedSeconds: number
  firesByDay: Record<string, number>
  channels: Record<string, number>
}

export type TrustScoreColor = 'green' | 'yellow' | 'red'

export function getTrustScoreColor(score: ScanResult['trustScore']): TrustScoreColor {
  if (score === 'safe') return 'green'
  if (score === 'review') return 'yellow'
  return 'red'
}

export function formatTimeSaved(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`
  return `${(seconds / 3600).toFixed(1)}h`
}
