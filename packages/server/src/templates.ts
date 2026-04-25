export interface Template {
  id: string
  name: string
  title: string
  description: string
  category: string
  tags: string[]
  permissions: string[]
  channels: string[]
  content: string
}

export const TEMPLATES: Template[] = [
  // ─── PRODUCTIVITY ──────────────────────────────────────────────────────────
  {
    id: 'morning-email-briefing',
    name: 'morning-email-briefing',
    title: 'Morning Email Briefing',
    description: 'Summarizes overnight emails and sends a WhatsApp digest at 8am',
    category: 'Productivity',
    tags: ['email', 'morning', 'summary', 'scheduled'],
    permissions: ['read_email', 'send_messages'],
    channels: ['whatsapp', 'telegram'],
    content: `---
name: "morning-email-briefing"
description: "Summarize my unread emails every morning and send me the highlights"
version: "1.0.0"
author: "clawcraft-templates"
tags: ["email", "morning", "summary", "scheduled"]
trigger: "scheduled"
schedule: "0 8 * * *"
permissions: ["read_email", "send_messages"]
channels: ["whatsapp", "telegram"]
---

## Purpose
Every morning at 8am, read all unread emails received since yesterday 6pm and send a concise summary via the user's preferred messaging channel.

## Instructions
1. Retrieve all unread emails received between yesterday at 6:00pm and now
2. If there are no unread emails, send a brief message: "Good morning! No new emails since yesterday evening."
3. Categorize emails by: Urgent (requires action today), Important (requires action this week), Informational (no action needed)
4. For each Urgent email, extract: sender, subject, key ask, and deadline
5. For each Important email, extract: sender and one-sentence summary
6. Count total informational emails without listing them
7. Format the summary as:

**📬 Morning Email Briefing — [Date]**

**Urgent (X):**
- From [Sender]: [Subject] — [Key ask] *(Due: [deadline])*

**Important (X):**
- From [Sender]: [One-sentence summary]

**Informational:** X emails requiring no action

8. Send the formatted summary via the user's messaging channel
9. If any email contains urgent security alerts or account compromises, prepend a 🚨 warning at the top

## Guardrails
- Never send email replies on behalf of the user
- Never mark emails as read unless explicitly instructed
- Stop and ask if the email folder cannot be accessed
- Never include full email bodies in the summary — only key information

## Output Format
Structured WhatsApp/Telegram message with emoji headers, bullet points, and clear urgency tiers.
`,
  },

  {
    id: 'daily-calendar-summary',
    name: 'daily-calendar-summary',
    title: 'Daily Calendar Summary',
    description: "Reads today's events and sends a morning briefing",
    category: 'Productivity',
    tags: ['calendar', 'morning', 'schedule', 'daily'],
    permissions: ['read_calendar', 'send_messages'],
    channels: ['whatsapp', 'telegram'],
    content: `---
name: "daily-calendar-summary"
description: "Tell me what's on my calendar today"
version: "1.0.0"
author: "clawcraft-templates"
tags: ["calendar", "morning", "schedule", "daily"]
trigger: "scheduled"
schedule: "0 7 * * 1-5"
permissions: ["read_calendar", "send_messages"]
channels: ["whatsapp", "telegram", "slack"]
---

## Purpose
Every weekday morning, retrieve the day's calendar events and send a structured briefing.

## Instructions
1. Retrieve all calendar events for today
2. Sort events chronologically
3. For each event, extract: time, duration, title, location (if any), and attendees
4. Identify events requiring preparation (presentations, external meetings, reviews)
5. Flag any back-to-back meetings with less than 10 minutes between them
6. Note any events with missing dial-in links or addresses

## Output Format
**📅 Today — [Weekday, Date]**

**Your Day:**
- [HH:MM - HH:MM] [Event Title] @ [Location/Video Link] *(with X people)*

**Heads up:**
- [Any flagged issues]

**Free blocks:** [List of 30+ min free periods]
`,
  },

  {
    id: 'meeting-notes-processor',
    name: 'meeting-notes-processor',
    title: 'Meeting Notes Processor',
    description: 'Takes raw meeting notes and outputs a structured summary with action items',
    category: 'Productivity',
    tags: ['meetings', 'notes', 'action-items', 'summary'],
    permissions: ['read_files', 'write_files', 'send_messages'],
    channels: ['all'],
    content: `---
name: "meeting-notes-processor"
description: "Process my meeting notes and extract action items"
version: "1.0.0"
author: "clawcraft-templates"
tags: ["meetings", "notes", "action-items"]
trigger: "slash"
permissions: ["read_files", "write_files", "send_messages"]
---

## Purpose
Transform raw meeting notes into a structured summary with clearly identified action items, decisions, and owners.

## Instructions
1. Accept raw meeting notes as input (pasted text or file path)
2. Extract: meeting title, date, attendees, and duration (if mentioned)
3. Identify and list all decisions made during the meeting
4. Extract all action items. For each action item, identify: task, owner (if named), and deadline (if mentioned)
5. List discussion topics covered without decisions
6. Note any follow-up meetings or dates mentioned
7. Format the output as a structured summary
8. Ask the user if they want the summary emailed to attendees

## Guardrails
- Never send to attendees without explicit confirmation
- If notes are unclear or incomplete, list assumptions made
- Ask for clarification if action item ownership is ambiguous

## Output Format
**Meeting Summary: [Title]**
**Date:** [Date] | **Attendees:** [Names]

**Decisions:**
- [Decision 1]

**Action Items:**
- [ ] [Task] — Owner: [Name] — Due: [Date]

**Discussion Topics:**
- [Topic]
`,
  },

  {
    id: 'task-prioritizer',
    name: 'task-prioritizer',
    title: 'Task Prioritizer',
    description: 'Reads emails and extracts action items ranked by urgency',
    category: 'Productivity',
    tags: ['tasks', 'email', 'priority', 'productivity'],
    permissions: ['read_email'],
    channels: ['all'],
    content: `---
name: "task-prioritizer"
description: "What tasks do I need to do today based on my emails?"
version: "1.0.0"
author: "clawcraft-templates"
tags: ["tasks", "email", "priority"]
trigger: "slash"
permissions: ["read_email"]
---

## Purpose
Scan recent emails and extract a prioritized task list.

## Instructions
1. Read the last 50 unread emails
2. Extract any action items, requests, deadlines, or asks
3. Score each item by urgency (has deadline today = critical, this week = high, next week = medium, no deadline = low)
4. Deduplicate similar requests
5. Present ranked list with source email reference
6. Ask if any item should be added to the calendar

## Guardrails
- Never respond to emails
- Only extract, never assume
- If an email has no action item, skip it

## Output Format
Numbered list sorted by urgency with emoji indicators: 🔴 Critical, 🟠 High, 🟡 Medium, ⚪ Low
`,
  },

  {
    id: 'weekly-review-generator',
    name: 'weekly-review-generator',
    title: 'Weekly Review Generator',
    description: "Compiles weekly accomplishments and next week's priorities",
    category: 'Productivity',
    tags: ['weekly', 'review', 'retrospective', 'planning'],
    permissions: ['read_email', 'read_calendar', 'read_files'],
    channels: ['all'],
    content: `---
name: "weekly-review-generator"
description: "Generate my weekly review for this week"
version: "1.0.0"
author: "clawcraft-templates"
tags: ["weekly", "review", "planning"]
trigger: "scheduled"
schedule: "0 17 * * 5"
permissions: ["read_email", "read_calendar", "read_files"]
---

## Purpose
Every Friday at 5pm, compile a comprehensive weekly review.

## Instructions
1. Retrieve all calendar events from the past 7 days
2. Read emails sent this week to identify completed tasks
3. List meetings attended and their outcomes
4. Identify projects progressed this week
5. Compile incomplete items carrying over to next week
6. List upcoming events and deadlines for next week
7. Ask the user to add any accomplishments not captured automatically

## Output Format
**Weekly Review: Week of [Date]**

**This Week's Wins:**
**Meetings & Outcomes:**
**Carried Forward:**
**Next Week Preview:**
`,
  },

  {
    id: 'inbox-zero-assistant',
    name: 'inbox-zero-assistant',
    title: 'Inbox Zero Assistant',
    description: 'Categorizes and drafts replies for unread emails',
    category: 'Productivity',
    tags: ['email', 'inbox', 'replies', 'organization'],
    permissions: ['read_email', 'write_email'],
    channels: ['all'],
    content: `---
name: "inbox-zero-assistant"
description: "Help me get to inbox zero"
version: "1.0.0"
author: "clawcraft-templates"
tags: ["email", "inbox", "zero"]
trigger: "slash"
permissions: ["read_email", "write_email"]
---

## Purpose
Process the inbox systematically, draft replies for emails that need responses, and categorize the rest.

## Instructions
1. Retrieve all unread emails
2. For each email, classify as: Reply needed, Forward needed, Archive (no action), Unsubscribe candidate
3. For "Reply needed" emails, draft a professional response
4. Show each draft to the user for approval before sending
5. Never send without explicit approval
6. Mark approved-and-sent emails as read

## Guardrails
- Always show draft before sending
- Never unsubscribe without confirmation
- Never delete emails, only archive
- Stop if more than 50 emails to process — ask for scope confirmation

## Output Format
Present one email at a time with suggested action and draft reply if applicable.
`,
  },

  {
    id: 'end-of-day-wrap-up',
    name: 'end-of-day-wrap-up',
    title: 'End of Day Wrap-Up',
    description: "Summarizes what was accomplished and prepares tomorrow's task list",
    category: 'Productivity',
    tags: ['daily', 'wrap-up', 'planning', 'scheduled'],
    permissions: ['read_calendar', 'read_email', 'send_messages'],
    channels: ['all'],
    content: `---
name: "end-of-day-wrap-up"
description: "Give me my end of day summary and tomorrow's plan"
version: "1.0.0"
author: "clawcraft-templates"
tags: ["daily", "wrap-up", "tomorrow"]
trigger: "scheduled"
schedule: "0 18 * * 1-5"
permissions: ["read_calendar", "read_email", "send_messages"]
---

## Purpose
At 6pm on weekdays, generate an end-of-day summary and prepare a plan for tomorrow.

## Instructions
1. Review calendar events that occurred today
2. Scan emails received today for outstanding action items
3. List what was accomplished today
4. List outstanding items not completed
5. Preview tomorrow's calendar
6. Suggest 3 priority items for tomorrow based on outstanding tasks and calendar
7. Ask if there's anything else to add or note

## Output Format
**End of Day — [Date]**
**Done today:** ...
**Still open:** ...
**Tomorrow's top 3:** ...
**Tomorrow's schedule:** ...
`,
  },

  {
    id: 'reading-list-manager',
    name: 'reading-list-manager',
    title: 'Reading List Manager',
    description: 'Saves and organizes articles for later reading',
    category: 'Productivity',
    tags: ['reading', 'articles', 'bookmarks', 'organization'],
    permissions: ['write_files', 'browse_web'],
    channels: ['all'],
    content: `---
name: "reading-list-manager"
description: "Save this article to my reading list"
version: "1.0.0"
author: "clawcraft-templates"
tags: ["reading", "articles", "bookmarks"]
trigger: "slash"
permissions: ["write_files", "browse_web"]
---

## Purpose
Save articles, URLs, and links to a local reading list with automatic title extraction and tagging.

## Instructions
1. Accept a URL as input
2. Fetch the page title and description
3. Ask the user for tags (or suggest based on content)
4. Ask for priority: read today / this week / someday
5. Append to ~/.openclaw/reading-list.md in the format: [date] [title](url) — tags — priority
6. Confirm save with the article title

## Guardrails
- Never open URLs in a browser without instruction
- If page is behind paywall, save the URL anyway with a note
- Maximum 5 seconds to fetch metadata, then proceed without it

## Output Format
Confirmation message: "Saved: [Title] — tagged [tags] — priority: [priority]"
`,
  },

  {
    id: 'news-digest',
    name: 'news-digest',
    title: 'News Digest',
    description: 'Compiles personalized news summary from RSS feeds',
    category: 'Productivity',
    tags: ['news', 'rss', 'digest', 'morning'],
    permissions: ['browse_web', 'send_messages'],
    channels: ['all'],
    content: `---
name: "news-digest"
description: "Give me a news digest for today"
version: "1.0.0"
author: "clawcraft-templates"
tags: ["news", "rss", "digest"]
trigger: "slash"
permissions: ["browse_web", "send_messages"]
---

## Purpose
Fetch and summarize news from configured RSS feeds or major news sources.

## Instructions
1. Accept optional topic filters (e.g., "tech, AI, business")
2. Fetch headlines from configured news sources or default to: Hacker News, BBC Tech, Reuters
3. Filter by topic if specified
4. Group by topic area
5. For each story: headline, one-sentence summary, source
6. Limit to top 10 stories total
7. End with "Full stories available at [sources]"

## Output Format
**📰 News Digest — [Date]**
**[Topic]:** [Headline] — [Summary] *(Source)*
`,
  },

  {
    id: 'focus-mode-activator',
    name: 'focus-mode-activator',
    title: 'Focus Mode Activator',
    description: 'Sets do not disturb and prepares environment for deep work',
    category: 'Productivity',
    tags: ['focus', 'dnd', 'productivity', 'distraction-free'],
    permissions: ['send_messages'],
    channels: ['all'],
    content: `---
name: "focus-mode-activator"
description: "Start a focus session"
version: "1.0.0"
author: "clawcraft-templates"
tags: ["focus", "deep-work", "productivity"]
trigger: "slash"
permissions: ["send_messages"]
---

## Purpose
Initiate a timed focus session with appropriate setup and a check-in at the end.

## Instructions
1. Ask how long the focus session should be (default: 90 minutes)
2. Ask what the user wants to accomplish in this session
3. Send a focus session start confirmation
4. Set a timer for the specified duration
5. At the end of the session, send a check-in asking if the goal was achieved
6. Log the session outcome

## Output Format
"🎯 Focus session started: [Goal] — [Duration]. I'll check in at [end time]. Good focus!"
`,
  },

  // ─── DEVELOPER ────────────────────────────────────────────────────────────
  {
    id: 'pr-review-assistant',
    name: 'pr-review-assistant',
    title: 'PR Review Assistant',
    description: 'Reviews pull requests and leaves structured comments',
    category: 'Developer',
    tags: ['git', 'github', 'pr', 'code-review'],
    permissions: ['browse_web', 'execute'],
    channels: ['all'],
    content: `---
name: "pr-review-assistant"
description: "Review this pull request"
version: "1.0.0"
author: "clawcraft-templates"
tags: ["github", "pr", "code-review"]
trigger: "slash"
permissions: ["browse_web", "execute"]
---

## Purpose
Perform a thorough code review of a pull request and generate structured feedback.

## Instructions
1. Accept PR URL or number as input
2. Fetch the PR diff and description
3. Review for: logic errors, security vulnerabilities, missing tests, style inconsistencies, performance issues
4. Check if the PR description matches the actual changes
5. Categorize feedback as: Must fix (blockers), Should fix (improvements), Consider (suggestions)
6. Check for: exposed secrets, SQL injection, XSS vulnerabilities, unhandled errors
7. Generate review summary with overall assessment
8. Ask before posting comments to GitHub

## Guardrails
- Never approve or merge PRs automatically
- Always show review before posting
- Flag security issues as highest priority

## Output Format
Structured review with categories: 🔴 Must Fix, 🟠 Should Fix, 💡 Consider
`,
  },

  {
    id: 'commit-message-writer',
    name: 'commit-message-writer',
    title: 'Commit Message Writer',
    description: 'Generates conventional commit messages from git diff',
    category: 'Developer',
    tags: ['git', 'commit', 'conventional-commits'],
    permissions: ['execute'],
    channels: ['all'],
    content: `---
name: "commit-message-writer"
description: "Write a commit message for my staged changes"
version: "1.0.0"
author: "clawcraft-templates"
tags: ["git", "commit", "conventional-commits"]
trigger: "slash"
permissions: ["execute"]
---

## Purpose
Generate a conventional commit message from the current git diff.

## Instructions
1. Run git diff --staged to get staged changes
2. If nothing is staged, run git diff and suggest staging before committing
3. Analyze the changes: what files changed, what was added/removed/modified
4. Determine the commit type: feat, fix, docs, style, refactor, test, chore
5. Generate: type(scope): short description [under 72 chars]
6. Add body explaining WHY the change was made if it's non-obvious
7. Present to user for confirmation before using
8. If approved, run git commit -m "[message]"

## Guardrails
- Never commit without user confirmation
- Never use --no-verify
- Warn if committing sensitive file types (.env, .pem, id_rsa)

## Output Format
\`\`\`
type(scope): short description

Longer explanation if needed.
\`\`\`
`,
  },

  {
    id: 'ci-failure-summarizer',
    name: 'ci-failure-summarizer',
    title: 'CI Failure Summarizer',
    description: 'Reads CI logs and explains what failed and why',
    category: 'Developer',
    tags: ['ci', 'github-actions', 'debugging', 'logs'],
    permissions: ['browse_web'],
    channels: ['all'],
    content: `---
name: "ci-failure-summarizer"
description: "Why did my CI fail?"
version: "1.0.0"
author: "clawcraft-templates"
tags: ["ci", "github-actions", "debugging"]
trigger: "slash"
permissions: ["browse_web"]
---

## Purpose
Fetch CI failure logs and explain what went wrong in plain English with a fix suggestion.

## Instructions
1. Accept a CI run URL or ask for the repository and branch
2. Fetch the failed job logs
3. Identify the first error that caused the failure
4. Explain in plain English: what failed, why it likely failed, how to fix it
5. If it's a flaky test, note it
6. If it's a dependency issue, suggest the fix command

## Output Format
**CI Failure Summary**
**Failed step:** [step name]
**Error:** [plain English explanation]
**Likely cause:** [root cause]
**Fix:** [specific command or action]
`,
  },

  {
    id: 'release-notes-generator',
    name: 'release-notes-generator',
    title: 'Release Notes Generator',
    description: 'Compiles release notes from merged PRs and commits',
    category: 'Developer',
    tags: ['release', 'changelog', 'github'],
    permissions: ['execute', 'browse_web'],
    channels: ['all'],
    content: `---
name: "release-notes-generator"
description: "Generate release notes for the new version"
version: "1.0.0"
author: "clawcraft-templates"
tags: ["release", "changelog", "github"]
trigger: "slash"
permissions: ["execute", "browse_web"]
---

## Purpose
Generate comprehensive release notes from git history and merged PRs.

## Instructions
1. Ask for version number (e.g., v1.2.0)
2. Run git log to get commits since last tag
3. Group commits by type: New Features, Bug Fixes, Improvements, Breaking Changes
4. For any breaking changes, add upgrade instructions
5. Format as markdown suitable for GitHub releases
6. Present for review before publishing

## Output Format
## [Version] — [Date]
### New Features
### Bug Fixes
### Improvements
### Breaking Changes
`,
  },

  {
    id: 'github-issue-triage',
    name: 'github-issue-triage',
    title: 'GitHub Issue Triage',
    description: 'Categorizes and prioritizes open issues by type and urgency',
    category: 'Developer',
    tags: ['github', 'issues', 'triage', 'project-management'],
    permissions: ['browse_web'],
    channels: ['all'],
    content: `---
name: "github-issue-triage"
description: "Triage my open GitHub issues"
version: "1.0.0"
author: "clawcraft-templates"
tags: ["github", "issues", "triage"]
trigger: "slash"
permissions: ["browse_web"]
---

## Purpose
Review and triage open GitHub issues for a repository.

## Instructions
1. Accept repository name or URL
2. Fetch open issues
3. Categorize each as: Bug, Feature Request, Question, Documentation, Duplicate, Stale
4. Priority score based on: reactions count, comments, labels, age
5. List top 10 by priority with brief description
6. Identify duplicates
7. Flag issues that look like security reports — these are high priority

## Output Format
Prioritized table with: Issue #, Title, Category, Priority, Age, Reactions
`,
  },

  {
    id: 'dependency-checker',
    name: 'dependency-checker',
    title: 'Dependency Checker',
    description: 'Scans package.json for outdated or vulnerable dependencies',
    category: 'Developer',
    tags: ['dependencies', 'security', 'npm', 'audit'],
    permissions: ['execute', 'read_files'],
    channels: ['all'],
    content: `---
name: "dependency-checker"
description: "Check my dependencies for vulnerabilities"
version: "1.0.0"
author: "clawcraft-templates"
tags: ["dependencies", "security", "npm", "audit"]
trigger: "slash"
permissions: ["execute", "read_files"]
---

## Purpose
Audit project dependencies for vulnerabilities and outdated packages.

## Instructions
1. Read package.json in current directory
2. Run npm audit and capture output
3. Run npm outdated and capture output
4. Summarize: critical vulns, high vulns, outdated packages
5. For each critical/high vulnerability, provide: package name, vulnerability, affected version, fix version
6. Suggest specific update commands
7. Warn about major version updates that may have breaking changes

## Guardrails
- Never run npm install or npm update without user confirmation
- Flag major version upgrades for manual review

## Output Format
**Dependency Report**
🔴 Critical: X | 🟠 High: X | 🟡 Medium: X
Outdated: X packages
[Detailed list with fix commands]
`,
  },

  {
    id: 'documentation-writer',
    name: 'documentation-writer',
    title: 'Documentation Writer',
    description: 'Generates README sections from code structure',
    category: 'Developer',
    tags: ['docs', 'readme', 'documentation'],
    permissions: ['read_files', 'write_files'],
    channels: ['all'],
    content: `---
name: "documentation-writer"
description: "Write documentation for this code"
version: "1.0.0"
author: "clawcraft-templates"
tags: ["docs", "readme", "documentation"]
trigger: "slash"
permissions: ["read_files", "write_files"]
---

## Purpose
Generate clear, comprehensive documentation from code files.

## Instructions
1. Accept a file path or directory as input
2. Read the code files
3. Identify: public functions, classes, exported interfaces, main entry points
4. Generate documentation including: purpose, parameters, return values, examples
5. Create or update README.md
6. Ask before writing to file

## Guardrails
- Never overwrite existing documentation without showing a diff first
- Ask for confirmation before writing any files

## Output Format
Markdown documentation in JSDoc / TSDoc / docstring style as appropriate for the language.
`,
  },

  {
    id: 'bug-report-formatter',
    name: 'bug-report-formatter',
    title: 'Bug Report Formatter',
    description: 'Takes rough bug descriptions and formats them properly',
    category: 'Developer',
    tags: ['bugs', 'issues', 'reporting'],
    permissions: [],
    channels: ['all'],
    content: `---
name: "bug-report-formatter"
description: "Format this bug report properly"
version: "1.0.0"
author: "clawcraft-templates"
tags: ["bugs", "reporting", "issues"]
trigger: "slash"
permissions: []
---

## Purpose
Transform rough bug descriptions into properly formatted, reproducible bug reports.

## Instructions
1. Accept a rough bug description as input
2. Ask for missing information: expected behavior, actual behavior, steps to reproduce, environment
3. Format into a standard bug report template
4. Suggest a severity level based on impact description
5. Ask if the user wants to create a GitHub issue with this content

## Output Format
**Bug Report: [Title]**
**Severity:** [Critical/High/Medium/Low]
**Steps to Reproduce:**
1. ...
**Expected:** ...
**Actual:** ...
**Environment:** OS, version, etc.
`,
  },

  {
    id: 'deploy-checklist',
    name: 'deploy-checklist',
    title: 'Deploy Checklist',
    description: 'Runs through pre-deployment verification steps',
    category: 'Developer',
    tags: ['deploy', 'checklist', 'devops', 'release'],
    permissions: ['execute'],
    channels: ['all'],
    content: `---
name: "deploy-checklist"
description: "Run my pre-deployment checklist"
version: "1.0.0"
author: "clawcraft-templates"
tags: ["deploy", "checklist", "devops"]
trigger: "slash"
permissions: ["execute"]
---

## Purpose
Run through a comprehensive pre-deployment checklist before releasing to production.

## Instructions
1. Run tests: npm test — report pass/fail
2. Run build: npm run build — report success/errors
3. Check for any .env.example changes vs .env
4. Check git status — warn if uncommitted changes
5. Verify no console.log or debug statements in changed files
6. Check that all environment variables are documented
7. Run security audit: npm audit
8. Present a go/no-go recommendation

## Guardrails
- Never run the actual deployment — only the checklist
- Stop and block if tests fail

## Output Format
Checklist with ✅ / ❌ / ⚠️ for each step, final GO / NO-GO recommendation
`,
  },

  {
    id: 'code-review-checklist',
    name: 'code-review-checklist',
    title: 'Code Review Checklist',
    description: 'Runs a security and quality checklist on any code file',
    category: 'Developer',
    tags: ['code-review', 'security', 'quality'],
    permissions: ['read_files'],
    channels: ['all'],
    content: `---
name: "code-review-checklist"
description: "Run a code review checklist on this file"
version: "1.0.0"
author: "clawcraft-templates"
tags: ["code-review", "security", "quality"]
trigger: "slash"
permissions: ["read_files"]
---

## Purpose
Run a comprehensive code review checklist on a specific file.

## Instructions
1. Accept file path as input
2. Read the file
3. Check for: hardcoded secrets, SQL injection, XSS, command injection, missing input validation, unhandled errors, TODO/FIXME comments, dead code, overly complex functions (>50 lines)
4. Report each finding with line number and explanation
5. Score overall code quality: A-F

## Output Format
Checklist results with line references and severity levels.
`,
  },

  // ─── SMART HOME ───────────────────────────────────────────────────────────
  {
    id: 'morning-routine-trigger',
    name: 'morning-routine-trigger',
    title: 'Morning Routine Trigger',
    description: 'Runs a sequence of home automations at wake time',
    category: 'Smart Home',
    tags: ['smart-home', 'morning', 'routine', 'automation'],
    permissions: ['execute', 'browse_web'],
    channels: ['all'],
    content: `---
name: "morning-routine-trigger"
description: "Start my morning routine"
version: "1.0.0"
author: "clawcraft-templates"
tags: ["smart-home", "morning", "routine"]
trigger: "slash"
permissions: ["execute", "browse_web"]
---

## Purpose
Trigger a customizable morning routine sequence.

## Instructions
1. Greet the user with good morning and today's date
2. Report today's weather (ask for location on first run, store it)
3. Send morning briefing (calendar + email summary)
4. Provide an optional motivational message or quote
5. Ask if any routine steps should be skipped today

## Output Format
Friendly morning greeting followed by structured daily brief.
`,
  },

  {
    id: 'energy-usage-reporter',
    name: 'energy-usage-reporter',
    title: 'Energy Usage Reporter',
    description: 'Pulls smart meter data and reports weekly usage',
    category: 'Smart Home',
    tags: ['energy', 'smart-home', 'monitoring', 'weekly'],
    permissions: ['browse_web', 'send_messages'],
    channels: ['all'],
    content: `---
name: "energy-usage-reporter"
description: "Show me my energy usage this week"
version: "1.0.0"
author: "clawcraft-templates"
tags: ["energy", "smart-home", "monitoring"]
trigger: "scheduled"
schedule: "0 9 * * 1"
permissions: ["browse_web", "send_messages"]
---

## Purpose
Retrieve and report weekly home energy usage statistics.

## Instructions
1. Connect to configured smart meter API or home assistant instance
2. Retrieve energy usage for the past 7 days
3. Compare to previous week and monthly average
4. Identify highest usage days and times
5. Suggest energy-saving actions if usage is high
6. Send weekly report

## Output Format
**⚡ Weekly Energy Report**
This week: X kWh (+/-X% vs last week)
Peak usage: [day/time]
Estimated cost: $X
Tip: [energy saving suggestion]
`,
  },

  {
    id: 'grocery-list-builder',
    name: 'grocery-list-builder',
    title: 'Grocery List Builder',
    description: 'Tracks what runs out and builds a shopping list',
    category: 'Smart Home',
    tags: ['shopping', 'grocery', 'inventory', 'household'],
    permissions: ['read_files', 'write_files', 'send_messages'],
    channels: ['all'],
    content: `---
name: "grocery-list-builder"
description: "Add to my grocery list"
version: "1.0.0"
author: "clawcraft-templates"
tags: ["shopping", "grocery", "list"]
trigger: "slash"
permissions: ["read_files", "write_files", "send_messages"]
---

## Purpose
Maintain a running grocery list and send it when needed.

## Instructions
1. Accept items as input to add to the list
2. Store list in ~/.openclaw/grocery-list.txt
3. On /grocery list — show current list
4. On /grocery send — send list via messaging
5. On /grocery clear [item] — remove item
6. Group items by category automatically (produce, dairy, etc.)

## Output Format
Organized grocery list grouped by store section.
`,
  },

  {
    id: 'security-check',
    name: 'security-check',
    title: 'Home Security Check',
    description: 'Reviews camera logs and door sensor activity nightly',
    category: 'Smart Home',
    tags: ['security', 'smart-home', 'monitoring', 'cameras'],
    permissions: ['browse_web', 'send_messages'],
    channels: ['all'],
    content: `---
name: "security-check"
description: "Run my nightly security check"
version: "1.0.0"
author: "clawcraft-templates"
tags: ["security", "smart-home", "cameras"]
trigger: "scheduled"
schedule: "0 23 * * *"
permissions: ["browse_web", "send_messages"]
---

## Purpose
Perform a nightly review of home security system activity.

## Instructions
1. Connect to home security API/home assistant
2. Check all door/window sensor activity since last check
3. Review motion detection events
4. Note any unusual activity patterns
5. Send summary — only alert if unusual activity found
6. If critical alert detected, send urgent notification

## Guardrails
- Never disable security devices
- Always send alerts for unauthorized entry events immediately

## Output Format
Brief nightly summary: "All clear" or detailed alert list.
`,
  },

  {
    id: 'plant-watering-reminder',
    name: 'plant-watering-reminder',
    title: 'Plant Watering Reminder',
    description: 'Tracks watering schedules for houseplants',
    category: 'Smart Home',
    tags: ['plants', 'reminder', 'schedule', 'household'],
    permissions: ['read_files', 'write_files', 'send_messages'],
    channels: ['all'],
    content: `---
name: "plant-watering-reminder"
description: "Which plants need watering today?"
version: "1.0.0"
author: "clawcraft-templates"
tags: ["plants", "reminder", "watering"]
trigger: "scheduled"
schedule: "0 9 * * *"
permissions: ["read_files", "write_files", "send_messages"]
---

## Purpose
Track plant watering schedules and send daily reminders.

## Instructions
1. Read plant database from ~/.openclaw/plants.json
2. Check which plants are due for watering today
3. Send reminder listing plants that need water
4. On /water [plant-name] — mark plant as watered today and update schedule
5. On /plant add [name] [frequency-days] — add new plant

## Output Format
"🌱 Water today: [plant1], [plant2]" or "All plants are watered!"
`,
  },

  {
    id: 'evening-wind-down',
    name: 'evening-wind-down',
    title: 'Evening Wind-Down',
    description: 'Dims lights, adjusts temperature, plays relaxing content',
    category: 'Smart Home',
    tags: ['evening', 'smart-home', 'routine', 'relaxation'],
    permissions: ['execute', 'browse_web'],
    channels: ['all'],
    content: `---
name: "evening-wind-down"
description: "Start my evening wind-down routine"
version: "1.0.0"
author: "clawcraft-templates"
tags: ["evening", "wind-down", "routine"]
trigger: "slash"
permissions: ["execute", "browse_web"]
---

## Purpose
Initiate an evening wind-down sequence to prepare for rest.

## Instructions
1. Confirm the user wants to start wind-down
2. Set home assistant scene to "evening" (dimmed lights, warm temperature)
3. Send tomorrow's calendar preview
4. Ask if there's anything outstanding from today
5. Set a gentle wake alarm for tomorrow
6. Send a good night message

## Output Format
Friendly confirmation of each step, ending with goodnight message.
`,
  },

  {
    id: 'presence-automation',
    name: 'presence-automation',
    title: 'Presence-Based Automation',
    description: 'Adjusts home settings based on who is home',
    category: 'Smart Home',
    tags: ['smart-home', 'presence', 'automation'],
    permissions: ['browse_web', 'execute'],
    channels: ['all'],
    content: `---
name: "presence-automation"
description: "Set home mode for who is here"
version: "1.0.0"
author: "clawcraft-templates"
tags: ["smart-home", "presence", "automation"]
trigger: "slash"
permissions: ["browse_web", "execute"]
---

## Purpose
Adjust home automation settings based on the current occupancy.

## Instructions
1. Accept mode: home-alone, family, guest, away, sleep
2. Apply the appropriate home assistant scene for the mode
3. Confirm changes made
4. Log the mode change with timestamp

## Output Format
"Home mode set to [mode]: [list of changes made]"
`,
  },

  {
    id: 'visitor-greeter',
    name: 'visitor-greeter',
    title: 'Visitor Greeter',
    description: 'Sends notifications and adjusts settings when guests arrive',
    category: 'Smart Home',
    tags: ['smart-home', 'visitors', 'doorbell', 'guests'],
    permissions: ['browse_web', 'send_messages'],
    channels: ['all'],
    content: `---
name: "visitor-greeter"
description: "Someone is at the door"
version: "1.0.0"
author: "clawcraft-templates"
tags: ["smart-home", "visitors", "doorbell"]
trigger: "slash"
permissions: ["browse_web", "send_messages"]
---

## Purpose
When a visitor arrives, adjust home settings and notify household members.

## Instructions
1. Check doorbell camera for visitor identity (if available)
2. Notify all household members via messaging
3. Set home mode to "guest" (adjust lights, music, temperature)
4. Ask if the user wants to unlock the door
5. Never unlock without explicit "yes" confirmation

## Guardrails
- Never unlock doors automatically
- Always confirm identity before any access decisions

## Output Format
Alert message: "Visitor at door: [description]. Unlock? [Yes/No]"
`,
  },

  // ─── BUSINESS ─────────────────────────────────────────────────────────────
  {
    id: 'daily-standup-facilitator',
    name: 'daily-standup-facilitator',
    title: 'Daily Standup Facilitator',
    description: 'Collects updates from team and compiles standup summary',
    category: 'Business',
    tags: ['standup', 'team', 'agile', 'daily'],
    permissions: ['send_messages', 'read_email'],
    channels: ['slack', 'discord'],
    content: `---
name: "daily-standup-facilitator"
description: "Run today's standup"
version: "1.0.0"
author: "clawcraft-templates"
tags: ["standup", "team", "agile"]
trigger: "scheduled"
schedule: "0 9 * * 1-5"
permissions: ["send_messages", "read_email"]
channels: ["slack", "discord"]
---

## Purpose
Facilitate a daily async standup by collecting team updates and compiling a summary.

## Instructions
1. Send standup prompt to configured team channel: "🌅 Daily Standup — [Date]. Please share: ✅ Done ⏩ Doing 🚧 Blockers"
2. Collect responses for 30 minutes
3. Compile into a summary message
4. Highlight any blockers mentioned
5. Post summary in the channel

## Guardrails
- Never impersonate team members
- Don't post twice if standup already happened today

## Output Format
**Standup Summary — [Date]**
[Team member]: Done X, Working on Y, Blocked by Z
**Blockers:** ...
`,
  },

  {
    id: 'weekly-report-generator',
    name: 'weekly-report-generator',
    title: 'Weekly Report Generator',
    description: 'Compiles weekly metrics and sends to stakeholders',
    category: 'Business',
    tags: ['reports', 'metrics', 'weekly', 'stakeholders'],
    permissions: ['read_files', 'send_messages', 'browse_web'],
    channels: ['all'],
    content: `---
name: "weekly-report-generator"
description: "Generate this week's business report"
version: "1.0.0"
author: "clawcraft-templates"
tags: ["reports", "metrics", "weekly"]
trigger: "scheduled"
schedule: "0 17 * * 5"
permissions: ["read_files", "send_messages", "browse_web"]
---

## Purpose
Every Friday, compile key business metrics into a weekly report for stakeholders.

## Instructions
1. Gather metrics from configured sources
2. Compare to last week and monthly averages
3. Note top wins and challenges
4. Generate executive summary (3 bullet points max)
5. Show full report to user before sending
6. Send only with explicit approval

## Guardrails
- Always show report before sending
- Never send to external stakeholders automatically

## Output Format
**Weekly Report: Week of [Date]**
**Executive Summary:** ...
**Key Metrics:** ...
**Wins:** ...
**Challenges:** ...
`,
  },

  {
    id: 'invoice-reminder',
    name: 'invoice-reminder',
    title: 'Invoice Reminder',
    description: 'Checks for unpaid invoices and sends follow-up emails',
    category: 'Business',
    tags: ['invoices', 'billing', 'follow-up', 'finance'],
    permissions: ['read_email', 'write_email', 'browse_web'],
    channels: ['all'],
    content: `---
name: "invoice-reminder"
description: "Check my unpaid invoices and send reminders"
version: "1.0.0"
author: "clawcraft-templates"
tags: ["invoices", "billing", "follow-up"]
trigger: "scheduled"
schedule: "0 9 * * 1"
permissions: ["read_email", "write_email", "browse_web"]
---

## Purpose
Check for overdue invoices and send polite payment reminders.

## Instructions
1. Connect to configured invoicing system or read invoice emails
2. Find invoices overdue by 7+ days
3. Draft a polite payment reminder for each
4. Show drafts to user before sending
5. Log reminder sent with timestamp
6. Never send more than one reminder per week per invoice

## Guardrails
- Always show draft before sending
- Never threaten or use aggressive language
- Maximum one reminder per invoice per week

## Output Format
Draft reminder email for review, followed by confirmation when sent.
`,
  },

  {
    id: 'customer-feedback-summarizer',
    name: 'customer-feedback-summarizer',
    title: 'Customer Feedback Summarizer',
    description: 'Aggregates feedback and identifies themes',
    category: 'Business',
    tags: ['feedback', 'customers', 'analysis', 'themes'],
    permissions: ['read_email', 'browse_web', 'read_files'],
    channels: ['all'],
    content: `---
name: "customer-feedback-summarizer"
description: "Summarize recent customer feedback"
version: "1.0.0"
author: "clawcraft-templates"
tags: ["feedback", "customers", "analysis"]
trigger: "slash"
permissions: ["read_email", "browse_web", "read_files"]
---

## Purpose
Collect and analyze customer feedback to identify themes and trends.

## Instructions
1. Read feedback from configured sources (email, file, or support system)
2. Identify recurring themes and topics
3. Score overall sentiment: positive, neutral, negative
4. Rank top 5 most mentioned issues
5. Identify top 5 most praised aspects
6. Suggest one action item per major issue

## Output Format
**Feedback Analysis**
**Overall Sentiment:** X% positive
**Top Issues:** ...
**Top Praise:** ...
**Recommended Actions:** ...
`,
  },

  {
    id: 'lead-followup-tracker',
    name: 'lead-followup-tracker',
    title: 'Lead Follow-Up Tracker',
    description: 'Monitors CRM and reminds about pending follow-ups',
    category: 'Business',
    tags: ['crm', 'sales', 'leads', 'follow-up'],
    permissions: ['browse_web', 'send_messages', 'read_email'],
    channels: ['all'],
    content: `---
name: "lead-followup-tracker"
description: "Which leads need follow-up today?"
version: "1.0.0"
author: "clawcraft-templates"
tags: ["crm", "sales", "leads"]
trigger: "scheduled"
schedule: "0 8 * * 1-5"
permissions: ["browse_web", "send_messages", "read_email"]
---

## Purpose
Review CRM or email threads for leads that need follow-up action.

## Instructions
1. Check configured CRM for leads with no activity in 3+ days
2. Check email for unanswered prospect emails
3. Prioritize by deal value or recency
4. List top 5 leads needing attention with last contact date
5. Draft a follow-up for the top lead for review

## Output Format
**Follow-Up List — [Date]**
1. [Lead Name] — Last contact: [date] — Suggested action: [action]
`,
  },

  {
    id: 'expense-tracker',
    name: 'expense-tracker',
    title: 'Expense Tracker',
    description: 'Categorizes expenses from receipts and updates spreadsheet',
    category: 'Business',
    tags: ['expenses', 'finance', 'receipts', 'accounting'],
    permissions: ['read_email', 'write_files'],
    channels: ['all'],
    content: `---
name: "expense-tracker"
description: "Log this expense"
version: "1.0.0"
author: "clawcraft-templates"
tags: ["expenses", "finance", "receipts"]
trigger: "slash"
permissions: ["read_email", "write_files"]
---

## Purpose
Log and categorize business expenses from receipts or manual input.

## Instructions
1. Accept expense: amount, vendor, and optional description
2. Suggest category: Travel, Meals, Software, Equipment, Marketing, Other
3. Ask user to confirm category
4. Append to ~/.openclaw/expenses.csv with: date, amount, vendor, category, description
5. Weekly: send expense summary totals by category

## Output Format
"Logged: $[amount] at [vendor] — [category]"
Monthly totals on request.
`,
  },

  {
    id: 'project-status-updater',
    name: 'project-status-updater',
    title: 'Project Status Updater',
    description: 'Compiles project progress and sends status email',
    category: 'Business',
    tags: ['project', 'status', 'updates', 'management'],
    permissions: ['read_files', 'write_email', 'send_messages'],
    channels: ['all'],
    content: `---
name: "project-status-updater"
description: "Send a project status update"
version: "1.0.0"
author: "clawcraft-templates"
tags: ["project", "status", "updates"]
trigger: "slash"
permissions: ["read_files", "write_email", "send_messages"]
---

## Purpose
Generate and send a project status update.

## Instructions
1. Ask: project name, what's complete, what's in progress, blockers, next milestone
2. Format into a professional status update
3. Show to user for review
4. Ask for recipient list
5. Send via email when confirmed

## Output Format
**Project Status: [Project Name]**
**As of:** [Date]
**Complete:** ...
**In Progress:** ...
**Blockers:** ...
**Next Milestone:** [Date + deliverable]
`,
  },

  {
    id: 'competitor-monitor',
    name: 'competitor-monitor',
    title: 'Competitor Monitor',
    description: 'Tracks competitor announcements and summarizes weekly',
    category: 'Business',
    tags: ['competitors', 'monitoring', 'research', 'market'],
    permissions: ['browse_web', 'send_messages'],
    channels: ['all'],
    content: `---
name: "competitor-monitor"
description: "What are my competitors up to this week?"
version: "1.0.0"
author: "clawcraft-templates"
tags: ["competitors", "monitoring", "research"]
trigger: "scheduled"
schedule: "0 9 * * 1"
permissions: ["browse_web", "send_messages"]
---

## Purpose
Weekly monitor of competitor activity and announcements.

## Instructions
1. Read configured competitor list from ~/.openclaw/competitors.txt
2. Search for news, blog posts, and product updates from each
3. Summarize key developments from the past 7 days
4. Flag pricing changes, new features, or partnerships
5. Send weekly competitive intelligence brief

## Output Format
**Competitive Intel — Week of [Date]**
[Competitor]: [Key development]
`,
  },

  {
    id: 'onboarding-checklist',
    name: 'onboarding-checklist',
    title: 'Onboarding Checklist',
    description: 'Walks new team members through setup steps',
    category: 'Business',
    tags: ['onboarding', 'hr', 'team', 'setup'],
    permissions: ['send_messages'],
    channels: ['slack', 'discord'],
    content: `---
name: "onboarding-checklist"
description: "Start the onboarding process for a new team member"
version: "1.0.0"
author: "clawcraft-templates"
tags: ["onboarding", "hr", "team"]
trigger: "slash"
permissions: ["send_messages"]
---

## Purpose
Guide a new team member through the onboarding process.

## Instructions
1. Ask for new team member's name and start date
2. Send welcome message via configured channel
3. Walk through onboarding checklist: account setup, tool access, key contacts, first week schedule
4. Mark each item as complete when confirmed
5. Send summary of completed and pending items to manager

## Output Format
Interactive checklist with ✅ completed and ⬜ pending items.
`,
  },

  // ─── PERSONAL ─────────────────────────────────────────────────────────────
  {
    id: 'health-metrics-summary',
    name: 'health-metrics-summary',
    title: 'Health Metrics Summary',
    description: 'Pulls data from wearables and summarizes daily health',
    category: 'Personal',
    tags: ['health', 'fitness', 'wearables', 'daily'],
    permissions: ['browse_web', 'send_messages'],
    channels: ['all'],
    content: `---
name: "health-metrics-summary"
description: "Show me my health stats for today"
version: "1.0.0"
author: "clawcraft-templates"
tags: ["health", "fitness", "wearables"]
trigger: "slash"
permissions: ["browse_web", "send_messages"]
---

## Purpose
Retrieve and summarize daily health metrics from connected wearable or health app.

## Instructions
1. Connect to configured health data source (Apple Health, Fitbit, Garmin, etc. via configured API)
2. Retrieve today's data: steps, heart rate, sleep, calories, active minutes
3. Compare to personal goals and weekly averages
4. Note any anomalies (unusually high resting HR, low sleep, etc.)
5. Provide one health insight or tip based on the data

## Output Format
**💪 Health Summary — [Date]**
Steps: X/10,000 | Sleep: Xh Xm | HR: avg X | Calories: X
Insight: [personalized tip]
`,
  },

  {
    id: 'budget-tracker',
    name: 'budget-tracker',
    title: 'Budget Tracker',
    description: 'Monitors spending and alerts when approaching limits',
    category: 'Personal',
    tags: ['budget', 'finance', 'spending', 'money'],
    permissions: ['read_files', 'write_files', 'send_messages'],
    channels: ['all'],
    content: `---
name: "budget-tracker"
description: "Log a personal expense"
version: "1.0.0"
author: "clawcraft-templates"
tags: ["budget", "finance", "spending"]
trigger: "slash"
permissions: ["read_files", "write_files", "send_messages"]
---

## Purpose
Track personal spending against budget categories and alert when limits are approached.

## Instructions
1. Accept: amount, category, optional note
2. Log to ~/.openclaw/budget.json
3. Check if category budget is being approached (>80%) or exceeded
4. Send alert if over 80% of monthly budget
5. Weekly: send spending summary by category
6. Command: /budget status — show current month overview

## Output Format
"Logged $X for [category]. [Category] budget: $X/$X used (X%)"
`,
  },

  {
    id: 'language-learning',
    name: 'language-learning',
    title: 'Language Learning Prompt',
    description: 'Delivers daily vocabulary and grammar exercises',
    category: 'Personal',
    tags: ['language', 'learning', 'vocabulary', 'education'],
    permissions: ['send_messages'],
    channels: ['all'],
    content: `---
name: "language-learning"
description: "Give me my language lesson for today"
version: "1.0.0"
author: "clawcraft-templates"
tags: ["language", "learning", "vocabulary"]
trigger: "scheduled"
schedule: "0 9 * * *"
permissions: ["send_messages"]
---

## Purpose
Deliver daily language learning exercises tailored to the user's level.

## Instructions
1. Read user's language learning profile from ~/.openclaw/language-profile.json (create on first run by asking: target language, current level, focus areas)
2. Generate today's lesson: 5 new vocabulary words, 1 grammar rule, 2 practice sentences
3. Include pronunciation guides where possible
4. Track vocabulary already covered (don't repeat within 30 days)
5. After lesson, ask 2 quick quiz questions from previous lessons

## Output Format
**🗣️ [Language] Lesson — [Date]**
**New Words:** ...
**Grammar:** ...
**Practice:** ...
**Quick Quiz:** ...
`,
  },

  {
    id: 'habit-tracker',
    name: 'habit-tracker',
    title: 'Habit Tracker',
    description: 'Checks in on daily habits and logs completion',
    category: 'Personal',
    tags: ['habits', 'tracking', 'goals', 'daily'],
    permissions: ['read_files', 'write_files', 'send_messages'],
    channels: ['all'],
    content: `---
name: "habit-tracker"
description: "Check in on my habits for today"
version: "1.0.0"
author: "clawcraft-templates"
tags: ["habits", "tracking", "goals"]
trigger: "scheduled"
schedule: "0 20 * * *"
permissions: ["read_files", "write_files", "send_messages"]
---

## Purpose
Daily habit check-in to track consistency and streaks.

## Instructions
1. Read habit list from ~/.openclaw/habits.json (create on first run)
2. Ask which habits were completed today
3. Update completion log
4. Calculate and show current streaks
5. Congratulate on milestone streaks (7, 30, 100 days)
6. Note missed habits without judgment

## Output Format
**📊 Habit Check-In — [Date]**
[Habit]: ✅ [X day streak] / ❌ streak broken
Overall: X/X habits today
`,
  },

  {
    id: 'journal-prompt',
    name: 'journal-prompt',
    title: 'Journal Prompt',
    description: 'Generates personalized reflection questions each evening',
    category: 'Personal',
    tags: ['journal', 'reflection', 'mindfulness', 'writing'],
    permissions: ['write_files', 'send_messages'],
    channels: ['all'],
    content: `---
name: "journal-prompt"
description: "Give me my journaling prompt for tonight"
version: "1.0.0"
author: "clawcraft-templates"
tags: ["journal", "reflection", "mindfulness"]
trigger: "scheduled"
schedule: "0 21 * * *"
permissions: ["write_files", "send_messages"]
---

## Purpose
Generate thoughtful evening journal prompts and optionally save responses.

## Instructions
1. Select a journal prompt based on day of week and recent patterns
2. Present the prompt
3. Ask if the user wants to write their response here
4. If yes, collect response and append to ~/.openclaw/journal/[date].md
5. Acknowledge the response warmly

## Output Format
A single, thoughtful question followed by gentle invitation to respond.
`,
  },

  {
    id: 'birthday-reminder',
    name: 'birthday-reminder',
    title: 'Birthday Reminder',
    description: 'Alerts about upcoming birthdays with gift suggestions',
    category: 'Personal',
    tags: ['birthdays', 'reminders', 'gifts', 'relationships'],
    permissions: ['read_files', 'send_messages'],
    channels: ['all'],
    content: `---
name: "birthday-reminder"
description: "Are there any birthdays coming up?"
version: "1.0.0"
author: "clawcraft-templates"
tags: ["birthdays", "reminders", "gifts"]
trigger: "scheduled"
schedule: "0 9 * * *"
permissions: ["read_files", "send_messages"]
---

## Purpose
Check for upcoming birthdays and send advance reminders with gift suggestions.

## Instructions
1. Read birthday list from ~/.openclaw/birthdays.json
2. Check for birthdays in the next 7 days
3. For each upcoming birthday: calculate days remaining, suggest 3 gift ideas based on person's interests (if stored)
4. Send reminder 7 days before and again on the day
5. Don't send if already reminded today

## Output Format
"🎂 [Name]'s birthday is in [X] days ([Date])!
Gift ideas: [1], [2], [3]"
`,
  },

  {
    id: 'travel-planner',
    name: 'travel-planner',
    title: 'Travel Planner',
    description: 'Builds itineraries from destination and date inputs',
    category: 'Personal',
    tags: ['travel', 'itinerary', 'planning', 'vacation'],
    permissions: ['browse_web', 'write_files'],
    channels: ['all'],
    content: `---
name: "travel-planner"
description: "Plan a trip to [destination]"
version: "1.0.0"
author: "clawcraft-templates"
tags: ["travel", "itinerary", "planning"]
trigger: "slash"
permissions: ["browse_web", "write_files"]
---

## Purpose
Build a practical travel itinerary for a specified destination and duration.

## Instructions
1. Ask: destination, dates, travel style (budget/comfort/luxury), interests
2. Research: best neighborhoods to stay, top attractions by category, local food highlights, practical tips (transportation, currency, safety)
3. Build day-by-day itinerary
4. Add packing list suggestions based on season and activities
5. Save to ~/.openclaw/trips/[destination]-[date].md

## Output Format
Day-by-day itinerary with morning, afternoon, and evening activities.
Packing list. Key practical info. Estimated daily budget.
`,
  },

  {
    id: 'recipe-suggester',
    name: 'recipe-suggester',
    title: 'Recipe Suggester',
    description: 'Suggests meals based on ingredients currently available',
    category: 'Personal',
    tags: ['cooking', 'recipes', 'meal-planning', 'food'],
    permissions: ['read_files', 'browse_web'],
    channels: ['all'],
    content: `---
name: "recipe-suggester"
description: "What can I cook with what I have?"
version: "1.0.0"
author: "clawcraft-templates"
tags: ["cooking", "recipes", "meal-planning"]
trigger: "slash"
permissions: ["read_files", "browse_web"]
---

## Purpose
Suggest recipes based on available ingredients.

## Instructions
1. Ask user to list available ingredients (or read from ~/.openclaw/pantry.txt if it exists)
2. Identify 3 possible meals that can be made with those ingredients
3. Note any additional ingredients needed (and if they're cheap/common)
4. Present recipes in order of: fewest missing ingredients, then prep time
5. On selection, show full recipe with steps

## Output Format
Recipe cards with: name, time, difficulty, ingredients needed, steps.
`,
  },

  {
    id: 'workout-logger',
    name: 'workout-logger',
    title: 'Workout Logger',
    description: 'Records workout details and tracks progress over time',
    category: 'Personal',
    tags: ['fitness', 'workout', 'exercise', 'tracking'],
    permissions: ['read_files', 'write_files'],
    channels: ['all'],
    content: `---
name: "workout-logger"
description: "Log my workout"
version: "1.0.0"
author: "clawcraft-templates"
tags: ["fitness", "workout", "exercise"]
trigger: "slash"
permissions: ["read_files", "write_files"]
---

## Purpose
Log workout sessions and track fitness progress over time.

## Instructions
1. Ask: workout type (running, lifting, cycling, yoga, etc.), duration, and exercises/distances
2. For strength training: accept sets/reps/weight for each exercise
3. Save to ~/.openclaw/workouts/[date].json
4. Compare to previous session of same type — show progress
5. Weekly: /workout stats — show weekly summary and trends

## Output Format
"Logged: [workout type], [duration]
[Exercise]: [sets x reps @ weight]
vs last session: +X% on [exercise]"
`,
  },

  {
    id: 'sleep-tracker',
    name: 'sleep-tracker',
    title: 'Sleep Tracker',
    description: 'Logs sleep times and generates weekly sleep quality report',
    category: 'Personal',
    tags: ['sleep', 'health', 'tracking', 'wellness'],
    permissions: ['read_files', 'write_files', 'send_messages'],
    channels: ['all'],
    content: `---
name: "sleep-tracker"
description: "Log my sleep for last night"
version: "1.0.0"
author: "clawcraft-templates"
tags: ["sleep", "health", "tracking"]
trigger: "scheduled"
schedule: "0 8 * * *"
permissions: ["read_files", "write_files", "send_messages"]
---

## Purpose
Track sleep duration and quality to identify patterns.

## Instructions
1. Ask: what time did you go to bed and wake up?
2. Ask optional: how was sleep quality? (1-5), any wake-ups?
3. Calculate: total hours, quality score
4. Log to ~/.openclaw/sleep-log.json
5. Show weekly average and trend
6. Flag if consistently under 7 hours

## Output Format
"Logged: [X]h [Y]m sleep (quality: X/5)
7-day average: Xh Xm | Trend: [improving/declining/stable]"
`,
  },

  {
    id: 'meditation-timer',
    name: 'meditation-timer',
    title: 'Meditation Timer',
    description: 'Guides through breathing exercises with timed prompts',
    category: 'Personal',
    tags: ['meditation', 'mindfulness', 'breathing', 'wellness'],
    permissions: ['send_messages'],
    channels: ['all'],
    content: `---
name: "meditation-timer"
description: "Start a meditation session"
version: "1.0.0"
author: "clawcraft-templates"
tags: ["meditation", "mindfulness", "breathing"]
trigger: "slash"
permissions: ["send_messages"]
---

## Purpose
Guide a timed meditation or breathing exercise session.

## Instructions
1. Ask: type (breathing, body scan, focus, visualization) and duration (default 5 min)
2. For breathing: guide through box breathing (4-4-4-4) or 4-7-8 technique
3. Send paced prompts: inhale, hold, exhale with timing
4. At end, send gentle close and ask how it felt
5. Log session to meditation history

## Output Format
Paced text prompts: "Inhale... (4 seconds) Hold... (4 seconds) Exhale... (4 seconds)"
`,
  },

  {
    id: 'book-summary',
    name: 'book-summary',
    title: 'Book Summary',
    description: 'Generates key takeaways from book titles',
    category: 'Personal',
    tags: ['books', 'reading', 'learning', 'summaries'],
    permissions: ['browse_web'],
    channels: ['all'],
    content: `---
name: "book-summary"
description: "Summarize the key ideas from [book title]"
version: "1.0.0"
author: "clawcraft-templates"
tags: ["books", "reading", "learning"]
trigger: "slash"
permissions: ["browse_web"]
---

## Purpose
Generate a comprehensive summary of a book's key ideas, frameworks, and actionable insights.

## Instructions
1. Accept book title and optionally author
2. Generate: 1-paragraph overview, key concepts (5-7 ideas), main frameworks or models, 3 most actionable takeaways, memorable quotes if available
3. Note the target audience and estimated reading time
4. Ask if user wants to add it to their reading list

## Output Format
**[Book Title] by [Author]**
**In one paragraph:** ...
**Key Ideas:** (numbered list)
**Frameworks:** ...
**Top Takeaways:** ...
`,
  },
]

export function getTemplateById(id: string): Template | undefined {
  return TEMPLATES.find(t => t.id === id)
}

export function getTemplatesByCategory(category: string): Template[] {
  return TEMPLATES.filter(t => t.category === category)
}

export function getCategories(): string[] {
  return [...new Set(TEMPLATES.map(t => t.category))]
}
