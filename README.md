# DX Coach — POC

AI coaching assistant for Lufthansa Digital Hangar practitioners navigating the ISD methodology.

## Stack

- **Frontend** — React + TypeScript + Vite + Tailwind CSS + Framer Motion
- **Backend** — Python + FastAPI + Anthropic SDK (streaming SSE)

## Commands

| Command | What it does |
|---|---|
| `make dev` | Run locally (frontend + backend) |
| `make stop` | Kill local servers |
| `make deploy` | Build & deploy to Cloud Run |
| `make logs` | Tail Cloud Run logs |

## Local setup

```bash
# 1. Install frontend dependencies
npm install

# 2. Add your Anthropic API key
cp server/.env.example server/.env
# edit server/.env — set ANTHROPIC_API_KEY=sk-ant-...

# 3. Start everything (installs Python deps via uv automatically)
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

**Secrets** — local vs Cloud Run work differently:

| | Local (`make dev`) | Cloud Run (`make deploy`) |
|---|---|---|
| `ANTHROPIC_API_KEY` | `server/.env` | GCloud Secret Manager |
| `FIGMA_ACCESS_TOKEN` | `server/.env` | GCloud Secret Manager |

> `.env` is never included in the Docker image. Cloud Run has no access to it — secrets must be pushed to Secret Manager separately.

To push a secret to GCloud (one-time per secret):
```bash
echo -n "your-anthropic-key" | gcloud secrets create anthropic-api-key --data-file=- --project dmnl-generative-ai-pocs
echo -n "your-figma-token"   | gcloud secrets create figma-access-token --data-file=- --project dmnl-generative-ai-pocs
```

Once the `figma-access-token` secret exists, uncomment the `FIGMA_ACCESS_TOKEN` line in the Makefile `deploy` target.

## Structure

```
isd-app/
├── src/
│   ├── content/          # ISD knowledge base (.md skills files)
│   ├── ISDChat.tsx       # Main chat UI
│   ├── ISDDashboard.tsx  # Framework reference panel (collapsible)
│   └── App.tsx
└── server/
    ├── main.py           # FastAPI server — POST /chat, SSE streaming, agentic loop
    ├── skills.py         # Loads .md files, Figma API integration
    └── requirements.txt  # Python dependencies (managed via uv)
```

## API

`POST /chat`
```json
{ "messages": [...], "projectContext": { "role": "CX Writer", "phase": "Define", "storyline": "..." } }
```
Returns a streaming SSE response.
