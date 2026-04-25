#!/usr/bin/env node
import { Command } from 'commander'
import chalk from 'chalk'
import open from 'open'
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const pkg = JSON.parse(
  readFileSync(join(__dirname, '..', 'package.json'), 'utf-8')
)

const program = new Command()

program
  .name('clawcraft')
  .description('Local visual studio for OpenClaw skills')
  .version(pkg.version)

// ─── start ────────────────────────────────────────────────────────────────────
program
  .command('start')
  .description('Start the Clawcraft server and open the UI in your browser')
  .option('-p, --port <port>', 'Port to listen on', '4000')
  .option('--no-open', 'Start server without opening browser')
  .action(async opts => {
    const port = parseInt(opts.port, 10)
    const url = `http://localhost:${port}`

    console.log(chalk.magenta('\n  ██████╗██╗      █████╗ ██╗    ██╗'))
    console.log(chalk.magenta('  ██╔════╝██║     ██╔══██╗██║    ██║'))
    console.log(chalk.magenta('  ██║     ██║     ███████║██║ █╗ ██║'))
    console.log(chalk.magenta('  ██║     ██║     ██╔══██║██║███╗██║'))
    console.log(chalk.magenta('  ╚██████╗███████╗██║  ██║╚███╔███╔╝'))
    console.log(chalk.magenta('   ╚═════╝╚══════╝╚═╝  ╚═╝ ╚══╝╚══╝'))
    console.log(chalk.magenta('       ██████╗██████╗  █████╗ ███████╗████████╗'))
    console.log(chalk.magenta('      ██╔════╝██╔══██╗██╔══██╗██╔════╝╚══██╔══╝'))
    console.log(chalk.magenta('      ██║     ██████╔╝███████║█████╗     ██║'))
    console.log(chalk.magenta('      ██║     ██╔══██╗██╔══██║██╔══╝     ██║'))
    console.log(chalk.magenta('      ╚██████╗██║  ██║██║  ██║██║        ██║'))
    console.log(chalk.magenta('       ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝        ╚═╝\n'))
    console.log(chalk.gray('  Local visual studio for OpenClaw skills\n'))

    try {
      const { createServer } = await import('../packages/server/src/index.js')
      await createServer(port)

      if (opts.open !== false) {
        console.log(chalk.cyan(`  Opening ${url}`))
        await open(url)
      } else {
        console.log(chalk.cyan(`  UI available at ${url}`))
      }
    } catch (e: unknown) {
      console.error(chalk.red('  Failed to start server:'), (e as Error).message)
      process.exit(1)
    }
  })

// ─── list ─────────────────────────────────────────────────────────────────────
program
  .command('list')
  .description('List all installed skills')
  .action(async () => {
    const { readAllSkills } = await import('../packages/server/src/skills/reader.js')
    const { scanSkillContent } = await import('../packages/server/src/scanner/scanner.js')
    const skills = readAllSkills()

    if (skills.length === 0) {
      console.log(chalk.yellow('  No skills installed.'))
      return
    }

    console.log(chalk.gray(`\n  ${skills.length} installed skill${skills.length !== 1 ? 's' : ''}:\n`))
    for (const skill of skills) {
      const scan = scanSkillContent(skill.name, skill.raw)
      const badge =
        scan.trustScore === 'safe'
          ? chalk.green('✓ safe')
          : scan.trustScore === 'review'
          ? chalk.yellow('⚠ review')
          : chalk.red('✗ dangerous')
      console.log(`  ${badge}  ${chalk.white(skill.name)}  ${chalk.gray(skill.frontmatter.description ?? '')}`)
    }
    console.log()
  })

// ─── generate ─────────────────────────────────────────────────────────────────
program
  .command('generate <description>')
  .description('Generate a skill from a description')
  .action(async description => {
    console.log(chalk.cyan(`\n  Generating skill for: "${description}"\n`))
    const { callLLM } = await import('../packages/server/src/llm/client.js')
    const { writeSkill } = await import('../packages/server/src/skills/writer.js')

    const SYSTEM = `You are an OpenClaw skill developer. Generate a complete SKILL.md for the following request. Return ONLY the SKILL.md content, no explanation.`

    try {
      const resp = await callLLM([{ role: 'user', content: `${SYSTEM}\n\nRequest: ${description}` }])
      const nameMatch = resp.content.match(/^name:\s*["']?([^"'\n]+)["']?/m)
      const name = nameMatch?.[1]?.trim() || 'generated-skill'
      const path = writeSkill(name, resp.content)
      console.log(chalk.green(`  ✓ Skill "${name}" generated and installed at:`))
      console.log(chalk.gray(`    ${path}\n`))
    } catch (e: unknown) {
      console.error(chalk.red('  Error:'), (e as Error).message)
      process.exit(1)
    }
  })

