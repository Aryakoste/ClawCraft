import { TEMPLATES, getTemplateById, getCategories, } from '../templates.js';
import { writeSkill } from '../skills/writer.js';
import { scanSkillContent } from '../scanner/scanner.js';
export async function templateRoutes(app) {
    // List all templates
    app.get('/api/templates', async (req) => {
        const { category, search } = req.query;
        let results = TEMPLATES;
        if (category) {
            results = results.filter(t => t.category === category);
        }
        if (search) {
            const q = search.toLowerCase();
            results = results.filter(t => t.title.toLowerCase().includes(q) ||
                t.description.toLowerCase().includes(q) ||
                t.tags.some(tag => tag.includes(q)));
        }
        return results.map(t => ({
            id: t.id,
            name: t.name,
            title: t.title,
            description: t.description,
            category: t.category,
            tags: t.tags,
            permissions: t.permissions,
            channels: t.channels,
        }));
    });
    // Get categories
    app.get('/api/templates/categories', async () => {
        return getCategories();
    });
    // Get a single template with full content
    app.get('/api/templates/:id', async (req, reply) => {
        const template = getTemplateById(req.params.id);
        if (!template)
            return reply.code(404).send({ error: 'Template not found' });
        return template;
    });
    // Install a template
    app.post('/api/templates/:id/install', async (req, reply) => {
        const template = getTemplateById(req.params.id);
        if (!template)
            return reply.code(404).send({ error: 'Template not found' });
        try {
            const path = writeSkill(template.name, template.content);
            return { success: true, path, skillName: template.name };
        }
        catch (e) {
            return reply.code(500).send({ error: e.message });
        }
    });
    // Scan a template (verify it's safe)
    app.get('/api/templates/:id/scan', async (req, reply) => {
        const template = getTemplateById(req.params.id);
        if (!template)
            return reply.code(404).send({ error: 'Template not found' });
        return scanSkillContent(template.name, template.content);
    });
}
