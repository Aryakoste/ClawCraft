import type { FastifyInstance } from 'fastify'
import { readAllSkills } from '../skills/reader.js'
import {
  writeSkill,
  writeSkillToPath,
  deleteSkill,
  duplicateSkill,
  skillToZip,
  getSkillHistory,
  restoreSkillVersion,
} from '../skills/writer.js'
import { readFileSync, existsSync } from 'fs'
import { scanSkillContent, detectConflicts } from '../scanner/scanner.js'

export async function skillsRoutes(app: FastifyInstance): Promise<void> {
  // List all skills
  app.get('/api/skills', async () => {
    const skills = readAllSkills()
    return skills.map(s => ({
      name: s.name,
      fileName: s.fileName,
      filePath: s.filePath,
      frontmatter: s.frontmatter,
      lastModified: s.lastModified,
      size: s.size,
    }))
  })

  // Get a single skill's full content
  app.get<{ Params: { name: string } }>(
    '/api/skills/:name',
    async (req, reply) => {
      const skills = readAllSkills()
      const skill = skills.find(
        s =>
          s.name === req.params.name ||
          s.fileName.replace(/\.md$/i, '') === req.params.name
      )
      if (!skill) return reply.code(404).send({ error: 'Skill not found' })
      return skill
    }
  )

  // Create or update a skill
  app.post<{ Body: { name: string; content: string } }>(
    '/api/skills',
    async (req, reply) => {
      const { name, content } = req.body
      if (!name || !content)
        return reply.code(400).send({ error: 'name and content required' })
      const path = writeSkill(name, content)
      return { success: true, path }
    }
  )

  // Update a skill at a specific path
  app.put<{ Body: { filePath: string; content: string } }>(
    '/api/skills/update',
    async (req, reply) => {
      const { filePath, content } = req.body
      if (!filePath || !content)
        return reply.code(400).send({ error: 'filePath and content required' })
      writeSkillToPath(filePath, content)
      return { success: true }
    }
  )

  // Delete a skill
  app.delete<{ Params: { name: string } }>(
    '/api/skills/:name',
    async (req, reply) => {
      const deleted = deleteSkill(req.params.name)
      if (!deleted) return reply.code(404).send({ error: 'Skill not found' })
      return { success: true }
    }
  )

  // Duplicate a skill
  app.post<{ Body: { sourceName: string; targetName: string } }>(
    '/api/skills/duplicate',
    async (req, reply) => {
      const { sourceName, targetName } = req.body
      try {
        const path = duplicateSkill(sourceName, targetName)
        return { success: true, path }
      } catch (e: unknown) {
        return reply.code(400).send({ error: (e as Error).message })
      }
    }
  )

  // Download as ZIP
  app.get<{ Params: { name: string } }>(
    '/api/skills/:name/download',
    async (req, reply) => {
      const skills = readAllSkills()
      const skill = skills.find(s => s.name === req.params.name)
      if (!skill) return reply.code(404).send({ error: 'Skill not found' })
      const buf = skillToZip(skill.name, skill.raw)
      reply.header(
        'Content-Disposition',
        `attachment; filename="${skill.name}.zip"`
      )
      reply.header('Content-Type', 'application/zip')
      return reply.send(buf)
    }
  )

  // Get skill version history
  app.get<{ Params: { name: string } }>(
    '/api/skills/:name/history',
    async req => {
      return getSkillHistory(req.params.name)
    }
  )

  // Get a specific history version's content
  app.get<{ Params: { name: string }; Querystring: { path: string } }>(
    '/api/skills/:name/history/content',
    async (req, reply) => {
      const { path } = req.query
      if (!existsSync(path))
        return reply.code(404).send({ error: 'Version not found' })
      return { content: readFileSync(path, 'utf-8') }
    }
  )

  // Restore a skill version
  app.post<{ Body: { skillName: string; versionPath: string } }>(
    '/api/skills/restore',
    async (req, reply) => {
      const { skillName, versionPath } = req.body
      try {
        const path = restoreSkillVersion(skillName, versionPath)
        return { success: true, path }
      } catch (e: unknown) {
        return reply.code(400).send({ error: (e as Error).message })
      }
    }
  )

  // Scan a skill
  app.get<{ Params: { name: string } }>(
    '/api/skills/:name/scan',
    async (req, reply) => {
      const skills = readAllSkills()
      const skill = skills.find(s => s.name === req.params.name)
      if (!skill) return reply.code(404).send({ error: 'Skill not found' })
      return scanSkillContent(skill.name, skill.raw)
    }
  )

  // Detect conflicts
  app.get('/api/skills/conflicts', async () => {
    const skills = readAllSkills()
    const data = skills.map(s => ({
      name: s.name,
      description: s.frontmatter.description,
      trigger: s.frontmatter.trigger,
    }))
    return detectConflicts(data)
  })
}