// ─── scan ──────────────────────────────────────────────────────────────────────
program
  .command('scan [target]')
  .description('Scan skills for security issues. Pass a skill name or ClawHub URL, or omit to scan all.')
  .action(async target => {
    const { readAllSkills } = await import('../packages/server/src/skills/reader.js')
    const { scanSkillContent } = await import('../packages/server/src/scanner/scanner.js')

    if (!target) {
      // Scan all
      const skills = readAllSkills()
      if (skills.length === 0) {
        console.log(chalk.yellow('\n  No skills installed.\n'))
        return
      }
      console.log(chalk.gray(`\n  Scanning ${skills.length} skills...\n`))
      let dangerous = 0
      for (const skill of skills) {
        const result = scanSkillContent(skill.name, skill.raw)
        const badge =
          result.trustScore === 'safe'
            ? chalk.green('✓ safe     ')
            : result.trustScore === 'review'
            ? chalk.yellow('⚠ review   ')
            : chalk.red('✗ dangerous')
        dangerous += result.trustScore === 'dangerous' ? 1 : 0
        console.log(`  ${badge}  ${chalk.white(skill.name)}`)
        if (result.findings.length > 0 && result.trustScore !== 'safe') {
          for (const f of result.findings.slice(0, 2)) {
            console.log(chalk.gray(`              Line ${f.line}: ${f.ruleName} (${f.severity})`))
          }
        }
      }
      console.log()
      if (dangerous > 0) {
        console.log(chalk.red(`  ⚠ ${dangerous} dangerous skill${dangerous > 1 ? 's' : ''} found. Run 'clawcraft scan <name>' for details.\n`))
      } else {
        console.log(chalk.green('  All skills passed security scan.\n'))
      }
      return
    }

    if (target.startsWith('http')) {
      // Scan ClawHub URL
      console.log(chalk.cyan(`\n  Fetching and scanning: ${target}\n`))
      try {
        const rawUrl = target.endsWith('/raw') ? target : target.replace(/\/?$/, '/raw')
        const resp = await fetch(rawUrl, { signal: AbortSignal.timeout(10000) })
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
        const content = await resp.text()
        const name = target.split('/').pop() ?? 'skill'
        const result = scanSkillContent(name, content)
        printScanResult(result)
      } catch (e: unknown) {
        console.error(chalk.red('  Failed to fetch:'), (e as Error).message)
      }
    } else {
      // Scan named skill
      const skills = readAllSkills()
      const skill = skills.find(s => s.name === target || s.name.includes(target))
      if (!skill) {
        console.log(chalk.red(`\n  Skill not found: ${target}\n`))
        process.exit(1)
      }
      const result = scanSkillContent(skill.name, skill.raw)
      printScanResult(result)
    }
  })

function printScanResult(result: { skillName: string; trustScore: string; summary: string; findings: Array<{ severity: string; ruleName: string; line: number; explanation: string }> }): void {
  const badge =
    result.trustScore === 'safe'
      ? chalk.green('✓ SAFE')
      : result.trustScore === 'review'
      ? chalk.yellow('⚠ REVIEW RECOMMENDED')
      : chalk.red('✗ DANGEROUS')

  console.log(`\n  ${badge}  ${chalk.white(result.skillName)}`)
  console.log(chalk.gray(`  ${result.summary}\n`))

  if (result.findings.length > 0) {
    for (const f of result.findings) {
      const sev =
        f.severity === 'critical'
          ? chalk.red(f.severity.toUpperCase())
          : f.severity === 'high'
          ? chalk.red(f.severity)
          : f.severity === 'medium'
          ? chalk.yellow(f.severity)
          : chalk.gray(f.severity)
      console.log(`  ${sev}  Line ${f.line}: ${f.ruleName}`)
      console.log(chalk.gray(`         ${f.explanation.slice(0, 100)}...`))
    }
    console.log()
  }
}

