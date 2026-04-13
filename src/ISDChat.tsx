import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ── Types ──────────────────────────────────────────────────────────────────────

interface Message {
  id: string
  role: 'user' | 'assistant'
  text: string
}

// ── Quick prompts ──────────────────────────────────────────────────────────────

const QUICK_PROMPTS = [
  { icon: '🟥', label: 'Am I ready to move to the ideation phase?' },
  { icon: '⚠️', label: 'What are the risks if I skip the Empathize step?' },
  { icon: '✅', label: 'What does a UX Writer deliver in this step?' },
]

// ── Sub-components ─────────────────────────────────────────────────────────────

function TopBar() {
  return (
    <header className="flex items-center justify-between px-8 py-5">
      {/* Logo */}
      <div className="border-2 border-[#1a2044] rounded px-3 py-1.5 leading-tight">
        <p className="text-[10px] font-bold tracking-widest text-[#1a2044] uppercase">Lufthansa Group</p>
        <p className="text-[10px] font-bold tracking-widest text-[#1a2044] uppercase">Digital Hangar</p>
      </div>
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-gray-300" />
    </header>
  )
}

function WelcomeScreen({
  onSend,
}: {
  onSend: (text: string) => void
}) {
  const [input, setInput] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const submit = (text: string) => {
    const t = text.trim()
    if (t) onSend(t)
    setInput('')
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 pb-16">
      {/* Heading */}
      <h1 className="text-3xl font-bold text-[#1a2044] text-center mb-3">
        Hi Sebastian! 👋 I am your DX Coach.
      </h1>

      {/* Subtitle */}
      <p className="text-gray-500 text-center max-w-2xl text-base leading-relaxed mb-4">
        I'm here to guide you through the Infused Service Design (ISD) methodology. I am here to help
        you navigate project phases, understand process guardrails, and clarify exactly what is
        expected of your specific role at any step.
      </p>

      {/* Disclaimer */}
      <p className="text-gray-400 text-xs text-center max-w-xl mb-10 leading-relaxed">
        Disclaimer: I am a PoC currently trained strictly on the core ISD Framework. I am here to provide
        guidance, but final judgment always rests with you and your Chapter Lead.
      </p>

      {/* Prompt label */}
      <p className="font-bold text-[#1a2044] text-lg mb-4">Tell me about your current project:</p>

      {/* Combined input card */}
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit(input)}
          placeholder="Send a message"
          className="w-full px-5 py-4 text-sm text-gray-700 placeholder-gray-400 outline-none"
        />
        <div className="border-t border-gray-200">
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-5 py-3 text-sm text-gray-400 hover:text-gray-600 transition-colors w-full"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            Upload File
          </button>
          <input ref={fileRef} type="file" className="hidden" />
        </div>
      </div>

      {/* Chips */}
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

function ChatScreen({
  messages,
  onSend,
  onReset,
}: {
  messages: Message[]
  onSend: (text: string) => void
  onReset: () => void
}) {
  const [input, setInput] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

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
                className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
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
            placeholder="Send a message"
            className="w-full px-5 py-4 text-sm text-gray-700 placeholder-gray-400 outline-none"
          />
          <div className="border-t border-gray-200 flex items-center justify-between px-4 py-2">
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              Upload File
            </button>
            <div className="flex items-center gap-2">
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
          <input ref={fileRef} type="file" className="hidden" />
        </div>
      </div>
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────────

// In dev, Vite proxies /chat → localhost:3001. In production, same origin.
const API_URL = import.meta.env.DEV ? 'http://localhost:3001' : ''

export default function ISDChat() {
  const [messages, setMessages] = useState<Message[]>([])

  const handleSend = async (text: string) => {
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text }
    setMessages((prev) => [...prev, userMsg])

    // Placeholder assistant message that we'll stream into
    const assistantId = (Date.now() + 1).toString()
    setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', text: '' }])

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
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
            const { text: token } = JSON.parse(data)
            if (token) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, text: m.text + token } : m
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

  const handleReset = () => setMessages([])

  return (
    <div className="flex flex-col h-full bg-[#f3f3f6]">
      <TopBar />
      {messages.length === 0 ? (
        <WelcomeScreen onSend={handleSend} />
      ) : (
        <ChatScreen messages={messages} onSend={handleSend} onReset={handleReset} />
      )}
    </div>
  )
}
