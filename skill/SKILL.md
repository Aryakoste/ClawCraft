---
name: "clawcraft"
description: "Use Clawcraft to build, scan, debug, or manage OpenClaw skills from any messaging app"
version: "1.0.0"
author: "clawcraft"
tags: ["clawcraft", "skills", "management", "security", "builder"]
trigger: "slash"
permissions: ["browse_web", "send_messages"]
channels: ["whatsapp", "telegram", "slack", "discord"]
---

## Purpose
Companion skill for Clawcraft — the local visual studio for OpenClaw skills.
Lets users interact with Clawcraft from any messaging app via slash commands.
Clawcraft must be running locally (`clawcraft start`) for this skill to work.

## Instructions

1. Check which command the user sent and route to the appropriate action:

### /clawcraft build "description"
- Make a GET request to `http://localhost:4000/api/health` to confirm Clawcraft is running
- If not running, respond: "Clawcraft isn't running. Start it with: `clawcraft start`"
- If running, open the generator URL: `http://localhost:4000/generate?description={URL_ENCODED_DESCRIPTION}`
- Respond: "Opening Clawcraft generator with your description pre-filled. Visit http://localhost:4000/generate"

### /clawcraft scan {skill-name-or-url}
- Make a GET request to `http://localhost:4000/api/health`
- If not running, respond with start instructions
- If it's a URL: POST to `http://localhost:4000/api/scan/clawhub` with `{"url": "{url}"}`
- If it's a skill name: GET `http://localhost:4000/api/skills/{skill-name}/scan`
- Parse the JSON response and format trust score and findings summary:
  - trustScore "safe" → "✅ SAFE: {summary}"
  - trustScore "review" → "⚠️ REVIEW: {summary} — {finding count} issues found"
  - trustScore "dangerous" → "🚨 DANGEROUS: {summary} — Do NOT install this skill"
- Include the top 3 findings with severity and rule name

### /clawcraft list
- GET `http://localhost:4000/api/skills`
- GET `http://localhost:4000/api/scan/all` to get trust scores
- Format response:
  ```
  📦 Your installed skills ({count}):
  
  ✅ skill-name — description
  ⚠️ skill-name — description (review recommended)
  🚨 skill-name — description (DANGEROUS)
  ```

### /clawcraft fix {skill-name}
- Confirm Clawcraft is running
- Respond: "Opening debugger for {skill-name}: http://localhost:4000/debugger?skill={skill-name}"

### /clawcraft search "what I want to do"
- GET `http://localhost:4000/api/skills` to get all installed skills
- GET `http://localhost:4000/api/templates?search={query}` to search templates
- Match skills and templates by description similarity
- Return top 5 matches with: name, description, and source (installed/template)

### /clawcraft install {template-id}
- POST to `http://localhost:4000/api/templates/{template-id}/install`
- Report success or error

### /clawcraft status
- GET `http://localhost:4000/api/health`
- GET `http://localhost:4000/api/skills` for count
- GET `http://localhost:4000/api/usage/summary` for usage stats
- Format response:
  ```
  🛠️ Clawcraft Status
  Server: Running on port {port}
  Skills: {count} installed
  Total fires: {totalSkillFires}
  Time saved: {totalTimeSavedHours}h
  ```

2. If the command is not recognized, show help:
```
🛠️ Clawcraft Commands:
/clawcraft build "description" — Generate a new skill
/clawcraft scan {name-or-url} — Scan a skill for security issues
/clawcraft list — List all installed skills
/clawcraft fix {skill-name} — Debug a skill
/clawcraft search "what I want" — Find skills and templates
/clawcraft install {template-id} — Install a template
/clawcraft status — Show Clawcraft status
```

3. All HTTP calls use a 5-second timeout. If Clawcraft is unreachable, always respond:
   "Clawcraft isn't running. Start it with: `clawcraft start`"

## Guardrails
- Never install skills without explicit user request
- Always show scan results before suggesting installation of external skills
- Never execute shell commands or modify files directly — only call the local Clawcraft API
- If an HTTP call fails with non-200, explain the error clearly
- Never reveal the full API key or sensitive config from the /api/config endpoint

## Output Format
Conversational responses with emoji indicators for trust scores.
Format skill lists as concise bullet points.
Keep responses under 10 lines unless showing a full list.
