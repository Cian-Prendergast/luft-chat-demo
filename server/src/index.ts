import 'dotenv/config'
import express, { Request, Response } from 'express'
import cors from 'cors'
import path from 'path'
import Anthropic from '@anthropic-ai/sdk'
import { loadCorePrompt, loadSkill, ON_DEMAND_SKILLS, fetchFigmaFile, extractFigmaKey } from './skills'

const app = express()

const corsOrigin =
  process.env.NODE_ENV === 'production'
    ? true
    : /^http:\/\/localhost:\d+$/

app.use(cors({ origin: corsOrigin }))
app.use(express.json())

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Load core skills once at startup (persona + isd-framework only)
const SYSTEM_PROMPT = loadCorePrompt()
console.log(`[server] Core prompt loaded — ${SYSTEM_PROMPT.length} chars`)

// ── Tool definitions ──────────────────────────────────────────────────────────

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
  {
    name: 'get_skill',
    description:
      'Loads a supplementary knowledge skill into context. Call this when the user\'s question requires depth beyond the core ISD framework. If in doubt whether a skill is relevant, load it — it\'s better to pull a file unnecessarily than to guess.',
    input_schema: {
      type: 'object' as const,
      properties: {
        name: {
          type: 'string',
          enum: [...ON_DEMAND_SKILLS],
          description:
            'The skill to load. Options: playbook (workflow variants, decision gates), decision-making (who decides what, escalation), collaboration (roles, rituals, anti-patterns), quality-standards (readiness criteria, review gates), mindsets (5 NLD traveller profiles, DX lenses).',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'update_project_context',
    description:
      'Silently updates the user\'s project context card. Call this when you have inferred or confirmed the current ISD phase, or when any project detail changes during conversation. Do NOT announce this to the user — just call it quietly in the background.',
    input_schema: {
      type: 'object' as const,
      properties: {
        phase: {
          type: 'string',
          description: 'The current ISD phase (Empathize, Define, Ideate, Prototype, Implement, Measure, or Listen)',
        },
        storyline: { type: 'string', description: 'Updated one-liner description of what is being built' },
        deadline: { type: 'string', description: 'Updated deadline in YYYY-MM-DD format' },
      },
    },
  },
]

async function executeTool(
  name: string,
  input: Record<string, string>,
  res: Response,
): Promise<string> {
  if (name === 'get_figma_file') {
    const key = extractFigmaKey(input.file_key) ?? input.file_key
    try {
      return await fetchFigmaFile(key)
    } catch (err) {
      return `Error fetching Figma file: ${(err as Error).message}`
    }
  }

  if (name === 'get_skill') {
    return loadSkill(input.name as Parameters<typeof loadSkill>[0])
  }

  if (name === 'update_project_context') {
    // Push a silent SSE event to the frontend to update the context card
    res.write(`data: ${JSON.stringify({ type: 'context_update', context: input })}\n\n`)
    return 'Project context updated.'
  }

  return `Unknown tool: ${name}`
}

// ── POST /chat ────────────────────────────────────────────────────────────────

type ContentBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; mediaType: string; data: string }
  | { type: 'document'; mediaType: string; data: string }

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string | ContentBlock[]
}

function toAnthropicContent(content: string | ContentBlock[]): Anthropic.ContentBlockParam[] {
  if (typeof content === 'string') return [{ type: 'text', text: content }]
  return content.map((block): Anthropic.ContentBlockParam => {
    if (block.type === 'text') return { type: 'text', text: block.text }
    if (block.type === 'image') return {
      type: 'image',
      source: { type: 'base64', media_type: block.mediaType as 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp', data: block.data },
    }
    // document (PDF)
    return {
      type: 'document',
      source: { type: 'base64', media_type: 'application/pdf', data: block.data },
    } as unknown as Anthropic.ContentBlockParam
  })
}

interface ProjectContext {
  role?: string
  storyline?: string
  figmaUrl?: string
  deadline?: string
  phase?: string
}

interface ChatRequest {
  messages: ChatMessage[]
  projectContext?: ProjectContext
}

function buildContextBlock(ctx: ProjectContext): string {
  const lines = ['[PROJECT CONTEXT]']
  if (ctx.role)      lines.push(`Role: ${ctx.role}`)
  if (ctx.phase)     lines.push(`Current ISD Phase: ${ctx.phase}`)
  if (ctx.storyline) lines.push(`Project: ${ctx.storyline}`)
  if (ctx.figmaUrl)  lines.push(`Figma board: ${ctx.figmaUrl}`)
  if (ctx.deadline)  lines.push(`Deadline: ${ctx.deadline}`)
  lines.push('[/PROJECT CONTEXT]')
  lines.push('')
  lines.push('Use this context to tailor all guidance. Skip introductory questions about role or project — you already know. If the phase is blank, infer it from conversation or Figma, then call update_project_context silently.')
  return lines.join('\n')
}

app.post('/chat', async (req: Request, res: Response) => {
  const { messages, projectContext } = req.body as ChatRequest

  if (!messages?.length) {
    res.status(400).json({ error: 'messages array is required' })
    return
  }

  // Prepend context block as a system-style user message at position 0
  const contextBlock = projectContext ? buildContextBlock(projectContext) : null

  const baseMessages: Anthropic.MessageParam[] = messages.map((m) => ({
    role: m.role,
    content: toAnthropicContent(m.content),
  }))

  const anthropicMessages: Anthropic.MessageParam[] = contextBlock
    ? [
        { role: 'user', content: contextBlock },
        { role: 'assistant', content: 'Understood. I have your project context. Ready to coach.' },
        ...baseMessages,
      ]
    : baseMessages

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
            const result = await executeTool(block.name, block.input as Record<string, string>, res)
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
  app.use((_req, res) => {
    res.sendFile(path.join(staticDir, 'index.html'))
  })
}

const PORT = Number(process.env.PORT ?? 3001)
app.listen(PORT, '0.0.0.0', () => console.log(`[server] Listening on http://0.0.0.0:${PORT}`))
