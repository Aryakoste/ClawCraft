import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync, } from 'fs';
import { join } from 'path';
import { getConfigDir } from '../config.js';
import { callLLM } from '../llm/client.js';
import { writeSkill } from '../skills/writer.js';
function getComposerDir() {
    const dir = join(getConfigDir(), 'composer');
    if (!existsSync(dir))
        mkdirSync(dir, { recursive: true });
    return dir;
}
function canvasPath(id) {
    return join(getComposerDir(), `${id}.json`);
}
function listCanvases() {
    const dir = getComposerDir();
    try {
        return readdirSync(dir)
            .filter(f => f.endsWith('.json'))
            .map(f => JSON.parse(readFileSync(join(dir, f), 'utf-8')))
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
    catch {
        return [];
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

Return ONLY the JSON. No markdown fences.`;
export async function composerRoutes(app) {
    // List all canvases
    app.get('/api/composer', async () => listCanvases());
    // Get a canvas
    app.get('/api/composer/:id', async (req, reply) => {
        const path = canvasPath(req.params.id);
        if (!existsSync(path))
            return reply.code(404).send({ error: 'Canvas not found' });
        return JSON.parse(readFileSync(path, 'utf-8'));
    });
    // Create/update a canvas
    app.post('/api/composer', async (req) => {
        const now = new Date().toISOString();
        const id = req.body.id ?? `canvas-${Date.now()}`;
        const existing = existsSync(canvasPath(id))
            ? JSON.parse(readFileSync(canvasPath(id), 'utf-8'))
            : null;
        const canvas = {
            name: req.body.name ?? 'Untitled',
            description: req.body.description ?? '',
            nodes: req.body.nodes ?? [],
            edges: req.body.edges ?? [],
            id,
            createdAt: existing?.createdAt ?? now,
            updatedAt: now,
        };
        writeFileSync(canvasPath(id), JSON.stringify(canvas, null, 2), 'utf-8');
        return canvas;
    });
    // Delete a canvas
    app.delete('/api/composer/:id', async (req, reply) => {
        const path = canvasPath(req.params.id);
        if (!existsSync(path))
            return reply.code(404).send({ error: 'Canvas not found' });
        unlinkSync(path);
        return { success: true };
    });
    // AI-generate a workflow
    app.post('/api/composer/generate', async (req, reply) => {
        try {
            const response = await callLLM([
                {
                    role: 'user',
                    content: COMPOSER_AI_SYSTEM + '\n\nWorkflow description:\n' + req.body.description,
                },
            ]);
            const jsonMatch = response.content.match(/\{[\s\S]*\}/);
            if (!jsonMatch)
                return reply.code(500).send({ error: 'Failed to parse response' });
            const data = JSON.parse(jsonMatch[0]);
            // Install generated skills
            const installedSkills = [];
            if (data.skills) {
                for (const skill of data.skills) {
                    try {
                        writeSkill(skill.name, skill.content);
                        installedSkills.push(skill.name);
                    }
                    catch {
                        // non-fatal
                    }
                }
            }
            // Save canvas
            const now = new Date().toISOString();
            const id = `canvas-${Date.now()}`;
            const canvas = {
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
            };
            writeFileSync(canvasPath(id), JSON.stringify(canvas, null, 2), 'utf-8');
            return { canvas, installedSkills };
        }
        catch (e) {
            return reply.code(500).send({ error: e.message });
        }
    });
}
