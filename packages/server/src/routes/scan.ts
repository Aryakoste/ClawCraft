import type { FastifyInstance } from 'fastify'
import { readAllSkills } from '../skills/reader.js'
import { scanSkillContent, detectConflicts } from '../scanner/scanner.js'

export async function scanRoutes(app: FastifyInstance): Promise<void> {
  // Scan all installed skills
  app.get('/api/scan/all', async () => {
    const skills = readAllSkills()
    const results = skills.map(s => scanSkillContent(s.name, s.raw))
    const summary = {
      total: results.length,
      safe: results.filter(r => r.trustScore === 'safe').length,
      review: results.filter(r => r.trustScore === 'review').length,
      dangerous: results.filter(r => r.trustScore === 'dangerous').length,
    }
    return { summary, results }
  })

  // Scan a skill by content (POST)
  app.post<{ Body: { skillName: string; content: string } }>(
    '/api/scan',
    async (req, reply) => {
      const { skillName, content } = req.body
      if (!content) return reply.code(400).send({ error: 'content required' })
      return scanSkillContent(skillName || 'unnamed', content)
    }
  )

  // Scan a ClawHub skill by URL
  app.post<{ Body: { url: string } }>(
    '/api/scan/clawhub',
    async (req, reply) => {
      const { url } = req.body
      if (!url) return reply.code(400).send({ error: 'url required' })

      try {
        // Fetch the raw SKILL.md from ClawHub
        // ClawHub URLs: https://clawhub.io/skills/author/skill-name
        // Raw content: https://clawhub.io/skills/author/skill-name/raw
        let rawUrl = url
        if (!rawUrl.endsWith('/raw')) rawUrl = rawUrl.replace(/\/?$/, '/raw')

        const resp = await fetch(rawUrl, {
          headers: { 'User-Agent': 'Clawcraft/1.0' },
          signal: AbortSignal.timeout(10000),
        })

        if (!resp.ok) {
          return reply
            .code(400)
            .send({ error: `Failed to fetch skill: HTTP ${resp.status}` })
        }

        const content = await resp.text()
        const skillName = url.split('/').pop() ?? 'clawhub-skill'
        return scanSkillContent(skillName, content)
      } catch (e: unknown) {
        return reply
          .code(400)
          .send({ error: `Failed to fetch skill: ${(e as Error).message}` })
      }
    }
  )

  // Get conflict detection report
  app.get('/api/scan/conflicts', async () => {
    const skills = readAllSkills()
    const data = skills.map(s => ({
      name: s.name,
      description: s.frontmatter.description,
      trigger: s.frontmatter.trigger,
    }))
    return { conflicts: detectConflicts(data) }
  })
}
