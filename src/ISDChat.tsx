import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ProjectContext {
  role: string
  storyline: string
  figmaUrl: string
  deadline: string
  phase: string
}

// File attached to a pending message — holds base64 for sending, preview for display
interface PendingFile {
  name: string
  mediaType: string
  data: string       // base64
  preview?: string   // object URL for images
  isImage: boolean
}

// Stored in message history for display only (no base64 kept in state)
interface MessageAttachment {
  name: string
  preview?: string   // object URL, valid for session lifetime
  isImage: boolean
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  text: string
  attachment?: MessageAttachment
}


const SUPPORTED_TYPES: Record<string, string> = {
  'image/png':       'image/png',
  'image/jpeg':      'image/jpeg',
  'image/webp':      'image/webp',
  'image/gif':       'image/gif',
  'application/pdf': 'application/pdf',
}

async function readFile(file: File): Promise<PendingFile | null> {
  const mediaType = SUPPORTED_TYPES[file.type]
  if (!mediaType) return null

  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const data = dataUrl.split(',')[1] // strip "data:...;base64,"
      const isImage = file.type.startsWith('image/')
      resolve({
        name: file.name,
        mediaType,
        data,
        preview: isImage ? dataUrl : undefined,
        isImage,
      })
    }
    reader.readAsDataURL(file)
  })
}

const ROLES = [
  'UX Designer', 'UI Designer', 'UX Writer', 'User Researcher',
  'Service Designer', 'Conversational Designer',
  'CX Writer', 'Product Owner', 'Developer', 'Researcher',
]

function parseOptions(text: string): { body: string; options: string[] } {
  const match = text.match(/<options>([\s\S]*?)<\/options>/)
  if (!match) return { body: text, options: [] }
  const options = match[1]
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
  const body = text.replace(/<options>[\s\S]*?<\/options>/, '').trim()
  return { body, options }
}

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
              {project.phase && <><span className="text-[10px] text-gray-300">·</span><span className="text-[10px] text-gray-400">{project.phase}</span></>}
              {project.deadline && <><span className="text-[10px] text-gray-300">·</span><span className="text-[10px] text-gray-400">Due {project.deadline}</span></>}
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

// ── AttachmentChip — pending file preview ──────────────────────────────────────

