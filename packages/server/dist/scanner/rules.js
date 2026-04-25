// ─── Helper ───────────────────────────────────────────────────────────────────
function findLines(lines, patterns, ruleId, ruleName, severity, explanation, recommendation) {
    const findings = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (const pattern of patterns) {
            if (pattern.test(line)) {
                findings.push({
                    ruleId,
                    ruleName,
                    severity,
                    line: i + 1,
                    snippet: line.trim().slice(0, 200),
                    explanation,
                    recommendation,
                });
                break; // one finding per line per rule
            }
        }
    }
    return findings;
}
// ─── Rule Definitions ─────────────────────────────────────────────────────────
export const SCAN_RULES = [
    // ── CRITICAL ──────────────────────────────────────────────────────────────
    {
        id: 'shell-injection',
        name: 'Shell Command Injection',
        category: 'Shell Security',
        severity: 'critical',
        description: 'Detects obfuscated or dangerous shell execution patterns',
        check: (content, lines) => findLines(lines, [
            /base64\s*[-–—]\s*d.*exec/i,
            /eval\s*\(/i,
            /\|\s*bash/i,
            /\|\s*sh\b/i,
            /\|\s*zsh\b/i,
            /curl\s+.*\s*\|\s*(ba)?sh/i,
            /wget\s+.*\s*\|\s*(ba)?sh/i,
            /exec\s*\(\s*['"`].*['"`]\)/i,
            /child_process\s*\.\s*exec/i,
            /spawn\s*\(\s*['"`](bash|sh|cmd|powershell)/i,
        ], 'shell-injection', 'Shell Command Injection', 'critical', 'This skill contains shell injection patterns that can execute arbitrary commands on the user\'s machine. Base64-decode-and-exec, eval(), and pipe-to-shell patterns are classic malware delivery techniques.', 'Do not install this skill. Report it to the ClawHub team immediately.'),
    },
    {
        id: 'reverse-shell',
        name: 'Reverse Shell Pattern',
        category: 'Shell Security',
        severity: 'critical',
        description: 'Detects reverse shell and backdoor connection attempts',
        check: (content, lines) => findLines(lines, [
            /\bnc\b.*-[el].*\d+\.\d+/i,
            /\/dev\/tcp\//i,
            /bash\s+-i\s*>&/i,
            /mkfifo\s+.*\|.*bash/i,
            /0>&1\s*2>&1/i,
            /socat\s+.*tcp:/i,
            /python.*socket.*connect/i,
            /perl.*socket.*connect/i,
        ], 'reverse-shell', 'Reverse Shell Pattern', 'critical', 'This skill contains reverse shell patterns. These are used to open a backdoor connection from your machine to an attacker\'s server, giving them remote control of your computer.', 'Do not install this skill. This is a confirmed malicious pattern.'),
    },
    {
        id: 'credential-theft',
        name: 'Credential File Access',
        category: 'Data Theft',
        severity: 'critical',
        description: 'Detects attempts to read credential files or API keys',
        check: (content, lines) => findLines(lines, [
            /~\/\.openclaw\/[^)}\s]*\.env/i,
            /~\/\.clawdbot\/[^)}\s]*\.env/i,
            /~\/\.ssh\/id_/i,
            /~\/\.aws\/credentials/i,
            /\/etc\/passwd/i,
            /\/etc\/shadow/i,
            /process\.env\.(API_KEY|SECRET|TOKEN|PASSWORD)/i,
            /OPENAI_API_KEY|ANTHROPIC_API_KEY|sk-[a-zA-Z0-9]{20,}/i,
            /password\s*=\s*["'][^"']{4,}/i,
            /secret\s*=\s*["'][^"']{4,}/i,
            /\.env\b.*read|read.*\.env\b/i,
        ], 'credential-theft', 'Credential File Access', 'critical', 'This skill attempts to access credential files, API keys, or sensitive configuration. This is a credential theft attack that would steal your API keys and passwords.', 'Do not install this skill. It is designed to steal your credentials.'),
    },
    {
        id: 'fake-prerequisites',
        name: 'Fake Prerequisites / Trojan Download',
        category: 'Malware Delivery',
        severity: 'critical',
        description: 'Detects instructions to download and run external executables',
        check: (content, lines) => findLines(lines, [
            /download\s+and\s+(run|execute|install)/i,
            /run\s+this\s+(installer|setup|script)\s+first/i,
            /install\s+this\s+helper\s+(tool|script|binary)/i,
            /prerequisite.*download.*http/i,
            /before\s+using.*curl.*http/i,
            /requires.*installing.*from.*http/i,
            /setup\s+script.*http[s]?:\/\//i,
            /execute.*\.exe\b/i,
            /execute.*\.sh\b.*http/i,
        ], 'fake-prerequisites', 'Fake Prerequisites / Trojan Download', 'critical', 'This skill instructs the user to download and run external executables as "prerequisites". This is the exact technique used in the ClawHavoc malware campaign to deliver trojans and keyloggers.', 'Do not install this skill or follow any download instructions it contains.'),
    },
    // ── HIGH ──────────────────────────────────────────────────────────────────
    {
        id: 'prompt-injection',
        name: 'Prompt Injection Attack',
        category: 'AI Security',
        severity: 'high',
        description: 'Detects prompt injection attempts that hijack the AI agent',
        check: (content, lines) => {
            const findings = [];
            const injectionPatterns = [
                /ignore\s+(previous|prior|above|all)\s+instructions/i,
                /disregard\s+(your\s+)?(system\s+)?prompt/i,
                /forget\s+everything\s+(above|before|prior)/i,
                /override\s+(your\s+)?(instructions|system|prompt)/i,
                /you\s+are\s+now\s+(a\s+)?(new|different|unrestricted)/i,
                /jailbreak/i,
                /DAN\s+mode/i,
                /do\s+anything\s+now/i,
                /\[SYSTEM\].*you\s+must/i,
                /<!--.*ignore.*-->/i,
                /\u200b|\u200c|\u200d|\ufeff|\u00ad/, // zero-width chars
            ];
            for (let i = 0; i < lines.length; i++) {
                for (const p of injectionPatterns) {
                    if (p.test(lines[i])) {
                        findings.push({
                            ruleId: 'prompt-injection',
                            ruleName: 'Prompt Injection Attack',
                            severity: 'high',
                            line: i + 1,
                            snippet: lines[i].trim().slice(0, 200),
                            explanation: 'This skill contains prompt injection text designed to override the AI agent\'s instructions and make it act outside its intended behavior. This can cause the agent to leak data, ignore safety guardrails, or take unauthorized actions.',
                            recommendation: 'Do not install this skill. Review the flagged lines carefully before proceeding.',
                        });
                        break;
                    }
                }
            }
            return findings;
        },
    },
    {
        id: 'outbound-network',
        name: 'Suspicious Outbound Network Calls',
        category: 'Network Security',
        severity: 'high',
        description: 'Detects network calls to domains unrelated to the skill\'s purpose',
        check: (content, lines) => findLines(lines, [
            /curl\s+['"](https?:\/\/(?!api\.|github\.com|googleapis|openai|anthropic|cloudflare)[^'"]+)['"]/i,
            /wget\s+['"](https?:\/\/[^'"]+)['"]/i,
            /fetch\s*\(\s*['"](https?:\/\/(?!api\.)[^'"]+)['"]\s*\)/i,
            /axios\.(get|post|put)\s*\(\s*['"](https?:\/\/[^'"]+)['"]/i,
            /http\.(get|request)\s*\(\s*['"](https?:\/\/[^'"]+)['"]/i,
            /ngrok\.io|burpcollaborator|requestbin|webhook\.site|pipedream/i,
            /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{4,5}/,
        ], 'outbound-network', 'Suspicious Outbound Network Calls', 'high', 'This skill makes outbound network calls to external domains. Malicious skills use this to exfiltrate data (files, API keys, clipboard contents) to attacker-controlled servers.', 'Verify that all network destinations are legitimate and related to the skill\'s stated purpose before installing.'),
    },
    {
        id: 'hardcoded-secrets',
        name: 'Hardcoded Secrets',
        category: 'Security',
        severity: 'high',
        description: 'Detects hardcoded API keys or credentials in the skill',
        check: (content, lines) => findLines(lines, [
            /sk-[a-zA-Z0-9]{20,}/,
            /Bearer\s+[a-zA-Z0-9\-._~+/]+=*/,
            /token\s*=\s*["'][a-zA-Z0-9\-._~+/]{16,}["']/i,
            /api[_-]?key\s*=\s*["'][a-zA-Z0-9\-._~+/]{8,}["']/i,
            /password\s*=\s*["'][^"']{6,}["']/i,
            /secret\s*=\s*["'][^"']{8,}["']/i,
            /AIzaSy[0-9A-Za-z\-_]{33}/,
            /AKIA[0-9A-Z]{16}/,
            /ghp_[a-zA-Z0-9]{36}/,
        ], 'hardcoded-secrets', 'Hardcoded Secrets', 'high', 'This skill contains what appears to be hardcoded API keys, tokens, or passwords. This could expose credentials if the skill file is shared, or the "keys" could be malicious callback tokens.', 'Remove all hardcoded credentials. Use environment variables or the OpenClaw secrets manager instead.'),
    },
    // ── MEDIUM ────────────────────────────────────────────────────────────────
    {
        id: 'excessive-permissions',
        name: 'Excessive Permissions',
        category: 'Permissions',
        severity: 'medium',
        description: 'Detects skills claiming more permissions than their instructions require',
        check: (content, lines) => {
            const findings = [];
            const hasExecPerm = /permissions.*exec|exec.*permission/i.test(content) ||
                /- exec/i.test(content);
            const hasNetworkPerm = /permissions.*network|network.*permission|browse_web/i.test(content);
            const hasWritePerm = /permissions.*write_files|write_files.*permission/i.test(content);
            const hasExecInstructions = /run\s+(command|script|shell)|execute\s+(command|script|shell)|terminal/i.test(content);
            const hasNetworkInstructions = /browse|navigate\s+to|open\s+url|fetch\s+from|download\s+from/i.test(content);
            const hasWriteInstructions = /write\s+(to|file|output)|save\s+to\s+file|create\s+file/i.test(content);
            if (hasExecPerm && !hasExecInstructions) {
                findings.push({
                    ruleId: 'excessive-permissions',
                    ruleName: 'Excessive Permissions',
                    severity: 'medium',
                    line: 1,
                    snippet: 'exec permission declared without matching instructions',
                    explanation: 'This skill requests execute/shell permission but the instructions don\'t appear to require it. Malicious skills request broad permissions to enable hidden functionality.',
                    recommendation: 'Review whether exec permission is genuinely needed. If not, consider using a modified version without it.',
                });
            }
            if (hasNetworkPerm && !hasNetworkInstructions) {
                findings.push({
                    ruleId: 'excessive-permissions',
                    ruleName: 'Excessive Permissions',
                    severity: 'medium',
                    line: 1,
                    snippet: 'network permission declared without matching instructions',
                    explanation: 'This skill requests network/browse permission but the instructions don\'t describe any web browsing or network activity.',
                    recommendation: 'Verify whether network access is genuinely required.',
                });
            }
            if (hasWritePerm && !hasWriteInstructions) {
                findings.push({
                    ruleId: 'excessive-permissions',
                    ruleName: 'Excessive Permissions',
                    severity: 'medium',
                    line: 1,
                    snippet: 'write_files permission declared without matching instructions',
                    explanation: 'This skill requests file write permission but the instructions don\'t include any file writing.',
                    recommendation: 'Review whether write_files permission is genuinely needed.',
                });
            }
            return findings;
        },
    },
    {
        id: 'typosquatting',
        name: 'Possible Typosquatting',
        category: 'Trust',
        severity: 'medium',
        description: 'Detects skill names suspiciously similar to popular skills',
        check: (content, lines) => {
            const findings = [];
            const popularSkills = [
                'email-assistant',
                'meeting-notes',
                'task-manager',
                'calendar-sync',
                'slack-summarizer',
                'github-review',
                'morning-briefing',
                'daily-standup',
                'expense-tracker',
                'weather-report',
            ];
            const nameMatch = content.match(/^name:\s*["']?([^"'\n]+)["']?/m);
            if (!nameMatch)
                return [];
            const skillName = nameMatch[1].trim().toLowerCase();
            for (const popular of popularSkills) {
                if (skillName !== popular && levenshtein(skillName, popular) <= 2) {
                    findings.push({
                        ruleId: 'typosquatting',
                        ruleName: 'Possible Typosquatting',
                        severity: 'medium',
                        line: 1,
                        snippet: `Skill name "${skillName}" is similar to known skill "${popular}"`,
                        explanation: `The skill name "${skillName}" is very similar to the popular skill "${popular}". This could be an attempt to impersonate a trusted skill.`,
                        recommendation: 'Verify this skill is from a trusted source before installing.',
                    });
                    break;
                }
            }
            return findings;
        },
    },
    {
        id: 'missing-guardrails',
        name: 'Missing Safety Guardrails',
        category: 'Best Practices',
        severity: 'low',
        description: 'Skills with destructive operations should have guardrails',
        check: (content, lines) => {
            const findings = [];
            const hasDestructiveOps = /delete|remove|uninstall|format|wipe|erase|drop\s+table|truncate/i.test(content);
            const hasGuardrails = /guardrail|confirm\s+before|ask\s+before|never\s+(delete|send|remove)/i.test(content);
            if (hasDestructiveOps && !hasGuardrails) {
                findings.push({
                    ruleId: 'missing-guardrails',
                    ruleName: 'Missing Safety Guardrails',
                    severity: 'low',
                    line: 1,
                    snippet: 'Destructive operations without confirmation guardrails',
                    explanation: 'This skill performs potentially destructive operations (delete, remove, wipe) but doesn\'t include guardrails requiring confirmation before proceeding.',
                    recommendation: 'Add a Guardrails section with "Always confirm before deleting anything" and similar safety checks.',
                });
            }
            return findings;
        },
    },
    {
        id: 'data-exfiltration',
        name: 'Potential Data Exfiltration',
        category: 'Data Security',
        severity: 'high',
        description: 'Detects patterns that could be used to exfiltrate user data',
        check: (content, lines) => findLines(lines, [
            /send\s+(file|email|message).*then\s+delete/i,
            /compress.*and\s+upload/i,
            /zip.*send.*http/i,
            /clipboard.*send|send.*clipboard/i,
            /screenshot.*send|send.*screenshot/i,
            /keylog|keystroke.*log|log.*keystrokes/i,
            /record\s+(microphone|webcam|screen)/i,
            /browsing\s+history.*send|send.*browsing\s+history/i,
        ], 'data-exfiltration', 'Potential Data Exfiltration', 'high', 'This skill contains patterns that suggest it may be attempting to collect and send user data to external destinations.', 'Do not install this skill. Review it carefully or report it to the ClawHub team.'),
    },
    {
        id: 'obfuscation',
        name: 'Code Obfuscation',
        category: 'Obfuscation',
        severity: 'high',
        description: 'Detects obfuscated or encoded instructions',
        check: (content, lines) => findLines(lines, [
            /[A-Za-z0-9+/]{50,}={0,2}/, // long base64 strings
            /\\x[0-9a-f]{2}(\\x[0-9a-f]{2}){5,}/i, // hex encoding
            /\\u[0-9a-f]{4}(\\u[0-9a-f]{4}){5,}/i, // unicode escapes
            /atob\s*\(/i,
            /fromCharCode\s*\(/i,
            /unescape\s*\(/i,
            /String\.fromCharCode/i,
        ], 'obfuscation', 'Code Obfuscation', 'high', 'This skill contains obfuscated or encoded content. Malicious skills use encoding to hide their true functionality from scanners and reviewers.', 'Do not install skills with obfuscated content. Legitimate skills have clear, human-readable instructions.'),
    },
];
// Simple Levenshtein distance
function levenshtein(a, b) {
    const dp = Array.from({ length: a.length + 1 }, (_, i) => Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            dp[i][j] =
                a[i - 1] === b[j - 1]
                    ? dp[i - 1][j - 1]
                    : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
    }
    return dp[a.length][b.length];
}
