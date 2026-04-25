const BASE = '/api'

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const resp = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: resp.statusText }))
    throw new Error(err.error ?? resp.statusText)
  }
  return resp.json()
}

function get<T>(path: string): Promise<T> {
  return request<T>(path)
}

function post<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

function put<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

function del<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'DELETE' })
}

// ─── Skills ───────────────────────────────────────────────────────────────────
export const skillsApi = {
  list: () => get('/skills'),
  get: (name: string) => get(`/skills/${encodeURIComponent(name)}`),
  create: (name: string, content: string) =>
    post('/skills', { name, content }),
  update: (filePath: string, content: string) =>
    put('/skills/update', { filePath, content }),
  delete: (name: string) => del(`/skills/${encodeURIComponent(name)}`),
  duplicate: (sourceName: string, targetName: string) =>
    post('/skills/duplicate', { sourceName, targetName }),
  downloadUrl: (name: string) =>
    `${BASE}/skills/${encodeURIComponent(name)}/download`,
  history: (name: string) =>
    get(`/skills/${encodeURIComponent(name)}/history`),
  historyContent: (name: string, path: string) =>
    get(
      `/skills/${encodeURIComponent(name)}/history/content?path=${encodeURIComponent(path)}`
    ),
  restore: (skillName: string, versionPath: string) =>
    post('/skills/restore', { skillName, versionPath }),
  scan: (name: string) => get(`/skills/${encodeURIComponent(name)}/scan`),
  conflicts: () => get('/skills/conflicts'),
}

// ─── Generate ─────────────────────────────────────────────────────────────────
export const generateApi = {
  fromForm: (data: {
    description: string
    triggerType: string
    permissions: string[]
    channels: string[]
    outputFormat: string
    schedule?: string
  }) => post('/generate', data),

  fromDay: (dayDescription: string) =>
    post('/generate/day', { dayDescription }),

  chatStream: (
    messages: Array<{ role: string; content: string }>,
    onChunk: (chunk: string, done: boolean) => void
  ) => {
    return fetch(`${BASE}/generate/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    }).then(resp => {
      const reader = resp.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      function pump(): Promise<void> {
        return reader.read().then(({ done, value }) => {
          if (done) return
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n\n')
          buffer = lines.pop() ?? ''
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))
                onChunk(data.content ?? '', data.done ?? false)
              } catch {
                // ignore malformed
              }
            }
          }
          return pump()
        })
      }
      return pump()
    })
  },
}

// ─── Scan ─────────────────────────────────────────────────────────────────────
export const scanApi = {
  all: () => get('/scan/all'),
  content: (skillName: string, content: string) =>
    post('/scan', { skillName, content }),
  clawhub: (url: string) => post('/scan/clawhub', { url }),
  conflicts: () => get('/scan/conflicts'),
}

// ─── Debug ────────────────────────────────────────────────────────────────────
export const debugApi = {
  fix: (skillContent: string, problem: string) =>
    post('/debug', { skillContent, problem }),
  improve: (skillContent: string) =>
    post('/debug/improve', { skillContent }),
  simulate: (skillContent: string, sampleInput: string) =>
    post('/debug/simulate', { skillContent, sampleInput }),
}

// ─── Templates ────────────────────────────────────────────────────────────────
export const templatesApi = {
  list: (params?: { category?: string; search?: string }) => {
    const qs = new URLSearchParams()
    if (params?.category) qs.set('category', params.category)
    if (params?.search) qs.set('search', params.search)
    return get(`/templates${qs.size > 0 ? '?' + qs.toString() : ''}`)
  },
  categories: () => get('/templates/categories'),
  get: (id: string) => get(`/templates/${id}`),
  install: (id: string) => post(`/templates/${id}/install`, {}),
  scan: (id: string) => get(`/templates/${id}/scan`),
}

// ─── Config ───────────────────────────────────────────────────────────────────
export const configApi = {
  get: () => get('/config'),
  update: (data: Record<string, unknown>) => post('/config', data),
  models: (provider: string) => get(`/config/models/${provider}`),
  checkPath: () => get('/config/check-path'),
  testLLM: () => post('/config/test-llm', {}),
}

// ─── Usage ────────────────────────────────────────────────────────────────────
export const usageApi = {
  fire: (skillName: string, timeSavedSeconds?: number, channel?: string) =>
    post('/usage/fire', { skillName, timeSavedSeconds, channel }),
  skill: (name: string) => get(`/usage/${encodeURIComponent(name)}`),
  all: () => get('/usage'),
  summary: () => get('/usage/summary'),
}

// ─── Composer ─────────────────────────────────────────────────────────────────
export const composerApi = {
  list: () => get('/composer'),
  get: (id: string) => get(`/composer/${id}`),
  save: (canvas: unknown) => post('/composer', canvas),
  delete: (id: string) => del(`/composer/${id}`),
  generate: (description: string) =>
    post('/composer/generate', { description }),
}
