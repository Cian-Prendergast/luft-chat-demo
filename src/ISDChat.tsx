import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ── Types ──────────────────────────────────────────────────────────────────────

interface Message {
  id: string
  role: 'user' | 'assistant'
  text: string
}

export interface ProjectContext {
  role: string
  storyline: string
  figmaUrl: string
  deadline: string
  phase: string
}

const ISD_PHASES = ['Empathize', 'Define', 'Ideate', 'Prototype', 'Implement', 'Measure', 'Listen']
const ROLES = ['Service Designer', 'CX Writer', 'Product Owner', 'Developer', 'Researcher']

// ── Quick prompts ──────────────────────────────────────────────────────────────

const QUICK_PROMPTS = [
  { icon: '🟥', label: 'Am I ready to move to the ideation phase?' },
  { icon: '⚠️', label: 'What are the risks if I skip the Empathize step?' },
  { icon: '✅', label: 'What does a UX Writer deliver in this step?' },
]

// ── TopBar ─────────────────────────────────────────────────────────────────────

function TopBar({ project, onEditProject }: { project: ProjectContext | null; onEditProject: () => void }) {
  return (
    <header className="flex items-center justify-between px-8 py-5">
      <div className="border-2 border-[#1a2044] rounded px-3 py-1.5 leading-tight">
        <p className="text-[10px] font-bold tracking-widest text-[#1a2044] uppercase">Lufthansa Group</p>
        <p className="text-[10px] font-bold tracking-widest text-[#1a2044] uppercase">Digital Hangar</p>
      </div>

      {/* Context card chip — visible once project is set */}
      {project && (
        <button
          onClick={onEditProject}
          className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm hover:border-gray-300 transition-colors"
        >
          <div className="text-left">
            <p className="text-xs font-semibold text-[#1a2044] leading-tight truncate max-w-[260px]">
              {project.storyline || 'Untitled project'}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-gray-400">{project.role}</span>
              {project.phase && (
                <>
                  <span className="text-[10px] text-gray-300">·</span>
                  <span className="text-[10px] text-gray-400">{project.phase}</span>
                </>
              )}
              {project.deadline && (
                <>
                  <span className="text-[10px] text-gray-300">·</span>
                  <span className="text-[10px] text-gray-400">Due {project.deadline}</span>
                </>
              )}
            </div>
          </div>
          <svg className="w-3 h-3 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
      )}

      <div className="w-10 h-10 rounded-full bg-gray-300" />
    </header>
  )
}

// ── Project Setup Screen ───────────────────────────────────────────────────────

function ProjectSetup({ onDone }: { onDone: (ctx: ProjectContext) => void }) {
  const [role, setRole] = useState('')
  const [storyline, setStoryline] = useState('')
  const [figmaUrl, setFigmaUrl] = useState('')
  const [deadline, setDeadline] = useState('')

  const canSubmit = role.trim() && storyline.trim()

  const handleSubmit = () => {
    if (!canSubmit) return
    onDone({ role, storyline, figmaUrl, deadline, phase: '' })
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 pb-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl"
      >
        <h1 className="text-2xl font-bold text-[#1a2044] text-center mb-2">
          Set up your project context
        </h1>
        <p className="text-gray-500 text-center text-sm mb-8">
          Two fields and you're in. The coach does the rest.
        </p>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden divide-y divide-gray-100">

          {/* Role */}
          <div className="px-5 py-4">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Your role <span className="text-red-400">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {ROLES.map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    role === r
                      ? 'bg-[#1a2044] text-white border-[#1a2044]'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Storyline */}
          <div className="px-5 py-4">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              What are you building? <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={storyline}
              onChange={(e) => setStoryline(e.target.value)}
              placeholder="e.g. Redesigning the check-in flow for LH mobile"
              className="w-full text-sm text-gray-700 placeholder-gray-400 outline-none"
            />
          </div>

          {/* Figma URL */}
          <div className="px-5 py-4">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Figma board URL
              <span className="ml-2 text-gray-400 font-normal normal-case tracking-normal">optional — coach will read your board</span>
            </label>
            <input
              type="url"
              value={figmaUrl}
              onChange={(e) => setFigmaUrl(e.target.value)}
              placeholder="https://www.figma.com/board/..."
              className="w-full text-sm text-gray-700 placeholder-gray-400 outline-none"
            />
          </div>

          {/* Deadline */}
          <div className="px-5 py-4">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Deadline
              <span className="ml-2 text-gray-400 font-normal normal-case tracking-normal">optional — coach flags time pressure</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {ISD_PHASES.map((p) => (
                <span key={p} className="hidden" />
              ))}
            </div>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="text-sm text-gray-700 outline-none"
            />
          </div>

          {/* Submit */}
          <div className="px-5 py-4 bg-gray-50 flex items-center justify-between">
            <p className="text-xs text-gray-400">Phase will be inferred from your Figma board or conversation</p>
            <motion.button
              whileHover={{ scale: canSubmit ? 1.03 : 1 }}
              whileTap={{ scale: canSubmit ? 0.97 : 1 }}
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                canSubmit
                  ? 'bg-[#1a2044] text-white hover:bg-[#243060]'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Start coaching →
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ── WelcomeScreen (first message after setup) ──────────────────────────────────

function WelcomeScreen({ onSend, project }: { onSend: (text: string) => void; project: ProjectContext }) {
  const [input, setInput] = useState('')

  const submit = (text: string) => {
    const t = text.trim()
    if (t) onSend(t)
    setInput('')
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 pb-16">
      <h1 className="text-3xl font-bold text-[#1a2044] text-center mb-3">
        Hi{project.role ? `, ${project.role}` : ''}! 👋 I am your DX Coach.
      </h1>

      <p className="text-gray-500 text-center max-w-2xl text-base leading-relaxed mb-4">
        I can see you're working on <span className="font-medium text-gray-700">"{project.storyline}"</span>.
        {project.figmaUrl
          ? " I'll read your Figma board to understand where you are."
          : ' Tell me what phase you\'re in and I\'ll guide you from there.'}
      </p>

      <p className="text-gray-400 text-xs text-center max-w-xl mb-10 leading-relaxed">
        Disclaimer: I am a PoC currently trained strictly on the core ISD Framework. Final judgment always rests with you and your Chapter Lead.
      </p>

      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit(input)}
          placeholder={project.figmaUrl ? 'Ask anything, or say "look at my Figma board"' : 'Send a message'}
          className="w-full px-5 py-4 text-sm text-gray-700 placeholder-gray-400 outline-none"
        />
        <div className="border-t border-gray-200 flex justify-end px-4 py-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => submit(input)}
            className="p-2 bg-[#1a2044] text-white rounded-lg"
          >
            <svg className="w-4 h-4 rotate-90" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </motion.button>
        </div>
      </div>

      <p className="text-xs text-gray-400 mb-3">Not sure where to start?</p>
      <div className="flex flex-wrap justify-center gap-2">
        {QUICK_PROMPTS.map((p) => (
          <motion.button
            key={p.label}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => submit(p.label)}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-300 rounded-full text-xs text-gray-700 hover:border-gray-400 transition-colors shadow-sm"
          >
            <span>{p.icon}</span>
            {p.label}
          </motion.button>
        ))}
      </div>
    </div>
  )
}

