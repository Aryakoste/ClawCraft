import type { FastifyInstance } from 'fastify'
import { callLLM, streamLLM } from '../llm/client.js'
import type { LLMMessage } from '../llm/client.js'

const SKILL_SYSTEM_PROMPT = `You are an expert OpenClaw skill developer. Generate a complete, valid SKILL.md file.

A valid SKILL.md structure:
---
name: "skill-name-in-kebab-case"
description: "One sentence describing when to use this skill. Written as a trigger phrase."
version: "1.0.0"
author: "clawcraft-generated"
tags: ["tag1", "tag2"]
trigger: "slash|scheduled|always"
schedule: "cron expression if scheduled"
permissions: ["read_email", "write_files", "execute", "browse_web", "send_messages", "read_calendar", "access_contacts"]
channels: ["whatsapp", "telegram", "slack", "discord"]
---

## Purpose
Clear description of what this skill does and when to use it.

## Instructions
Deterministic step-by-step runbook the agent follows. Include:
- Exact numbered steps
- What to do if input is missing
- Stop conditions
- Error handling
- Output delivery method

## Guardrails
- Always confirm before deleting anything
- Never send messages without showing a preview first
- Stop and ask if required information is missing
- Log all actions taken

## Output Format
Describe exactly how results should be formatted and delivered.

Rules:
- Description must match how users naturally phrase this request
- Instructions must be a deterministic runbook, not vague guidelines
- Always include guardrails
- Request minimum permissions needed
- Never include hardcoded secrets
- Keep instructions under 500 words

Generate ONLY the SKILL.md content. No explanation. No markdown fences.`

const DAY_SYSTEM_PROMPT = `You are an expert OpenClaw skill developer helping a user automate their entire daily workflow.

The user will describe their typical day. Generate 6-10 complementary SKILL.md files that work together as a complete personal automation system.

For each skill:
1. Cover a distinct part of their day (morning, work, breaks, evening, etc.)
2. Make the skills non-overlapping — no two skills should do the same thing
3. Ensure skills can chain together where logical
4. Use minimum required permissions per skill

Return a JSON array of objects, each with:
{
  "name": "skill-name",
  "title": "Human Readable Title",
  "description": "When this skill is used",
  "content": "...full SKILL.md content..."
}

Generate ONLY the JSON array. No explanation. No markdown fences.`

const CHAT_SYSTEM_PROMPT = `You are Clawcraft, an AI assistant that helps users build OpenClaw skills through conversation.

When the user describes what they want, you:
1. Ask clarifying questions if needed (trigger type, permissions, output format)
2. Generate a complete SKILL.md when you have enough information
3. When generating a skill, output it between <SKILL> and </SKILL> tags

Rules:
- Be conversational and friendly
- Ask one or two focused questions, not a long list
- When generating, output ONLY the SKILL.md content between the tags
- After generating, ask if they want any changes

Example: If user says "summarize my emails", ask:
- "When should this run? (manually when you ask, automatically every morning, or both?)"
- Then generate the skill after getting the answer.`

export async function generateRoutes(app: FastifyInstance): Promise<void> {
  // Generate from form
  app.post<{
    Body: {
      description: string
      triggerType: string
      permissions: string[]
      channels: string[]
      outputFormat: string
      schedule?: string
    }
  }>('/api/generate', async (req, reply) => {
    const { description, triggerType, permissions, channels, outputFormat, schedule } =
      req.body

    const userPrompt = `User request: ${description}
Trigger type: ${triggerType}${schedule ? `\nSchedule: ${schedule}` : ''}
Permissions: ${permissions.join(', ') || 'none'}
Channels: ${channels.join(', ') || 'all'}
Output format: ${outputFormat}`

    try {
      const response = await callLLM([
        { role: 'user', content: SKILL_SYSTEM_PROMPT + '\n\n' + userPrompt },
      ])
      return { content: response.content }
    } catch (e: unknown) {
      return reply.code(500).send({ error: (e as Error).message })
    }
  })

  // Generate from chat (streaming SSE)
  app.post<{
    Body: { messages: LLMMessage[] }
  }>('/api/generate/chat', async (req, reply) => {
    const { messages } = req.body
    const allMessages: LLMMessage[] = [
      { role: 'user', content: CHAT_SYSTEM_PROMPT },
      ...messages,
    ]

    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    })

    try {
      await streamLLM(allMessages, chunk => {
        if (!reply.raw.destroyed) {
          reply.raw.write(
            `data: ${JSON.stringify({ content: chunk.content, done: chunk.done })}\n\n`
          )
        }
      })
    } catch (e: unknown) {
      if (!reply.raw.destroyed) {
        reply.raw.write(
          `data: ${JSON.stringify({ error: (e as Error).message, done: true })}\n\n`
        )
      }
    }
    if (!reply.raw.destroyed) reply.raw.end()
    return reply
  })

  // Describe Your Day — generate multiple skills
  app.post<{ Body: { dayDescription: string } }>(
    '/api/generate/day',
    async (req, reply) => {
      const { dayDescription } = req.body
      try {
        const response = await callLLM([
          {
            role: 'user',
            content:
              DAY_SYSTEM_PROMPT +
              '\n\nUser\'s day:\n' +
              dayDescription,
          },
        ])

        // Parse JSON from response
        let parsed
        try {
          const jsonMatch = response.content.match(/\[[\s\S]*\]/)
          parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(response.content)
        } catch {
          return reply.code(500).send({ error: 'Failed to parse generated skills' })
        }

        return { skills: parsed }
      } catch (e: unknown) {
        return reply.code(500).send({ error: (e as Error).message })
      }
    }
  )
}
