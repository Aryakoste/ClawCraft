import type { FastifyInstance } from 'fastify'
import { callLLM } from '../llm/client.js'

const DEBUGGER_SYSTEM = `You are an expert OpenClaw skill debugger. The user will provide a SKILL.md and describe a problem.

Your job:
1. Analyze the skill and identify the exact root cause of the problem
2. Explain it in plain English (no jargon)
3. Provide a complete corrected version of the SKILL.md
4. List specifically what you changed and why

Return JSON:
{
  "diagnosis": "Plain English explanation of the problem",
  "rootCause": "Technical root cause in one sentence",
  "changes": ["Change 1: explanation", "Change 2: explanation"],
  "fixedSkill": "...complete corrected SKILL.md content..."
}

Return ONLY the JSON. No markdown fences.`

const IMPROVER_SYSTEM = `You are an expert OpenClaw skill quality engineer.

Improve the provided skill by:
1. Making instructions more deterministic and specific
2. Adding missing guardrails and stop conditions
3. Improving the description for better model triggering
4. Stripping permissions down to minimum needed
5. Adding missing error handling
6. Fixing any formatting issues
7. Ensuring the output format is well-defined

Return JSON:
{
  "summary": "2-3 sentence overview of improvements made",
  "changes": [
    { "type": "improvement|fix|security|format", "description": "What was changed and why", "before": "original text", "after": "new text" }
  ],
  "improvedSkill": "...complete improved SKILL.md content..."
}

Return ONLY the JSON. No markdown fences.`

const SIMULATOR_SYSTEM = `You are an OpenClaw skill execution simulator.

You will receive a SKILL.md and sample input. Simulate the agent executing the skill:

1. Walk through each instruction step
2. Show what the agent would do at each step
3. List all tools/APIs the agent would call
4. Show the final output based on the sample input
5. Flag any ambiguous steps where the instructions could be interpreted multiple ways
6. Suggest improvements

Return JSON:
{
  "steps": [
    { "step": 1, "instruction": "original instruction text", "action": "what the agent does", "toolCall": "API/tool called if any", "output": "result of this step", "issues": [] }
  ],
  "finalOutput": "What the full final output would look like",
  "toolsUsed": ["list of tools/APIs called"],
  "issues": ["Issue 1: description", "Issue 2: description"],
  "suggestions": ["Suggestion 1", "Suggestion 2"]
}

Return ONLY the JSON. No markdown fences.`

export async function debugRoutes(app: FastifyInstance): Promise<void> {
  // Debug a broken skill
  app.post<{
    Body: { skillContent: string; problem: string }
  }>('/api/debug', async (req, reply) => {
    const { skillContent, problem } = req.body
    if (!skillContent || !problem)
      return reply.code(400).send({ error: 'skillContent and problem required' })

    try {
      const response = await callLLM([
        {
          role: 'user',
          content: `${DEBUGGER_SYSTEM}\n\nSKILL.md:\n${skillContent}\n\nProblem: ${problem}`,
        },
      ])

      const jsonMatch = response.content.match(/\{[\s\S]*\}/)
      if (!jsonMatch)
        return reply.code(500).send({ error: 'Failed to parse debug response' })
      return JSON.parse(jsonMatch[0])
    } catch (e: unknown) {
      return reply.code(500).send({ error: (e as Error).message })
    }
  })

  // Improve a skill
  app.post<{ Body: { skillContent: string } }>(
    '/api/debug/improve',
    async (req, reply) => {
      const { skillContent } = req.body
      if (!skillContent)
        return reply.code(400).send({ error: 'skillContent required' })

      try {
        const response = await callLLM([
          {
            role: 'user',
            content: `${IMPROVER_SYSTEM}\n\nSKILL.md to improve:\n${skillContent}`,
          },
        ])

        const jsonMatch = response.content.match(/\{[\s\S]*\}/)
        if (!jsonMatch)
          return reply
            .code(500)
            .send({ error: 'Failed to parse improve response' })
        return JSON.parse(jsonMatch[0])
      } catch (e: unknown) {
        return reply.code(500).send({ error: (e as Error).message })
      }
    }
  )

  // Dry run simulator
  app.post<{
    Body: { skillContent: string; sampleInput: string }
  }>('/api/debug/simulate', async (req, reply) => {
    const { skillContent, sampleInput } = req.body
    if (!skillContent || !sampleInput)
      return reply
        .code(400)
        .send({ error: 'skillContent and sampleInput required' })

    try {
      const response = await callLLM([
        {
          role: 'user',
          content: `${SIMULATOR_SYSTEM}\n\nSKILL.md:\n${skillContent}\n\nSample Input:\n${sampleInput}`,
        },
      ])

      const jsonMatch = response.content.match(/\{[\s\S]*\}/)
      if (!jsonMatch)
        return reply
          .code(500)
          .send({ error: 'Failed to parse simulation response' })
      return JSON.parse(jsonMatch[0])
    } catch (e: unknown) {
      return reply.code(500).send({ error: (e as Error).message })
    }
  })
}