// ── ChatScreen ─────────────────────────────────────────────────────────────────

function ChatScreen({
  messages,
  onSend,
  onReset,
  project,
}: {
  messages: Message[]
  onSend: (text: string) => void
  onReset: () => void
  project: ProjectContext
}) {
  const [input, setInput] = useState('')

  const submit = (text: string) => {
    const t = text.trim()
    if (t) onSend(t)
    setInput('')
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-[#1a2044] text-white rounded-br-none'
                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                }`}
              >
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Quick prompts */}
      <div className="px-6 pb-2 flex gap-2 overflow-x-auto">
        {QUICK_PROMPTS.map((p) => (
          <button
            key={p.label}
            onClick={() => submit(p.label)}
            className="whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs text-gray-600 hover:border-gray-400 transition-colors"
          >
            <span>{p.icon}</span>
            {p.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="px-6 pb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit(input)}
            placeholder={project.figmaUrl ? 'Ask anything, or say "look at my Figma board"' : 'Send a message'}
            className="w-full px-5 py-4 text-sm text-gray-700 placeholder-gray-400 outline-none"
          />
          <div className="border-t border-gray-200 flex items-center justify-end px-4 py-2 gap-3">
            <button onClick={onReset} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              New chat
            </button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => submit(input)}
              className="p-2 bg-[#1a2044] text-white rounded-lg"
            >
              <svg className="w-4 h-4 rotate-90" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────────

const API_URL = import.meta.env.DEV ? 'http://localhost:3001' : ''

export default function ISDChat() {
  const [project, setProject] = useState<ProjectContext | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [showSetup, setShowSetup] = useState(true)

  const handleProjectDone = (ctx: ProjectContext) => {
    setProject(ctx)
    setShowSetup(false)
  }

  const handleSend = async (text: string) => {
    if (!project) return

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)

    const assistantId = (Date.now() + 1).toString()
    setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', text: '' }])

    const history = updatedMessages.map((m) => ({ role: m.role, content: m.text }))

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, projectContext: project }),
      })

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) return

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter((l) => l.startsWith('data: '))

        for (const line of lines) {
          const data = line.replace('data: ', '').trim()
          if (data === '[DONE]') break
          try {
            const parsed = JSON.parse(data)
            // Silent context update from update_project_context tool
            if (parsed.type === 'context_update') {
              setProject((prev) => prev ? { ...prev, ...parsed.context } : prev)
            } else if (parsed.text) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, text: m.text + parsed.text } : m
                )
              )
            }
          } catch {
            // ignore malformed chunks
          }
        }
      }
    } catch (err) {
      console.error('Chat error:', err)
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, text: 'Sorry, something went wrong. Is the backend running?' } : m
        )
      )
    }
  }

  const handleReset = () => {
    setMessages([])
    setShowSetup(true)
    setProject(null)
  }

  return (
    <div className="flex flex-col h-full bg-[#f3f3f6]">
      <TopBar project={project} onEditProject={() => setShowSetup(true)} />

      <AnimatePresence mode="wait">
        {showSetup ? (
          <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col min-h-0">
            <ProjectSetup onDone={handleProjectDone} />
          </motion.div>
        ) : project && messages.length === 0 ? (
          <motion.div key="welcome" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col min-h-0">
            <WelcomeScreen onSend={handleSend} project={project} />
          </motion.div>
        ) : (
          <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col min-h-0">
            <ChatScreen messages={messages} onSend={handleSend} onReset={handleReset} project={project!} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
