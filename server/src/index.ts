import 'dotenv/config'
import express, { Request, Response } from 'express'
import cors from 'cors'
import path from 'path'
import Anthropic from '@anthropic-ai/sdk'
import { loadSystemPrompt, fetchFigmaFile, extractFigmaKey } from './skills'

const app = express()

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

// ── Tool definition ───────────────────────────────────────────────────────────

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'get_figma_file',
    description:
      'Fetches the structure of a Figma or FigJam file so you can understand the project context: pages, frames, sections, and sticky note content. Call this whenever the user mentions a Figma URL or asks you to look at their board.',
    input_schema: {
      type: 'object' as const,
      properties: {
        file_key: {
          type: 'string',
          description:
            'The Figma file key (the alphanumeric ID in the URL after /file/, /board/, or /design/). You can also accept a full Figma URL and extract the key yourself.',
        },
      },
      required: ['file_key'],
    },
  },
]

async function executeTool(name: string, input: Record<string, string>): Promise<string> {
  if (name === 'get_figma_file') {
    // Accept either a bare key or a full URL
    const key = extractFigmaKey(input.file_key) ?? input.file_key
    try {
      return await fetchFigmaFile(key)
    } catch (err) {
      return `Error fetching Figma file: ${(err as Error).message}`
    }
  }
  return `Unknown tool: ${name}`
}

// ── POST /chat ────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ChatRequest {
  messages: ChatMessage[]
  role?: string
  phase?: string
}

app.post('/chat', async (req: Request, res: Response) => {
  const { messages, role, phase } = req.body as ChatRequest

  if (!messages?.length) {
    res.status(400).json({ error: 'messages array is required' })
    return
  }

  // Inject role + phase as a prefix on the latest user message
  const contextPrefix =
    role || phase
      ? `[Practitioner Role: ${role ?? 'unknown'} | Current Phase: ${phase ?? 'unknown'}]\n\n`
      : ''

  const anthropicMessages: Anthropic.MessageParam[] = messages.map((m, i) => ({
    role: m.role,
    content:
      i === messages.length - 1 && m.role === 'user'
        ? contextPrefix + m.content
        : m.content,
  }))

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  try {
    // Agentic loop: handle tool use before streaming the final reply
    let currentMessages = [...anthropicMessages]

    while (true) {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        tools: TOOLS,
        messages: currentMessages,
      })

      if (response.stop_reason === 'tool_use') {
        // Execute all tool calls and collect results
        const toolResults: Anthropic.ToolResultBlockParam[] = []

        for (const block of response.content) {
          if (block.type === 'tool_use') {
            console.log(`[server] Tool call: ${block.name}`, block.input)
            const result = await executeTool(block.name, block.input as Record<string, string>)
            console.log(`[server] Tool result length: ${result.length} chars`)
            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: result,
            })
          }
        }

        // Add assistant turn + tool results to message history, then loop
        currentMessages = [
          ...currentMessages,
          { role: 'assistant', content: response.content },
          { role: 'user', content: toolResults },
        ]
        continue
      }

      // stop_reason === 'end_turn' — stream the final response
      const stream = client.messages.stream({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        tools: TOOLS,
        messages: currentMessages,
      })

      for await (const event of stream) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
        }
      }

      break
    }

    res.write('data: [DONE]\n\n')
    res.end()
  } catch (err) {
    console.error('[server] Error:', err)
    res.write(`data: ${JSON.stringify({ error: 'Server error' })}\n\n`)
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
  app.get('*', (_req, res) => {
    res.sendFile(path.join(staticDir, 'index.html'))
  })
}

const PORT = Number(process.env.PORT ?? 3001)
app.listen(PORT, '0.0.0.0', () => console.log(`[server] Listening on http://0.0.0.0:${PORT}`))
