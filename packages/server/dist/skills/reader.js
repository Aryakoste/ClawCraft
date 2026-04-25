import { readFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join } from 'path';
import { readConfig } from '../config.js';
export function parseSkillContent(raw) {
    const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (!fmMatch) {
        return {
            frontmatter: {
                name: 'unknown',
                description: '',
                version: '1.0.0',
                author: 'unknown',
                tags: [],
            },
            content: raw,
        };
    }
    const fmRaw = fmMatch[1];
    const content = fmMatch[2].trim();
    const frontmatter = {
        name: 'unknown',
        description: '',
        version: '1.0.0',
        author: 'unknown',
        tags: [],
    };
    // Simple YAML parser for skill frontmatter
    const lines = fmRaw.split('\n');
    let currentKey = '';
    let inArray = false;
    const arrayValues = [];
    for (const line of lines) {
        const trimmed = line.trim();
        if (inArray) {
            if (trimmed.startsWith('- ')) {
                arrayValues.push(trimmed.slice(2).replace(/^["']|["']$/g, ''));
                continue;
            }
            else {
                // End of array
                frontmatter[currentKey] = [...arrayValues];
                arrayValues.length = 0;
                inArray = false;
            }
        }
        const kvMatch = line.match(/^(\w+):\s*(.*)$/);
        if (!kvMatch)
            continue;
        const key = kvMatch[1];
        const value = kvMatch[2].trim();
        if (value === '' || value === '[]') {
            if (value === '[]') {
                frontmatter[key] = [];
            }
            else {
                currentKey = key;
                inArray = true;
            }
        }
        else if (value.startsWith('[') && value.endsWith(']')) {
            const items = value
                .slice(1, -1)
                .split(',')
                .map(s => s.trim().replace(/^["']|["']$/g, ''));
            frontmatter[key] = items;
        }
        else {
            frontmatter[key] = value.replace(/^["']|["']$/g, '');
        }
    }
    if (inArray) {
        frontmatter[currentKey] = [...arrayValues];
    }
    return { frontmatter, content };
}
export function readSkill(filePath) {
    const raw = readFileSync(filePath, 'utf-8');
    const stat = statSync(filePath);
    const { frontmatter, content } = parseSkillContent(raw);
    const fileName = filePath.split(/[\\/]/).pop() ?? '';
    const name = fileName.replace(/\.md$/i, '');
    return {
        name: frontmatter.name || name,
        fileName,
        filePath,
        frontmatter,
        content,
        raw,
        lastModified: stat.mtime,
        size: stat.size,
    };
}
export function readAllSkills() {
    const config = readConfig();
    const skillsPath = config.openclawSkillsPath;
    if (!existsSync(skillsPath))
        return [];
    const skills = [];
    try {
        const entries = readdirSync(skillsPath, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isDirectory()) {
                // Skills can be in subdirectories: skillname/SKILL.md
                const skillFile = join(skillsPath, entry.name, 'SKILL.md');
                const altFile = join(skillsPath, entry.name, 'skill.md');
                if (existsSync(skillFile)) {
                    try {
                        skills.push(readSkill(skillFile));
                    }
                    catch {
                        // skip malformed skills
                    }
                }
                else if (existsSync(altFile)) {
                    try {
                        skills.push(readSkill(altFile));
                    }
                    catch {
                        // skip
                    }
                }
            }
            else if (entry.isFile() &&
                entry.name.toLowerCase().endsWith('.md')) {
                try {
                    skills.push(readSkill(join(skillsPath, entry.name)));
                }
                catch {
                    // skip
                }
            }
        }
    }
    catch {
        // directory not readable
    }
    return skills.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
}
