import fs from 'fs'
import path from 'path'

// Ordered list — persona must come first
const SKILL_FILES = [
  'persona.md',
  'isd-framework.md',
  'playbook.md',
  'decision-making.md',
  'collaboration.md',
  'quality-standards.md',
  'mindsets.md',
]

const CONTENT_DIR = path.resolve(__dirname, '../../src/content')

export function loadSystemPrompt(): string {
  const sections = SKILL_FILES.map((file) => {
    const filePath = path.join(CONTENT_DIR, file)
    if (!fs.existsSync(filePath)) {
      console.warn(`[skills] Missing: ${file} — skipping`)
      return null
    }
    return fs.readFileSync(filePath, 'utf-8').trim()
  }).filter(Boolean)

  return sections.join('\n\n---\n\n')
}
