import { SCAN_RULES } from './rules.js';
export function scanSkillContent(skillName, content) {
    const lines = content.split('\n');
    const findings = [];
    for (const rule of SCAN_RULES) {
        const ruleFindings = rule.check(content, lines);
        findings.push(...ruleFindings);
    }
    // Deduplicate findings at same line for same rule
    const seen = new Set();
    const unique = findings.filter(f => {
        const key = `${f.ruleId}:${f.line}`;
        if (seen.has(key))
            return false;
        seen.add(key);
        return true;
    });
    // Sort by severity then line number
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    unique.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity] ||
        a.line - b.line);
    const trustScore = computeTrustScore(unique);
    return {
        skillName,
        trustScore,
        findings: unique,
        scannedAt: new Date().toISOString(),
        summary: buildSummary(unique, trustScore),
    };
}
function computeTrustScore(findings) {
    const hasCritical = findings.some(f => f.severity === 'critical');
    const hasHigh = findings.some(f => f.severity === 'high');
    if (hasCritical || hasHigh)
        return 'dangerous';
    const hasMedium = findings.some(f => f.severity === 'medium');
    if (hasMedium)
        return 'review';
    return 'safe';
}
function buildSummary(findings, trustScore) {
    if (findings.length === 0) {
        return 'No security issues detected. This skill appears safe to install.';
    }
    const counts = findings.reduce((acc, f) => {
        acc[f.severity] = (acc[f.severity] ?? 0) + 1;
        return acc;
    }, {});
    const parts = [];
    if (counts.critical)
        parts.push(`${counts.critical} critical`);
    if (counts.high)
        parts.push(`${counts.high} high`);
    if (counts.medium)
        parts.push(`${counts.medium} medium`);
    if (counts.low)
        parts.push(`${counts.low} low`);
    if (trustScore === 'dangerous') {
        return `Dangerous: ${parts.join(', ')} severity issue${findings.length > 1 ? 's' : ''} found. Do not install this skill.`;
    }
    return `Review recommended: ${parts.join(', ')} severity issue${findings.length > 1 ? 's' : ''} found. Review before installing.`;
}
export function detectConflicts(skills) {
    const conflicts = [];
    for (let i = 0; i < skills.length; i++) {
        for (let j = i + 1; j < skills.length; j++) {
            const a = skills[i];
            const b = skills[j];
            // Check description overlap
            const aWords = new Set(a.description.toLowerCase().split(/\s+/).filter(w => w.length > 3));
            const bWords = new Set(b.description.toLowerCase().split(/\s+/).filter(w => w.length > 3));
            const overlap = [...aWords].filter(w => bWords.has(w));
            const overlapRatio = overlap.length / Math.min(aWords.size, bWords.size);
            if (overlapRatio > 0.5 && overlap.length >= 3) {
                conflicts.push({
                    skill1: a.name,
                    skill2: b.name,
                    type: 'description-overlap',
                    explanation: `Skills "${a.name}" and "${b.name}" have very similar descriptions. The model may pick the wrong skill when asked to "${overlap.slice(0, 3).join(' ')}".`,
                    suggestedFix: `Make the descriptions more specific. Clarify what makes each skill unique. Overlapping keywords: ${overlap.slice(0, 5).join(', ')}`,
                });
            }
            // Check trigger overlap
            if (a.trigger && b.trigger && a.trigger === b.trigger) {
                conflicts.push({
                    skill1: a.name,
                    skill2: b.name,
                    type: 'trigger-overlap',
                    explanation: `Both skills use the same trigger: "${a.trigger}". Only one will fire.`,
                    suggestedFix: `Rename one of the triggers to avoid the conflict.`,
                });
            }
        }
    }
    return conflicts;
}
