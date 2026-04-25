import { readConfig, writeConfig } from '../config.js';
import { getLLMProviderModels } from '../llm/client.js';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
export async function configRoutes(app) {
    // Get current config (mask API key)
    app.get('/api/config', async () => {
        const config = readConfig();
        return {
            ...config,
            apiKey: config.apiKey ? '••••••••••••' + config.apiKey.slice(-4) : '',
            hasApiKey: config.apiKey.length > 0,
        };
    });
    // Update config
    app.post('/api/config', async (req) => {
        const updated = writeConfig(req.body);
        return {
            ...updated,
            apiKey: updated.apiKey ? '••••••••••••' + updated.apiKey.slice(-4) : '',
            hasApiKey: updated.apiKey.length > 0,
        };
    });
    // Get models for a provider
    app.get('/api/config/models/:provider', async (req) => {
        return { models: getLLMProviderModels(req.params.provider) };
    });
    // Check OpenClaw skills path
    app.get('/api/config/check-path', async () => {
        const config = readConfig();
        const path = config.openclawSkillsPath;
        const exists = existsSync(path);
        const defaultPath = join(homedir(), '.openclaw', 'skills');
        return { path, exists, isDefault: path === defaultPath };
    });
    // Test LLM connection
    app.post('/api/config/test-llm', async (_, reply) => {
        try {
            const { callLLM } = await import('../llm/client.js');
            const resp = await callLLM([
                { role: 'user', content: 'Reply with exactly: "Clawcraft connection test OK"' },
            ]);
            const ok = resp.content.includes('OK') || resp.content.includes('connection');
            return { success: ok, message: resp.content, model: resp.model };
        }
        catch (e) {
            return reply.code(400).send({
                success: false,
                error: e.message,
            });
        }
    });
}
