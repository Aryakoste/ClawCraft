import {
  writeFileSync,
  mkdirSync,
  existsSync,
  copyFileSync,
  unlinkSync,
  readdirSync,
} from 'fs'
import { join, dirname } from 'path'
import { readConfig, getHistoryDir } from '../config.js'
import { readSkill } from './reader.js'
import AdmZip from 'adm-zip'

export function getSkillPath(skillName: string): string {
  const config = readConfig()
  const baseName = skillName.replace(/[^a-z0-9-_]/gi, '-').toLowerCase()
  return join(config.openclawSkillsPath, baseName, 'SKILL.md')
}

export function writeSkill(skillName: string, content: string): string {
  const skillPath = getSkillPath(skillName)
  const dir = dirname(skillPath)

  // Back up existing version to history before overwriting
  if (existsSync(skillPath)) {
    backupSkillVersion(skillName, skillPath)
  }

  mkdirSync(dir, { recursive: true })
  writeFileSync(skillPath, content, 'utf-8')
  return skillPath
}

export function writeSkillToPath(filePath: string, content: string): void {
  const dir = dirname(filePath)
  if (existsSync(filePath)) {
    const skillName = filePath.split(/[\\/]/).slice(-2)[0]
    backupSkillVersion(skillName, filePath)
  }
  mkdirSync(dir, { recursive: true })
  writeFileSync(filePath, content, 'utf-8')
}

export function deleteSkill(skillName: string): boolean {
  const skillPath = getSkillPath(skillName)
  if (!existsSync(skillPath)) return false
  backupSkillVersion(skillName, skillPath)
  unlinkSync(skillPath)
  // Try to remove empty dir
  try {
    const dir = dirname(skillPath)
    const remaining = readdirSync(dir)
    if (remaining.length === 0) {
      // rmdir would need fs import, just leave it
    }
  } catch {
    // ignore
  }
  return true
}

export function duplicateSkill(sourceName: string, targetName: string): string {
  const sourcePath = getSkillPath(sourceName)
  if (!existsSync(sourcePath)) throw new Error(`Skill not found: ${sourceName}`)
  const source = readSkill(sourcePath)
  const newContent = source.raw.replace(
    /^name:\s*.+$/m,
    `name: "${targetName.replace(/[^a-z0-9-_]/gi, '-').toLowerCase()}"`
  )
  return writeSkill(targetName, newContent)
}

export function skillToZip(skillName: string, content: string): Buffer {
  const zip = new AdmZip()
  const sanitizedName = skillName.replace(/[^a-z0-9-_]/gi, '-').toLowerCase()
  zip.addFile(`${sanitizedName}/SKILL.md`, Buffer.from(content, 'utf-8'))
  return zip.toBuffer()
}

// History management
function backupSkillVersion(skillName: string, filePath: string): void {
  try {
    const historyDir = getHistoryDir()
    const safeName = skillName.replace(/[^a-z0-9-_]/gi, '-').toLowerCase()
    const skillHistoryDir = join(historyDir, safeName)
    mkdirSync(skillHistoryDir, { recursive: true })

    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
      .slice(0, 19)
    const backupPath = join(skillHistoryDir, `${timestamp}.md`)
    copyFileSync(filePath, backupPath)
  } catch {
    // history backup failure is non-fatal
  }
}

export interface SkillVersion {
  timestamp: Date
  filePath: string
  label: string
}

export function getSkillHistory(skillName: string): SkillVersion[] {
  const historyDir = getHistoryDir()
  const safeName = skillName.replace(/[^a-z0-9-_]/gi, '-').toLowerCase()
  const skillHistoryDir = join(historyDir, safeName)

  if (!existsSync(skillHistoryDir)) return []

  try {
    return readdirSync(skillHistoryDir)
      .filter(f => f.endsWith('.md'))
      .sort()
      .reverse()
      .map(f => ({
        timestamp: parseTimestampFromFilename(f),
        filePath: join(skillHistoryDir, f),
        label: f.replace('.md', '').replace(/T/g, ' ').replace(/-/g, (m, i) =>
          i > 9 ? ':' : '-'
        ),
      }))
  } catch {
    return []
  }
}

function parseTimestampFromFilename(filename: string): Date {
  // Format: 2024-01-15T10-30-45.md
  const ts = filename
    .replace('.md', '')
    .replace(/(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})/, '$1T$2:$3:$4')
  const d = new Date(ts)
  return isNaN(d.getTime()) ? new Date() : d
}

export function restoreSkillVersion(
  skillName: string,
  versionPath: string
): string {
  const targetPath = getSkillPath(skillName)
  const dir = dirname(targetPath)
  mkdirSync(dir, { recursive: true })
  if (existsSync(targetPath)) {
    backupSkillVersion(skillName, targetPath)
  }
  copyFileSync(versionPath, targetPath)
  return targetPath
}
