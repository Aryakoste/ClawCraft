import { recordSkillFire, getSkillUsageStats, getAllUsageStats, getUsageSummary, } from '../skills/usage.js';
export async function usageRoutes(app) {
    // Record a skill fire
    app.post('/api/usage/fire', async (req) => {
        recordSkillFire({
            skillName: req.body.skillName,
            firedAt: new Date().toISOString(),
            timeSavedSeconds: req.body.timeSavedSeconds,
            channel: req.body.channel,
        });
        return { success: true };
    });
    // Get usage stats for a single skill
    app.get('/api/usage/:name', async (req) => {
        return getSkillUsageStats(req.params.name);
    });
    // Get all usage stats
    app.get('/api/usage', async () => {
        return getAllUsageStats();
    });
    // Get usage summary
    app.get('/api/usage/summary', async () => {
        return getUsageSummary();
    });
}
