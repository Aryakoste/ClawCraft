import { readConfig } from '../config.js';
// Lazy imports to avoid requiring all providers at startup
async function callAnthropic(messages, config) {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: config.apiKey });
    const systemMsg = messages.find(m => m.role === 'system')?.content;
    const convoMsgs = messages
        .filter(m => m.role !== 'system')
        .map(m => ({ role: m.role, content: m.content }));
    const resp = await client.messages.create({
        model: config.model || 'claude-sonnet-4-6',
        max_tokens: 8192,
        system: systemMsg,
        messages: convoMsgs,
    });
    const content = resp.content[0].type === 'text' ? resp.content[0].text : '';
    return {
        content,
        model: resp.model,
        usage: {
            inputTokens: resp.usage.input_tokens,
            outputTokens: resp.usage.output_tokens,
        },
    };
}
async function callOpenAICompat(messages, config) {
    const { default: OpenAI } = await import('openai');
    const baseURL = config.baseUrl ||
        (config.llmProvider === 'ollama'
            ? 'http://localhost:11434/v1'
            : 'https://api.openai.com/v1');
    const client = new OpenAI({
        apiKey: config.apiKey || 'ollama',
        baseURL,
    });
    const resp = await client.chat.completions.create({
        model: config.model || 'gpt-4o',
        messages: messages.map(m => ({
            role: m.role,
            content: m.content,
        })),
        max_tokens: 8192,
    });
    return {
        content: resp.choices[0]?.message?.content ?? '',
        model: resp.model,
        usage: resp.usage
            ? {
                inputTokens: resp.usage.prompt_tokens,
                outputTokens: resp.usage.completion_tokens,
            }
            : undefined,
    };
}
async function callOpenClawLLM(messages, config) {
    // OpenClaw exposes its configured LLM at a local endpoint
    const baseURL = config.baseUrl || 'http://localhost:3001/v1';
    const resp = await fetch(`${baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.apiKey || 'openclaw'}`,
        },
        body: JSON.stringify({
            model: config.model || 'default',
            messages,
            max_tokens: 8192,
        }),
    });
    if (!resp.ok)
        throw new Error(`OpenClaw LLM error: ${resp.status}`);
    const data = (await resp.json());
    return {
        content: data.choices[0]?.message?.content ?? '',
        model: data.model,
        usage: data.usage
            ? {
                inputTokens: data.usage.prompt_tokens,
                outputTokens: data.usage.completion_tokens,
            }
            : undefined,
    };
}
export async function callLLM(messages) {
    const config = readConfig();
    const provider = config.llmProvider || 'anthropic';
    switch (provider) {
        case 'anthropic':
            return callAnthropic(messages, config);
        case 'openai':
        case 'openai-compat':
        case 'ollama':
            return callOpenAICompat(messages, config);
        case 'openclaw':
            return callOpenClawLLM(messages, config);
        default:
            throw new Error(`Unknown LLM provider: ${provider}`);
    }
}
export async function streamLLM(messages, onChunk) {
    const config = readConfig();
    const provider = config.llmProvider || 'anthropic';
    if (provider === 'anthropic') {
        const { default: Anthropic } = await import('@anthropic-ai/sdk');
        const client = new Anthropic({ apiKey: config.apiKey });
        const systemMsg = messages.find(m => m.role === 'system')?.content;
        const convoMsgs = messages
            .filter(m => m.role !== 'system')
            .map(m => ({ role: m.role, content: m.content }));
        const stream = await client.messages.create({
            model: config.model || 'claude-sonnet-4-6',
            max_tokens: 8192,
            system: systemMsg,
            messages: convoMsgs,
            stream: true,
        });
        for await (const event of stream) {
            if (event.type === 'content_block_delta' &&
                event.delta.type === 'text_delta') {
                onChunk({ content: event.delta.text, done: false });
            }
        }
        onChunk({ content: '', done: true });
        return;
    }
    // For other providers, fall back to non-streaming then emit all at once
    const resp = await callLLM(messages);
    onChunk({ content: resp.content, done: false });
    onChunk({ content: '', done: true });
}
export function getLLMProviderModels(provider) {
    switch (provider) {
        case 'anthropic':
            return ['claude-sonnet-4-6', 'claude-opus-4-6', 'claude-haiku-4-5-20251001'];
        case 'openai':
            return ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'];
        case 'ollama':
            return ['llama3.2', 'llama3.1', 'mistral', 'phi3', 'qwen2.5', 'deepseek-r1'];
        case 'openai-compat':
            return [];
        case 'openclaw':
            return ['default'];
        default:
            return [];
    }
}