// ─── install ─────────────────────────────────────────────────────────────────
program
  .command('install <url>')
  .description('Scan and install a ClawHub skill')
  .option('--force', 'Install even if scan finds issues')
  .action(async (url, opts) => {
    const { scanSkillContent } = await import('../packages/server/src/scanner/scanner.js')
    const { writeSkill } = await import('../packages/server/src/skills/writer.js')

    console.log(chalk.cyan(`\n  Scanning ${url}...\n`))
    const rawUrl = url.endsWith('/raw') ? url : url.replace(/\/?$/, '/raw')
    const resp = await fetch(rawUrl, { signal: AbortSignal.timeout(10000) })
    if (!resp.ok) {
      console.error(chalk.red(`  Failed to fetch: HTTP ${resp.status}`))
      process.exit(1)
    }
    const content = await resp.text()
    const name = url.split('/').pop() ?? 'clawhub-skill'
    const result = scanSkillContent(name, content)

    printScanResult(result)

    if (result.trustScore === 'dangerous' && !opts.force) {
      console.log(chalk.red('  Installation blocked due to dangerous findings.'))
      console.log(chalk.gray('  Use --force to install anyway (not recommended).\n'))
      process.exit(1)
    }

    const path = writeSkill(name, content)
    console.log(chalk.green(`  ✓ Installed: ${name}`))
    console.log(chalk.gray(`    ${path}\n`))
  })

// ─── fix ──────────────────────────────────────────────────────────────────────
program
  .command('fix <skillName>')
  .description('Open the debugger for a specific skill in the browser')
  .action(async skillName => {
    const { readConfig } = await import('../packages/server/src/config.js')
    const config = readConfig()
    const url = `http://localhost:${config.port}/debugger?skill=${encodeURIComponent(skillName)}`
    console.log(chalk.cyan(`\n  Opening debugger for ${skillName}...\n`))
    await open(url)
  })

// ─── improve ─────────────────────────────────────────────────────────────────
program
  .command('improve <skillName>')
  .description('Run the AI improver on a skill')
  .action(async skillName => {
    const { readAllSkills } = await import('../packages/server/src/skills/reader.js')
    const { callLLM } = await import('../packages/server/src/llm/client.js')
    const { writeSkillToPath } = await import('../packages/server/src/skills/writer.js')

    const skills = readAllSkills()
    const skill = skills.find(s => s.name === skillName)
    if (!skill) {
      console.error(chalk.red(`\n  Skill not found: ${skillName}\n`))
      process.exit(1)
    }

    console.log(chalk.cyan(`\n  Improving "${skillName}"...\n`))

    const SYSTEM = `You are an OpenClaw skill quality engineer. Improve this skill: make instructions more deterministic, add guardrails, minimize permissions, improve description. Return JSON: { "summary": "...", "improvedSkill": "...SKILL.md content..." }`
    const resp = await callLLM([{ role: 'user', content: `${SYSTEM}\n\n${skill.raw}` }])
    const match = resp.content.match(/\{[\s\S]*\}/)
    if (!match) {
      console.error(chalk.red('  Failed to parse response'))
      process.exit(1)
    }
    const data = JSON.parse(match[0])
    console.log(chalk.gray(`  ${data.summary}\n`))

    const readline = await import('readline')
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    rl.question(chalk.cyan('  Install improved version? [y/N] '), async answer => {
      rl.close()
      if (answer.toLowerCase() === 'y') {
        writeSkillToPath(skill.filePath, data.improvedSkill)
        console.log(chalk.green(`  ✓ Skill improved and saved.\n`))
      } else {
        console.log(chalk.gray('  Improvement discarded.\n'))
      }
    })
  })

// ─── config ───────────────────────────────────────────────────────────────────
const configCmd = program.command('config').description('Manage Clawcraft configuration')

configCmd
  .command('get')
  .description('Show current config')
  .action(async () => {
    const { readConfig } = await import('../packages/server/src/config.js')
    const config = readConfig()
    console.log('\n  Clawcraft Config:\n')
    for (const [k, v] of Object.entries(config)) {
      if (k === 'apiKey') {
        console.log(`  ${chalk.gray(k)}: ${v ? chalk.green('••••••••' + String(v).slice(-4)) : chalk.red('(not set)')}`)
      } else {
        console.log(`  ${chalk.gray(k)}: ${chalk.white(String(v))}`)
      }
    }
    console.log()
  })

configCmd
  .command('set <key> <value>')
  .description('Set a config value')
  .action(async (key, value) => {
    const { writeConfig } = await import('../packages/server/src/config.js')
    writeConfig({ [key]: value })
    console.log(chalk.green(`\n  ✓ ${key} set\n`))
  })

// Run
program.parse()
