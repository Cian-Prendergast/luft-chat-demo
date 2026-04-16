import fs from 'fs'
import path from 'path'
import https from 'https'

const CONTENT_DIR = path.resolve(__dirname, '../../src/content')

// Always loaded — coach can't function without these
const CORE_SKILLS = ['persona.md', 'isd-framework.md']

// Loaded on demand via the get_skill tool
export const ON_DEMAND_SKILLS = [
  'playbook',
  'decision-making',
  'collaboration',
  'quality-standards',
  'mindsets',
] as const

export type OnDemandSkill = typeof ON_DEMAND_SKILLS[number]

export function loadCorePrompt(): string {
  const sections = CORE_SKILLS.map((file) => {
    const filePath = path.join(CONTENT_DIR, file)
    if (!fs.existsSync(filePath)) {
      console.warn(`[skills] Missing core skill: ${file}`)
      return null
    }
    return fs.readFileSync(filePath, 'utf-8').trim()
  }).filter(Boolean)

  return sections.join('\n\n---\n\n')
}

export function loadSkill(name: OnDemandSkill): string {
  const filePath = path.join(CONTENT_DIR, `${name}.md`)
  if (!fs.existsSync(filePath)) {
    return `Skill "${name}" not found.`
  }
  console.log(`[skills] Loaded on-demand: ${name}.md`)
  return fs.readFileSync(filePath, 'utf-8').trim()
}

// ── Figma ──────────────────────────────────────────────────────────────────────

// Extracts the file key from any Figma or FigJam URL
// Handles: figma.com/file/KEY, figma.com/board/KEY, figma.com/design/KEY
export function extractFigmaKey(input: string): string | null {
  const match = input.match(/figma\.com\/(?:file|board|design)\/([A-Za-z0-9]+)/)
  return match ? match[1] : null
}

interface FigmaNode {
  id: string
  name: string
  type: string
  children?: FigmaNode[]
  characters?: string // text content on sticky notes etc.
}

interface FigmaFile {
  name: string
  document: FigmaNode
}

function httpsGet(url: string, token: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const options = {
      headers: { 'X-Figma-Token': token },
    }
    https.get(url, options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => resolve(data))
      res.on('error', reject)
    }).on('error', reject)
  })
}

// Recursively walk the node tree and collect a summary
function summariseNode(node: FigmaNode, depth = 0): string[] {
  const lines: string[] = []
  const indent = '  '.repeat(depth)

  // Only include meaningful node types
  const include = ['CANVAS', 'FRAME', 'SECTION', 'GROUP', 'STICKY', 'SHAPE_WITH_TEXT', 'TEXT']
  if (!include.includes(node.type) && depth > 0) return lines

  const label = node.type === 'STICKY' || node.type === 'SHAPE_WITH_TEXT' || node.type === 'TEXT'
    ? `${indent}[${node.type}] "${node.name}"${node.characters ? `: ${node.characters.slice(0, 120).replace(/\n/g, ' ')}` : ''}`
    : `${indent}[${node.type}] ${node.name}`

  lines.push(label)

  // Limit depth to avoid massive output
  if (depth < 3 && node.children) {
    for (const child of node.children.slice(0, 20)) {
      lines.push(...summariseNode(child, depth + 1))
    }
    if (node.children.length > 20) {
      lines.push(`${indent}  ... and ${node.children.length - 20} more`)
    }
  }

  return lines
}

export async function fetchFigmaFile(fileKey: string): Promise<string> {
  const token = process.env.FIGMA_ACCESS_TOKEN
  if (!token) throw new Error('FIGMA_ACCESS_TOKEN not set')

  const url = `https://api.figma.com/v1/files/${fileKey}`
  console.log(`[figma] Fetching file: ${fileKey}`)

  const raw = await httpsGet(url, token)
  const json = JSON.parse(raw) as FigmaFile & { err?: string; status?: number }

  if (json.err || json.status === 403) {
    throw new Error(`Figma API error: ${json.err ?? 'forbidden'}`)
  }

  const lines = [
    `Figma file: "${json.name}"`,
    '',
    ...summariseNode(json.document),
  ]

  return lines.join('\n')
}
