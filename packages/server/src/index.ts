import Fastify from 'fastify'
import fastifyStatic from '@fastify/static'
import fastifyCors from '@fastify/cors'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync } from 'fs'
import { readConfig } from './config.js'
import { skillsRoutes } from './routes/skills.js'
import { generateRoutes } from './routes/generate.js'
import { scanRoutes } from './routes/scan.js'
import { debugRoutes } from './routes/debug.js'
import { templateRoutes } from './routes/templates.js'
import { configRoutes } from './routes/config.js'
import { usageRoutes } from './routes/usage.js'
import { composerRoutes } from './routes/composer.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export async function createServer(port?: number): Promise<void> {
  const config = readConfig()
  const serverPort = port ?? config.port ?? 4000

  const app = Fastify({
    logger: process.env.NODE_ENV === 'development',
  })

  // CORS for dev
  await app.register(fastifyCors, {
    origin: true,
  })

  // Register API routes
  await app.register(skillsRoutes)
  await app.register(generateRoutes)
  await app.register(scanRoutes)
  await app.register(debugRoutes)
  await app.register(templateRoutes)
  await app.register(configRoutes)
  await app.register(usageRoutes)
  await app.register(composerRoutes)

  // Serve React client static files in production
  const clientDistPath = join(__dirname, '..', '..', 'client', 'dist')
  const altClientPath = join(
    __dirname,
    '..',
    '..',
    '..',
    'packages',
    'client',
    'dist'
  )

  const staticPath = existsSync(clientDistPath)
    ? clientDistPath
    : existsSync(altClientPath)
    ? altClientPath
    : null

  if (staticPath) {
    await app.register(fastifyStatic, {
      root: staticPath,
      prefix: '/',
    })

    // SPA fallback — serve index.html for all non-API routes
    app.setNotFoundHandler(async (req, reply) => {
      if (!req.url.startsWith('/api')) {
        return reply.sendFile('index.html')
      }
      return reply.code(404).send({ error: 'Not found' })
    })
  } else {
    // Dev mode — no static files, just API
    app.get('/', async () => ({
      message: 'Clawcraft API server running. Start the client with: npm run dev -w packages/client',
      apiDocs: `http://localhost:${serverPort}/api`,
    }))
  }

  // Health check
  app.get('/api/health', async () => ({
    status: 'ok',
    version: '1.0.0',
    port: serverPort,
    timestamp: new Date().toISOString(),
  }))

  await app.listen({ port: serverPort, host: '127.0.0.1' })
  console.log(`\n  Clawcraft is running at http://localhost:${serverPort}\n`)
}

// Direct run
createServer().catch(err => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
