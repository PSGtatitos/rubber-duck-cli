# ATLAS CLI 🤖

A fast, lightweight AI assistant that lives in your terminal. Powered by Groq.

![Version](https://img.shields.io/badge/version-1.0.0-blue?style=flat-square)
![Node](https://img.shields.io/badge/node-18+-green?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-purple?style=flat-square)

---

## Installation

```bash
npm install -g atlas-cli
```

---

## Quick Start

### 1. Configure ATLAS with your Groq API key

```bash
atlas config
```

Get a free Groq API key at [console.groq.com](https://console.groq.com/keys)

### 2. Start chatting

```bash
atlas chat
```

---

## Commands

### `atlas chat`
Start a back and forth conversation with ATLAS. Conversation memory is maintained throughout the session.

```bash
atlas chat
```

```
──────────────────────────────────────────────────
  ATLAS — type your message, or "exit" to quit
──────────────────────────────────────────────────

You: what is a REST API?
ATLAS: A REST API is...

You: exit
ATLAS: Goodbye!
```

---

### `atlas ask`
Ask a single question and get an answer immediately. Perfect for quick lookups without starting a full conversation.

```bash
atlas ask "what is the difference between null and undefined in JavaScript?"
```

Supports adding files to the conversation:

```bash
atlas ask "explain this file" --file example.txt
```

---

### `atlas config`
First time setup. Saves your Groq API key securely on your machine.

```bash
atlas config
```

Your API key is stored locally at `~/.config/atlas-cli/config.json` and never sent anywhere except directly to Groq.

---

## Requirements

- Node.js 18 or higher
- A free Groq API key from [console.groq.com](https://console.groq.com/keys)

---

## Tech Stack

- **Node.js** — runtime
- **Commander.js** — CLI command handling
- **Groq SDK** — AI responses via llama-3.3-70b-versatile
- **Chalk** — terminal colors
- **Ora** — loading spinners
- **Inquirer** — interactive config prompts
- **Conf** — local config storage

---

## Roadmap

- [x] `atlas chat` — conversational mode
- [x] `atlas ask` — single question mode
- [x] `atlas config` — API key setup
- [ ] Streaming responses
- [ ] `atlas chat` with file context (`atlas chat --file index.js`)
- [ ] Web search tool
- [ ] Read and write files
- [ ] TTS voice mode
- [ ] User accounts and hosted backend
- [ ] Subscription tiers (Free / Pro / Ultimate)

---

## License

MIT — feel free to use and modify.

---

Built by [Chris](https://github.com/PSGtatitos)