function AttachmentChip({ file, onRemove }: { file: PendingFile; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 max-w-[260px]">
      {file.isImage && file.preview ? (
        <img src={file.preview} className="w-8 h-8 rounded object-cover shrink-0" alt="" />
      ) : (
        <svg className="w-6 h-6 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )}
      <span className="text-xs text-gray-600 truncate">{file.name}</span>
      <button onClick={onRemove} className="text-gray-400 hover:text-gray-600 ml-auto shrink-0">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

// ── MessageAttachmentDisplay — shown in chat history ──────────────────────────

function MessageAttachmentDisplay({ attachment }: { attachment: MessageAttachment }) {
  if (attachment.isImage && attachment.preview) {
    return (
      <img
        src={attachment.preview}
        className="mt-2 max-w-[280px] rounded-xl border border-white/20 object-cover"
        alt={attachment.name}
      />
    )
  }
  return (
    <div className="mt-2 flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <span className="text-xs truncate">{attachment.name}</span>
    </div>
  )
}

// ── ProjectSetup ───────────────────────────────────────────────────────────────

function ProjectSetup({ onDone }: { onDone: (ctx: ProjectContext) => void }) {
  const [role, setRole] = useState('')
  const [storyline, setStoryline] = useState('')
  const [figmaUrl, setFigmaUrl] = useState('')
  const [deadline, setDeadline] = useState('')
  const canSubmit = role.trim() && storyline.trim()

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 pb-10">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-xl">
        <h1 className="text-2xl font-bold text-[#1a2044] text-center mb-2">Set up your project context</h1>
        <p className="text-gray-500 text-center text-sm mb-8">Two fields and you're in. The coach does the rest.</p>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden divide-y divide-gray-100">
          <div className="px-5 py-4">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Your role <span className="text-red-400">*</span></label>
            <div className="flex flex-wrap gap-2">
              {ROLES.map((r) => (
                <button key={r} onClick={() => setRole(r)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${role === r ? 'bg-[#1a2044] text-white border-[#1a2044]' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="px-5 py-4">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">What are you building? <span className="text-red-400">*</span></label>
            <input type="text" value={storyline} onChange={(e) => setStoryline(e.target.value)}
              placeholder="e.g. Redesigning the check-in flow for LH mobile"
              className="w-full text-sm text-gray-700 placeholder-gray-400 outline-none" />
          </div>

          <div className="px-5 py-4">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Figma board URL <span className="ml-1 text-gray-400 font-normal normal-case tracking-normal">optional</span>
            </label>
            <input type="url" value={figmaUrl} onChange={(e) => setFigmaUrl(e.target.value)}
              placeholder="https://www.figma.com/board/..."
              className="w-full text-sm text-gray-700 placeholder-gray-400 outline-none" />
          </div>

          <div className="px-5 py-4">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Deadline <span className="ml-1 text-gray-400 font-normal normal-case tracking-normal">optional</span>
            </label>
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
              className="text-sm text-gray-700 outline-none" />
          </div>

          <div className="px-5 py-4 bg-gray-50 flex items-center justify-between">
            <p className="text-xs text-gray-400">Phase inferred from Figma or conversation</p>
            <motion.button whileHover={{ scale: canSubmit ? 1.03 : 1 }} whileTap={{ scale: canSubmit ? 0.97 : 1 }}
              onClick={() => canSubmit && onDone({ role, storyline, figmaUrl, deadline, phase: '' })}
              disabled={!canSubmit}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${canSubmit ? 'bg-[#1a2044] text-white hover:bg-[#243060]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
              Start coaching →
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ── Shared input bar ───────────────────────────────────────────────────────────

function InputBar({
  placeholder,
  onSubmit,
  extraLeft,
}: {
  placeholder: string
  onSubmit: (text: string, file: PendingFile | null) => void
  extraLeft?: React.ReactNode
}) {
  const [input, setInput] = useState('')
  const [file, setFile] = useState<PendingFile | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0]
    if (!picked) return
    const result = await readFile(picked)
    if (result) setFile(result)
    e.target.value = ''
  }

  const submit = () => {
    const t = input.trim()
    if (!t && !file) return
    onSubmit(t, file)
    setInput('')
    setFile(null)
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Pending attachment preview */}
      {file && (
        <div className="px-4 pt-3">
          <AttachmentChip file={file} onRemove={() => setFile(null)} />
        </div>
      )}

      <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder={placeholder}
        className="w-full px-5 py-4 text-sm text-gray-700 placeholder-gray-400 outline-none" />

      <div className="border-t border-gray-200 flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-3">
          {extraLeft}
          <button onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            title="Attach image or PDF">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <span className="text-xs">Attach</span>
          </button>
          <span className="text-[10px] text-gray-300">PNG · JPG · WebP · PDF</span>
        </div>
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={submit}
          className="p-2 bg-[#1a2044] text-white rounded-lg">
          <svg className="w-4 h-4 rotate-90" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </motion.button>
      </div>
      <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif,application/pdf" className="hidden" onChange={handleFile} />
    </div>
  )
}

// ── WelcomeScreen ──────────────────────────────────────────────────────────────

function WelcomeScreen({ onSend, project }: { onSend: (text: string, file: PendingFile | null) => void; project: ProjectContext }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 pb-16">
      <h1 className="text-3xl font-bold text-[#1a2044] text-center mb-3">
        Hi{project.role ? `, ${project.role}` : ''}! 👋 I am your DX Coach.
      </h1>
      <p className="text-gray-500 text-center max-w-2xl text-base leading-relaxed mb-4">
        I can see you're working on <span className="font-medium text-gray-700">"{project.storyline}"</span>.
        {project.figmaUrl ? " I'll read your Figma board to understand where you are." : " Tell me what phase you're in and I'll guide you from there."}
      </p>
      <p className="text-gray-400 text-xs text-center max-w-xl mb-10 leading-relaxed">
        Disclaimer: PoC trained on the core ISD Framework. Final judgment rests with you and your Chapter Lead.
      </p>

      <div className="w-full max-w-2xl mb-4">
        <InputBar
          placeholder={project.figmaUrl ? 'Ask anything, or say "look at my Figma board"' : 'Send a message or attach a screenshot'}
          onSubmit={onSend}
        />
      </div>

      <p className="text-xs text-gray-400 mb-3">Not sure where to start?</p>
      <div className="flex flex-wrap justify-center gap-2">
        {QUICK_PROMPTS.map((p) => (
          <motion.button key={p.label} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => onSend(p.label, null)}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-300 rounded-full text-xs text-gray-700 hover:border-gray-400 transition-colors shadow-sm">
            <span>{p.icon}</span>{p.label}
          </motion.button>
        ))}
      </div>
    </div>
  )
}

// ── ChatScreen ─────────────────────────────────────────────────────────────────

const MD_COMPONENTS = {
  p: ({ children }: any) => <p className="mb-2 last:mb-0">{children}</p>,
  strong: ({ children }: any) => <strong className="font-semibold">{children}</strong>,
  ul: ({ children }: any) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
  li: ({ children }: any) => <li className="text-sm">{children}</li>,
  hr: () => <hr className="my-3 border-gray-200" />,
  table: ({ children }: any) => <div className="overflow-x-auto mb-2"><table className="text-xs border-collapse w-full">{children}</table></div>,
  th: ({ children }: any) => <th className="border border-gray-200 px-2 py-1 bg-gray-50 font-semibold text-left">{children}</th>,
  td: ({ children }: any) => <td className="border border-gray-200 px-2 py-1">{children}</td>,
  h1: ({ children }: any) => <h1 className="font-bold text-base mb-2">{children}</h1>,
  h2: ({ children }: any) => <h2 className="font-bold text-sm mb-1 mt-3">{children}</h2>,
  h3: ({ children }: any) => <h3 className="font-semibold text-sm mb-1 mt-2">{children}</h3>,
}

function ChatScreen({
  messages, onSend, onReset, project,
}: {
  messages: Message[]
  onSend: (text: string, file: PendingFile | null) => void
  onReset: () => void
  project: ProjectContext
}) {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const { body, options } = msg.role === 'assistant' ? parseOptions(msg.text) : { body: msg.text, options: [] }
            return (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-[#1a2044] text-white rounded-br-none'
                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                }`}>
                  {msg.role === 'assistant' && !msg.text ? (
                    <span className="flex items-center gap-1 h-4">
                      {[0, 1, 2].map((i) => (
                        <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400 block"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
                      ))}
                    </span>
                  ) : msg.role === 'assistant' ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>{body}</ReactMarkdown>
                  ) : body}
                  {msg.attachment && <MessageAttachmentDisplay attachment={msg.attachment} />}
                </div>
                {options.length > 0 && (
                  <div className="mt-2 max-w-[78%] flex flex-col gap-2">
                    {options.map((opt) => (
                      <motion.button key={opt} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => onSend(opt, null)}
                        className="text-left px-4 py-2.5 bg-white border border-[#1a2044] text-[#1a2044] rounded-xl text-sm font-medium hover:bg-[#1a2044] hover:text-white transition-colors shadow-sm">
                        {opt}
                      </motion.button>
                    ))}
                  </div>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      <div className="px-6 pb-2 flex gap-2 overflow-x-auto">
        {QUICK_PROMPTS.map((p) => (
          <button key={p.label} onClick={() => onSend(p.label, null)}
            className="whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs text-gray-600 hover:border-gray-400 transition-colors">
            <span>{p.icon}</span>{p.label}
          </button>
        ))}
      </div>

      <div className="px-6 pb-6">
        <InputBar
          placeholder={project.figmaUrl ? 'Ask anything, or say "look at my Figma board"' : 'Send a message or attach a screenshot'}
          onSubmit={onSend}
          extraLeft={
            <button onClick={onReset} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              New chat
            </button>
          }
        />
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

  const handleSend = async (text: string, file: PendingFile | null) => {
    if (!project) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: text || (file ? file.name : ''),
      attachment: file ? { name: file.name, preview: file.preview, isImage: file.isImage } : undefined,
    }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)

    const assistantId = (Date.now() + 1).toString()
    setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', text: '' }])

    // Build content blocks for the last user message
    type ContentBlock =
      | { type: 'text'; text: string }
      | { type: 'image'; mediaType: string; data: string }
      | { type: 'document'; mediaType: string; data: string }

    const lastContent: ContentBlock[] = []
    if (text) lastContent.push({ type: 'text', text })
    if (file) {
      if (file.isImage) lastContent.push({ type: 'image', mediaType: file.mediaType, data: file.data })
      else lastContent.push({ type: 'document', mediaType: file.mediaType, data: file.data })
    }

    // History: all previous messages as plain text, last as content blocks
    const history = [
      ...updatedMessages.slice(0, -1).map((m) => ({ role: m.role, content: m.text })),
      { role: 'user' as const, content: lastContent.length === 1 && lastContent[0].type === 'text' ? text : lastContent },
    ]

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
        for (const line of chunk.split('\n').filter((l) => l.startsWith('data: '))) {
          const data = line.replace('data: ', '').trim()
          if (data === '[DONE]') break
          try {
            const parsed = JSON.parse(data)
            if (parsed.type === 'context_update') {
              setProject((prev) => prev ? { ...prev, ...parsed.context } : prev)
            } else if (parsed.text) {
              setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, text: m.text + parsed.text } : m))
            }
          } catch { /* ignore malformed chunks */ }
        }
      }
    } catch (err) {
      console.error('Chat error:', err)
      setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, text: 'Sorry, something went wrong. Is the backend running?' } : m))
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#f3f3f6]">
      <TopBar project={project} onEditProject={() => setShowSetup(true)} />
      <AnimatePresence mode="wait">
        {showSetup ? (
          <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col min-h-0">
            <ProjectSetup onDone={(ctx) => { setProject(ctx); setShowSetup(false) }} />
          </motion.div>
        ) : project && messages.length === 0 ? (
          <motion.div key="welcome" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col min-h-0">
            <WelcomeScreen onSend={handleSend} project={project} />
          </motion.div>
        ) : (
          <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col min-h-0">
            <ChatScreen messages={messages} onSend={handleSend} onReset={() => { setMessages([]); setShowSetup(true); setProject(null) }} project={project!} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
