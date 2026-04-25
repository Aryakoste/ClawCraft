import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
const CONFIG_DIR = join(homedir(), '.clawcraft');
const CONFIG_PATH = join(CONFIG_DIR, 'config.json');
const HISTORY_DIR = join(CONFIG_DIR, 'history');
const USAGE_DIR = join(CONFIG_DIR, 'usage');
export function ensureConfigDir() {
    if (!existsSync(CONFIG_DIR))
        mkdirSync(CONFIG_DIR, { recursive: true });
    if (!existsSync(HISTORY_DIR))
        mkdirSync(HISTORY_DIR, { recursive: true });
    if (!existsSync(USAGE_DIR))
        mkdirSync(USAGE_DIR, { recursive: true });
}
const DEFAULTS = {
    openclawSkillsPath: join(homedir(), '.openclaw', 'skills'),
    llmProvider: 'anthropic',
    apiKey: '',
    model: 'claude-sonnet-4-6',
    port: 4000,
    theme: 'dark',
    autoScan: true,
    version: '1.0.0',
};
export function readConfig() {
    ensureConfigDir();
    if (!existsSync(CONFIG_PATH))
        return { ...DEFAULTS };
    try {
        const raw = readFileSync(CONFIG_PATH, 'utf-8');
        return { ...DEFAULTS, ...JSON.parse(raw) };
    }
    catch {
        return { ...DEFAULTS };
    }
}
export function writeConfig(config) {
    ensureConfigDir();
    const current = readConfig();
    const updated = { ...current, ...config };
    writeFileSync(CONFIG_PATH, JSON.stringify(updated, null, 2), 'utf-8');
    return updated;
}
export function getHistoryDir() {
    ensureConfigDir();
    return HISTORY_DIR;
}
export function getUsageDir() {
    ensureConfigDir();
    return USAGE_DIR;
}
export function getConfigDir() {
    ensureConfigDir();
    return CONFIG_DIR;
}
