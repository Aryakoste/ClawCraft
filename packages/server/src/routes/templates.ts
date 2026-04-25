import type { FastifyInstance } from 'fastify'
import {
  TEMPLATES,
  getTemplateById,
  getTemplatesByCategory,
  getCategories,
} from '../templates.js'
import { writeSkill } from '../skills/writer.js'
import { scanSkillContent } from '../scanner/scanner.js'

export async function templateRoutes(app: FastifyInstance): Promise<void> {
  // List all templates
  app.get<{ Querystring: { category?: string; search?: string } }>(
    '/api/templates',
    async req => {
    const { category, search } = req.query
    let results = TEMPLATES

    if (category) {
      results = results.filter(t => t.category === category)
    }

    if (search) {
      const q = search.toLowerCase()
      results = results.filter(
        t =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.tags.some(tag => tag.includes(q))
      )
    }

    return results.map(t => ({
      id: t.id,
      name: t.name,
      title: t.title,
      description: t.description,
      category: t.category,
      tags: t.tags,
      permissions: t.permissions,
      channels: t.channels,
    }))
  }
  )

  // Get categories
  app.get('/api/templates/categories', async () => {
    return getCategories()
  })

  // Get a single template with full content
  app.get<{ Params: { id: string } }>(
    '/api/templates/:id',
    async (req, reply) => {
      const template = getTemplateById(req.params.id)
      if (!template) return reply.code(404).send({ error: 'Template not found' })
      return template
    }
  )

  // Install a template
  app.post<{ Params: { id: string } }>(
    '/api/templates/:id/install',
    async (req, reply) => {
      const template = getTemplateById(req.params.id)
      if (!template) return reply.code(404).send({ error: 'Template not found' })
      try {
        const path = writeSkill(template.name, template.content)
        return { success: true, path, skillName: template.name }
      } catch (e: unknown) {
        return reply.code(500).send({ error: (e as Error).message })
      }
    }
  )

  // Scan a template (verify it's safe)
  app.get<{ Params: { id: string } }>(
    '/api/templates/:id/scan',
    async (req, reply) => {
      const template = getTemplateById(req.params.id)
      if (!template) return reply.code(404).send({ error: 'Template not found' })
      return scanSkillContent(template.name, template.content)
    }
  )
}
