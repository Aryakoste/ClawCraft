# 🛠️ ClawCraft

**The Missing "Visual Studio" for OpenClaw Skills**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)

Building OpenClaw skills is an incredibly powerful way to automate workflows across messaging platforms. But managing them locally, writing boilerplate, ensuring they are safe to run, and debugging failures can require too much context-switching.

**ClawCraft** is a comprehensive local development environment and companion skill designed for OpenClaw. It gives you a **CLI toolkit**, a **local React dashboard**, and an **OpenClaw Skill** to build, scan, debug, and manage your skills without ever touching code (unless you want to!).

---

## 🔥 Features

- 🏗️ **Visual Skill Builder**: Drag-and-drop (`@dnd-kit`) your skill logic visually, or dive into the integrated Monaco code editor for full control.
- 🤖 **AI Skill Generation**: Powered by Anthropic & OpenAI. Just type what you want (e.g., _"fetch top 3 hacker news articles"_), and ClawCraft scaffolds the entire skill.
- 🚨 **Built-in Security Scanner**: Don't run random skills blindly. ClawCraft automatically scans external skills and assigns a **Trust Score** (✅ Safe, ⚠️ Review, 🚨 Dangerous) along with findings.
- 🪲 **Live Debugger**: Inspect variables, view HTTP payloads, and trace executions in real-time from the web dashboard.
- 🤯 **The ClawCraft Skill**: Manage your OpenClaw environment _using_ an OpenClaw skill! (More on this below)

---

## 🚀 Quick Start

ClawCraft is designed to be run locally from source.

### Prerequisites

- Node.js >= 18.0.0
- npm

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Aryakoste/ClawCraft.git
   cd ClawCraft
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start the application:**
   ```bash
   npm run dev
   ```
   _(This boots both the Fastify server on port `4000` and the React Client UI concurrently!)_

---

## 💻 CLI Commands

ClawCraft provides a robust CLI to manage your environment from the terminal:

- `clawcraft start [--port]` - Start the server and UI.
- `clawcraft list` - List all installed skills & trust scores.
- `clawcraft generate <description>` - Scaffold a skill via LLM.
- `clawcraft scan [target]` - Scan skills for malicious patterns.
- `clawcraft install <url> [--force]` - Install a skill from a URL safely.
- `clawcraft fix <skillName>` - Open the UI debugger for a specific skill.
- `clawcraft improve <skillName>` - Ask AI to rewrite/optimize an existing skill.
- `clawcraft config [get/set]` - Manage your configurations.

---

## 🧠 Configuring the AI (LLMs)

To use the AI generation and improvement features, configure your LLM provider using the CLI:

```bash
# Set your core provider (anthropic, openai, ollama, openai-compat)
clawcraft config set llmProvider anthropic

# Provide your authentication key
clawcraft config set apiKey "sk-ant-xxxxxxxxxx"

# Pick your model (Defaults to claude-sonnet-4-6)
clawcraft config set model "claude-3-5-sonnet-20241022"
```

---

## 🤖 The Meta Feature: ClawCraft Skill

ClawCraft comes with its own native OpenClaw skill (located in the `/skill` directory).

Once your local ClawCraft server is running, install this skill into your preferred messaging app (Slack, Telegram, WhatsApp, etc.). You can now manage your local development environment via chat:

- `/clawcraft build "get current bitcoin price"` - Opens your browser and generates the skill.
- `/clawcraft scan {skill-url}` - Scans a repository and reads the Trust Score in the chat.
- `/clawcraft list` - Returns your installed skills.
- `/clawcraft search "find templates"` - Searches community templates.
- `/clawcraft status` - View total skill fires and estimated time saved.

---

## 🏗️ Architecture

ClawCraft is a modern monorepo:

- **`packages/client`**: React 18, Vite, TailwindCSS, Monaco Editor.
- **`packages/server`**: Fastify API, Anthropic/OpenAI integrations.
- **`skill/`**: The companion OpenClaw skill.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📝 License

This project is [MIT](https://opensource.org/licenses/MIT) licensed.
