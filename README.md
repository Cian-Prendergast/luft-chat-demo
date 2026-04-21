# DX Coach — POC

AI coaching assistant for Lufthansa Digital Hangar practitioners navigating the ISD methodology.

## Stack

- **Frontend** — React + TypeScript + Vite + Tailwind CSS + Framer Motion
- **Backend** — Node.js + Express + Anthropic SDK (streaming)

## Commands

| Command | What it does |
|---|---|
| `make dev` | Run locally (frontend + backend) |
| `make stop` | Kill local servers |
| `make deploy` | Build & deploy to Cloud Run |
| `make logs` | Tail Cloud Run logs |

## Local setup

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

## Deploy to Cloud Run

```bash
make deploy
```

Builds the Docker image via Cloud Build, pushes to GCR, and deploys to Cloud Run in `europe-west1`.  
The live URL is printed on completion.

**One-time GCloud setup** (done once per project, not per developer):

```bash
# Grant Cloud Run permission to read secrets from Secret Manager
gcloud projects add-iam-policy-binding dmnl-generative-ai-pocs --member="serviceAccount:421381233503-compute@developer.gserviceaccount.com" --role="roles/secretmanager.secretAccessor"
```

**Secrets** are stored in GCloud Secret Manager under project `dmnl-generative-ai-pocs`:

| Secret name | Description |
|---|---|
| `anthropic-api-key` | Anthropic API key |
| `figma-access-token` | Figma personal access token (optional) |

To add the Figma secret when ready:
```bash
echo -n "your-figma-token" | gcloud secrets create figma-access-token --data-file=- --project dmnl-generative-ai-pocs
```

Then uncomment `FIGMA_ACCESS_TOKEN=figma-access-token:latest` in the Makefile deploy target.

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
{ "messages": [...], "projectContext": { "role": "CX Writer", "phase": "Define", "storyline": "..." } }
```
Returns a streaming SSE response.
