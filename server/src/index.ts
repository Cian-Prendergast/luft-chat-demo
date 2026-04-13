import 'dotenv/config'
import express, { Request, Response } from 'express'
import cors from 'cors'
import path from 'path'
import Anthropic from '@anthropic-ai/sdk'
import { loadSystemPrompt } from './skills'

const app = express()

// In production, the frontend is served from this same server —
// allow all origins (Cloud Run URL is dynamic). In dev, restrict to localhost.
const corsOrigin =
  process.env.NODE_ENV === 'production'
    ? true
    : /^http:\/\/localhost:\d+$/

app.use(cors({ origin: corsOrigin }))
app.use(express.json())

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Load all .md skills once at startup
const SYSTEM_PROMPT = loadSystemPrompt()
console.log(`[server] System prompt loaded — ${SYSTEM_PROMPT.length} chars`)

// ── POST /chat ────────────────────────────────────────────────────────────────

interface ChatRequest {
  message: string
  role?: string
  phase?: string
}

app.post('/chat', async (req: Request, res: Response) => {
  const { message, role, phase } = req.body as ChatRequest

  if (!message?.trim()) {
    res.status(400).json({ error: 'message is required' })
    return
  }

  // Inject role + phase as context prefix
  const contextPrefix =
    role || phase
      ? `[Practitioner Role: ${role ?? 'unknown'} | Current Phase: ${phase ?? 'unknown'}]\n\n`
      : ''
  const userMessage = contextPrefix + message

  // Stream the response back
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  try {
    const stream = client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
      }
    }

    res.write('data: [DONE]\n\n')
    res.end()
  } catch (err) {
    console.error('[server] Claude API error:', err)
    res.write(`data: ${JSON.stringify({ error: 'Claude API error' })}\n\n`)
    res.end()
  }
})

// ── Health check ──────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// ── Serve React frontend in production ────────────────────────────────────────

if (process.env.NODE_ENV === 'production') {
  const staticDir = path.resolve(__dirname, '../../dist')
  app.use(express.static(staticDir))
  // SPA fallback — any unmatched route serves index.html
  app.get('*', (_req, res) => {
    res.sendFile(path.join(staticDir, 'index.html'))
  })
}

const PORT = process.env.PORT ?? 3001
app.listen(PORT, () => console.log(`[server] Listening on http://localhost:${PORT}`))
