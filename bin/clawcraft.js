#!/usr/bin/env node
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const tsFile = join(__dirname, 'clawcraft.ts')
const tsxBin = join(__dirname, '..', 'node_modules', '.bin', 'tsx')

// Check if tsx is available
const tsx = existsSync(tsxBin) ? tsxBin : 'tsx'

// Re-exec this process using tsx so TypeScript works
const child = spawn(tsx, [tsFile, ...process.argv.slice(2)], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
})

child.on('exit', code => process.exit(code ?? 0))
