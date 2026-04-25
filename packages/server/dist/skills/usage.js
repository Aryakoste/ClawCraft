import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { getUsageDir } from '../config.js';
function getUsagePath(skillName) {
    const safeName = skillName.replace(/[^a-z0-9-_]/gi, '-').toLowerCase();
    return join(getUsageDir(), `${safeName}.json`);
}
export function recordSkillFire(entry) {
    const path = getUsagePath(entry.skillName);
    const entries = existsSync(path)
        ? JSON.parse(readFileSync(path, 'utf-8'))
        : [];
    entries.push(entry);
    // Keep last 1000 entries per skill
    const trimmed = entries.slice(-1000);
    writeFileSync(path, JSON.stringify(trimmed, null, 2), 'utf-8');
}
export function getSkillUsageStats(skillName) {
    const path = getUsagePath(skillName);
    if (!existsSync(path)) {
        return {
            skillName,
            totalFires: 0,
            lastFired: null,
            totalTimeSavedSeconds: 0,
            firesByDay: {},
            channels: {},
        };
    }
    const entries = JSON.parse(readFileSync(path, 'utf-8'));
    const firesByDay = {};
    const channels = {};
    let totalTimeSaved = 0;
    for (const e of entries) {
        const day = e.firedAt.slice(0, 10);
        firesByDay[day] = (firesByDay[day] ?? 0) + 1;
        if (e.channel)
            channels[e.channel] = (channels[e.channel] ?? 0) + 1;
        if (e.timeSavedSeconds)
            totalTimeSaved += e.timeSavedSeconds;
    }
    return {
        skillName,
        totalFires: entries.length,
        lastFired: entries.length > 0 ? entries[entries.length - 1].firedAt : null,
        totalTimeSavedSeconds: totalTimeSaved,
        firesByDay,
        channels,
    };
}
export function getAllUsageStats() {
    const usageDir = getUsageDir();
    if (!existsSync(usageDir))
        return [];
    try {
        return readdirSync(usageDir)
            .filter(f => f.endsWith('.json'))
            .map(f => getSkillUsageStats(f.replace('.json', '')))
            .sort((a, b) => b.totalFires - a.totalFires);
    }
    catch {
        return [];
    }
}
export function getUsageSummary() {
    const all = getAllUsageStats();
    const totalFires = all.reduce((sum, s) => sum + s.totalFires, 0);
    const totalSeconds = all.reduce((sum, s) => sum + s.totalTimeSavedSeconds, 0);
    const mostUsed = all.length > 0 ? all[0].skillName : null;
    return {
        totalSkillFires: totalFires,
        totalTimeSavedHours: Math.round((totalSeconds / 3600) * 10) / 10,
        mostUsedSkill: mostUsed,
        skillsWithUsage: all.filter(s => s.totalFires > 0).length,
    };
}
