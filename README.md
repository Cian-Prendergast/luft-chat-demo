# DX Coach — POC

AI coaching assistant for Lufthansa Digital Hangar practitioners navigating the ISD methodology.

## Stack

- **Frontend** — React + TypeScript + Vite + Tailwind CSS + Framer Motion
- **Backend** — Node.js + Express + Anthropic SDK (streaming)

## Setup

```bash
# 1. Install dependencies
npm install
cd server && npm install && cd ..

# 2. Add your Anthropic API key
cp server/.env.example server/.env
# edit server/.env — set ANTHROPIC_API_KEY=sk-ant-...

# 3. Start everything
make dev
```

Frontend: `http://localhost:5173`
Backend: `http://localhost:3001`

## Structure

```
isd-app/
├── src/
│   ├── content/          # ISD knowledge base (.md skills files)
│   ├── ISDChat.tsx       # Main chat UI
│   ├── ISDDashboard.tsx  # Framework reference panel (collapsible)
│   └── App.tsx
└── server/
    └── src/
        ├── index.ts      # Express API — POST /chat
        └── skills.ts     # Loads .md files into system prompt
```

## API

`POST /chat`
```json
{ "message": "What should I deliver in Define?", "role": "CX Writer", "phase": "Define" }
```
Returns a streaming SSE response.
