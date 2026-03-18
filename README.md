# 🦆 rubber-duck-cli

> Meet Atlas — the rubber duck that actually talks back.

Every developer has a rubber duck on their desk. Yours is named Atlas. Unlike other rubber ducks, Atlas doesn't just sit there — he answers your questions, reads your code, searches the web, and writes files. Powered by AI, living in your terminal.

![Version](https://img.shields.io/badge/version-1.0.28-blue?style=flat-square)
![Node](https://img.shields.io/badge/node-18+-green?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-purple?style=flat-square)
![BYOK](https://img.shields.io/badge/BYOK-bring%20your%20own%20keys-orange?style=flat-square)
[![GitHub stars](https://img.shields.io/github/stars/PSGtatitos/ATLAS-CLI?style=flat-square)](https://github.com/PSGtatitos/ATLAS-CLI/stargazers)

> If Atlas helps you, a ⭐ on GitHub goes a long way!

---

## Features

- 💬 **Chat mode** — back and forth conversation with memory
- ⚡ **Ask mode** — single question, instant answer
- 📄 **File context** — attach any file to your question
- 📁 **Project context** — load your entire codebase into context
- 🌐 **Web search** — search the web from your terminal
- ✍️ **Write files** — generate and write code directly to files
- 🔀 **Git integration** — understand your repo state and generate commit messages
- 🔄 **Streaming responses** — responses print token by token

---

## Installation

```bash
npm install -g rubber-duck-cli
```

Then talk to Atlas:

```bash
atlas chat
```

---

## Quick Start

### 1. Get your API keys

- **Groq** (required) — free at [console.groq.com](https://console.groq.com/keys)
- **Tavily** (optional, for web search) — free at [app.tavily.com](https://app.tavily.com)

### 2. Introduce yourself to Atlas

```bash
atlas config
```

### 3. Start talking

```bash
atlas chat
```

---

## Commands

### `atlas chat`

Start a back and forth conversation with Atlas. Memory is maintained throughout the session.

```bash
atlas chat
```

Options:
```bash
atlas chat --file path/to/file        # load a file into context
atlas chat --project path/to/project  # load entire project into context
atlas chat --git                      # load git context into conversation
```

Mid-conversation flags:
```
You: explain this --file index.js
You: search for latest Node.js version --search
You: create a README --write README.md
You: what changed recently --git
```

---

### `atlas ask`

Ask Atlas a single question and get an answer immediately.

```bash
atlas ask "what is the difference between null and undefined?"
```

Options:
```bash
atlas ask "explain this" --file index.js                     # attach a file
atlas ask "explain this" --project .                         # attach current project
atlas ask "latest React version" --search                    # search the web
atlas ask "create an express server" --write server.js       # write to file
atlas ask "what changed" --git                               # include git context
atlas ask "write a commit message" --git                     # generate commit message
```

Supports piping:
```bash
cat error.log | atlas ask "what is wrong here?"
```

---

### `atlas config`

First time setup. Introduce yourself to Atlas and give him his API keys.

```bash
atlas config
```

Keys are stored locally at `~/.config/rubber-duck-cli/config.json` and never sent anywhere except directly to Groq and Tavily.

---

### `atlas help`

Ask Atlas what he can do.

```bash
atlas help
```

---

## Examples

```bash
# Ask Atlas to explain a file
atlas ask "explain what this does" --file index.js

# Let Atlas debug your errors
cat error.log | atlas ask "what is wrong here?"

# Ask Atlas to write code for you
atlas ask "create a REST API with Express" --write server.js

# Ask Atlas to fix a bug
atlas ask "fix the bug in this file" --file index.js --write index.js

# Ask Atlas to search the web
atlas ask "what is the latest version of Node.js" --search

# Have a full conversation about your codebase
atlas chat --project .
You: what does this project do?
You: how can I improve the architecture?
You: add input validation --file index.js --write index.js

# Let Atlas handle your git workflow
git add .
atlas ask "write a commit message for my staged changes" --git

# Understand what changed in your repo
atlas ask "summarize what changed in the last 10 commits" --git

# Git context in chat
atlas chat --git
You: what did I change today?
You: write a commit message for my staged changes
```

---

## How Atlas Works

Atlas is fully client side. Your API keys never leave your machine except to talk directly to Groq and Tavily. There is no backend, no account required, and no usage limits beyond what your API keys allow.

```
atlas chat
    ↓
Your machine
    ↓ direct API call
Groq (Atlas's brain)
Tavily (Atlas's web search)
Git (Atlas reads your repo)
```

---

## Flags Reference

| Flag | Short | Description |
|------|-------|-------------|
| `--file <path>` | `-f` | Attach a file to your question |
| `--project <path>` | `-p` | Attach a project directory |
| `--search` | `-s` | Search the web |
| `--write <path>` | `-w` | Write response to a file |
| `--git` | `-g` | Include git context |

---

## Requirements

- Node.js 18 or higher
- Groq API key — free at [console.groq.com](https://console.groq.com/keys)
- Tavily API key — optional, free at [app.tavily.com](https://app.tavily.com)

---

## Tech Stack

- **Node.js** — runtime
- **Commander.js** — CLI command handling
- **Groq SDK** — Atlas's brain via llama-3.3-70b-versatile
- **Tavily** — Atlas's web search
- **Chalk** — terminal colors
- **Ora** — loading spinners
- **Inquirer** — interactive config prompts
- **Conf** — local config storage

---

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a pull request.

rubber-duck-cli is and will remain open source and BYOK. Features that require a centralized backend or paid service are not aligned with the project direction.

---

## Roadmap

- [x] `atlas chat` — conversational mode
- [x] `atlas ask` — single question mode
- [x] `atlas config` — API key setup
- [x] `atlas help` — help command
- [x] Streaming responses
- [x] `--file` flag — attach files to questions
- [x] `--project` flag — load entire codebase
- [x] `--search` flag — web search via Tavily
- [x] `--write` flag — write responses to files
- [x] `--git` flag — git integration and commit message generation
- [ ] `--run` flag — execute terminal commands safely
- [ ] Multi-file write support

---

## License

MIT — free to use, modify, and distribute.

---

Built by [Chris](https://github.com/PSGtatitos) from Athens, Greece 🇬🇷

*Atlas the rubber duck has been helping developers since 2026. He's very smart for a duck.*
