import type { FastifyInstance } from 'fastify'
import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  unlinkSync,
} from 'fs'
import { join } from 'path'
import { getConfigDir } from '../config.js'
import { callLLM } from '../llm/client.js'
import { writeSkill } from '../skills/writer.js'

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

function getComposerDir(): string {
  const dir = join(getConfigDir(), 'composer')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
}

function canvasPath(id: string): string {
  return join(getComposerDir(), `${id}.json`)
}

function listCanvases(): ComposerCanvas[] {
  const dir = getComposerDir()
  try {
    return readdirSync(dir)
      .filter(f => f.endsWith('.json'))
      .map(f => JSON.parse(readFileSync(join(dir, f), 'utf-8')) as ComposerCanvas)
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
  } catch {
    return []
  }
}

const COMPOSER_AI_SYSTEM = `You are an OpenClaw skill workflow designer.

The user will describe a multi-step automation workflow. Design it as a set of connected skills.

Return JSON:
{
  "name": "workflow-name",
  "description": "What this workflow does",
  "nodes": [
    {
      "id": "node-1",
      "skillName": "skill-name",
      "label": "Human label",
      "type": "trigger|skill|condition|output",
      "config": {}
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "node-1",
      "target": "node-2",
      "label": "on success",
      "condition": ""
    }
  ],
  "skills": [
    {
      "name": "skill-name",
      "content": "...full SKILL.md content..."
    }
  ]
}

Return ONLY the JSON. No markdown fences.`

export async function composerRoutes(app: FastifyInstance): Promise<void> {
  // List all canvases
  app.get('/api/composer', async () => listCanvases())

  // Get a canvas
  app.get<{ Params: { id: string } }>(
    '/api/composer/:id',
    async (req, reply) => {
      const path = canvasPath(req.params.id)
      if (!existsSync(path))
        return reply.code(404).send({ error: 'Canvas not found' })
      return JSON.parse(readFileSync(path, 'utf-8'))
    }
  )

  // Create/update a canvas
  app.post<{ Body: Partial<ComposerCanvas> }>(
    '/api/composer',
    async req => {
      const now = new Date().toISOString()
      const id = req.body.id ?? `canvas-${Date.now()}`
      const existing = existsSync(canvasPath(id))
        ? (JSON.parse(readFileSync(canvasPath(id), 'utf-8')) as ComposerCanvas)
        : null

      const canvas: ComposerCanvas = {
        name: req.body.name ?? 'Untitled',
        description: req.body.description ?? '',
        nodes: req.body.nodes ?? [],
        edges: req.body.edges ?? [],
        id,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      }
      writeFileSync(canvasPath(id), JSON.stringify(canvas, null, 2), 'utf-8')
      return canvas
    }
  )

  // Delete a canvas
  app.delete<{ Params: { id: string } }>(
    '/api/composer/:id',
    async (req, reply) => {
      const path = canvasPath(req.params.id)
      if (!existsSync(path))
        return reply.code(404).send({ error: 'Canvas not found' })
      unlinkSync(path)
      return { success: true }
    }
  )

  // AI-generate a workflow
  app.post<{ Body: { description: string } }>(
    '/api/composer/generate',
    async (req, reply) => {
      try {
        const response = await callLLM([
          {
            role: 'user',
            content: COMPOSER_AI_SYSTEM + '\n\nWorkflow description:\n' + req.body.description,
          },
        ])

        const jsonMatch = response.content.match(/\{[\s\S]*\}/)
        if (!jsonMatch)
          return reply.code(500).send({ error: 'Failed to parse response' })

        const data = JSON.parse(jsonMatch[0]) as {
          name: string
          description: string
          nodes: ComposerNode[]
          edges: ComposerEdge[]
          skills?: Array<{ name: string; content: string }>
        }

        // Install generated skills
        const installedSkills: string[] = []
        if (data.skills) {
          for (const skill of data.skills) {
            try {
              writeSkill(skill.name, skill.content)
              installedSkills.push(skill.name)
            } catch {
              // non-fatal
            }
          }
        }

        // Save canvas
        const now = new Date().toISOString()
        const id = `canvas-${Date.now()}`
        const canvas: ComposerCanvas = {
          id,
          name: data.name ?? 'Generated Workflow',
          description: data.description ?? '',
          nodes: (data.nodes ?? []).map((n, i) => ({
            ...n,
            x: 80 + (i % 3) * 240,
            y: 80 + Math.floor(i / 3) * 140,
          })),
          edges: data.edges ?? [],
          createdAt: now,
          updatedAt: now,
        }
        writeFileSync(canvasPath(id), JSON.stringify(canvas, null, 2), 'utf-8')

        return { canvas, installedSkills }
      } catch (e: unknown) {
        return reply.code(500).send({ error: (e as Error).message })
      }
    }
  )
}
