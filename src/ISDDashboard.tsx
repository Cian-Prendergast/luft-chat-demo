import { useState } from 'react'
import { motion } from 'framer-motion'

// ── Types ──────────────────────────────────────────────────────────────────────

type Role =
  | 'Service Designer' | 'CX Writer' | 'Product Owner' | 'Developer' | 'Researcher'
  | 'UX Designer' | 'UI Designer' | 'UX Writer' | 'User Researcher' | 'Conversational Designer'

type PhaseId =
  | 'Empathize'
  | 'Define'
  | 'Ideate'
  | 'Prototype'
  | 'Implement'
  | 'Measure'
  | 'Listen'

interface Task {
  id: string
  label: string
  roles: Role[]
}

interface Phase {
  id: PhaseId
  color: string
  textColor: string
  tasks: Task[]
}

// ── Data ───────────────────────────────────────────────────────────────────────

const PHASES: Phase[] = [
  {
    id: 'Empathize',
    color: '#f0e6ff',
    textColor: '#5b21b6',
    tasks: [
      { id: 'e1', label: 'Conduct user interviews', roles: ['Service Designer', 'Researcher'] },
      { id: 'e2', label: 'Map customer journeys', roles: ['Service Designer', 'CX Writer'] },
      { id: 'e3', label: 'Shadow sessions & observations', roles: ['Researcher'] },
    ],
  },
  {
    id: 'Define',
    color: '#e0f2fe',
    textColor: '#0c4a6e',
    tasks: [
      { id: 'd1', label: 'Synthesise research findings', roles: ['Service Designer', 'Researcher'] },
      { id: 'd2', label: 'Draft problem statement', roles: ['CX Writer', 'Service Designer'] },
      { id: 'd3', label: 'Align on success metrics', roles: ['Product Owner', 'Service Designer'] },
    ],
  },
  {
    id: 'Ideate',
    color: '#fef9c3',
    textColor: '#713f12',
    tasks: [
      { id: 'i1', label: 'Run ideation workshops', roles: ['Service Designer'] },
      { id: 'i2', label: 'Concept sketching & voting', roles: ['Service Designer', 'CX Writer'] },
      { id: 'i3', label: 'Prioritise concepts (ICE score)', roles: ['Product Owner'] },
    ],
  },
  {
    id: 'Prototype',
    color: '#fce7f3',
    textColor: '#831843',
    tasks: [
      { id: 'p1', label: 'Build low-fi wireframes', roles: ['Service Designer'] },
      { id: 'p2', label: 'Write microcopy & tooltips', roles: ['CX Writer'] },
      { id: 'p3', label: 'Interactive prototype in Figma', roles: ['Service Designer', 'Developer'] },
    ],
  },
  {
    id: 'Implement',
    color: '#dcfce7',
    textColor: '#14532d',
    tasks: [
      { id: 'im1', label: 'Handoff specs to engineering', roles: ['Service Designer', 'Product Owner'] },
      { id: 'im2', label: 'Content production & QA', roles: ['CX Writer'] },
      { id: 'im3', label: 'Build & unit-test components', roles: ['Developer'] },
    ],
  },
  {
    id: 'Measure',
    color: '#ffedd5',
    textColor: '#7c2d12',
    tasks: [
      { id: 'm1', label: 'Define KPI dashboard', roles: ['Product Owner', 'Researcher'] },
      { id: 'm2', label: 'Run usability benchmark', roles: ['Researcher', 'Service Designer'] },
      { id: 'm3', label: 'Report insights & recommendations', roles: ['CX Writer', 'Researcher'] },
    ],
  },
  {
    id: 'Listen',
    color: '#e0e7ff',
    textColor: '#1e1b4b',
    tasks: [
      { id: 'l1', label: 'Collect ongoing feedback', roles: ['Service Designer', 'CX Writer'] },
      { id: 'l2', label: 'Monitor NPS / CSAT trends', roles: ['Researcher', 'Product Owner'] },
      { id: 'l3', label: 'Feed insights into next cycle', roles: ['Service Designer'] },
    ],
  },
]

const ALL_ROLES: Role[] = [
  'Service Designer', 'CX Writer', 'Product Owner', 'Developer', 'Researcher',
  'UX Designer', 'UI Designer', 'UX Writer', 'User Researcher', 'Conversational Designer',
]

// ── Sub-components ─────────────────────────────────────────────────────────────

function RoleTag({ role }: { role: Role }) {
  const palette: Record<Role, string> = {
    'Service Designer':        'bg-purple-100 text-purple-800',
    'CX Writer':               'bg-pink-100 text-pink-800',
    'Product Owner':           'bg-blue-100 text-blue-800',
    'Developer':               'bg-green-100 text-green-800',
    'Researcher':              'bg-amber-100 text-amber-800',
    'UX Designer':             'bg-violet-100 text-violet-800',
    'UI Designer':             'bg-fuchsia-100 text-fuchsia-800',
    'UX Writer':               'bg-rose-100 text-rose-800',
    'User Researcher':         'bg-orange-100 text-orange-800',
    'Conversational Designer': 'bg-teal-100 text-teal-800',
  }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${palette[role]}`}>
      {role}
    </span>
  )
}

function TaskCard({ task }: { task: Task }) {
  return (
    <div className="bg-white rounded-lg px-3 py-2 shadow-sm border border-gray-100 flex flex-col gap-1">
      <p className="text-sm text-gray-700 font-medium leading-snug">{task.label}</p>
      <div className="flex flex-wrap gap-1">
        {task.roles.map((r) => <RoleTag key={r} role={r} />)}
      </div>
    </div>
  )
}

function PhaseCard({ phase, activeRole }: { phase: Phase; activeRole: Role | null }) {
  const visibleTasks = activeRole
    ? phase.tasks.filter((t) => t.roles.includes(activeRole))
    : phase.tasks

  if (activeRole && visibleTasks.length === 0) return null

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden shadow-md flex flex-col"
      style={{ backgroundColor: phase.color }}
    >
      {/* Phase header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: phase.textColor }}>
          {phase.id}
        </h2>
        <span className="text-xs font-medium opacity-60" style={{ color: phase.textColor }}>
          {visibleTasks.length} task{visibleTasks.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Tasks */}
      <div className="px-3 pb-3 flex flex-col gap-2 flex-1">
        {visibleTasks.map((t) => <TaskCard key={t.id} task={t} />)}
      </div>

      {/* Coach CTA */}
      <div className="px-3 pb-3">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="w-full py-2 text-xs font-semibold rounded-lg transition-colors"
          style={{
            backgroundColor: phase.textColor,
            color: phase.color,
          }}
        >
          Suggest next step →
        </motion.button>
      </div>
    </motion.div>
  )
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────

export default function ISDDashboard() {
  const [activeRole, setActiveRole] = useState<Role | null>(null)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <header className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          ISD Framework Dashboard
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Integrated Service Design — 7-phase overview
        </p>
      </header>

      {/* Role filter */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveRole(null)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            activeRole === null
              ? 'bg-gray-800 text-white border-gray-800'
              : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'
          }`}
        >
          All roles
        </motion.button>
        {ALL_ROLES.map((role) => (
          <motion.button
            key={role}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveRole(activeRole === role ? null : role)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              activeRole === role
                ? 'bg-gray-800 text-white border-gray-800'
                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'
            }`}
          >
            {role}
          </motion.button>
        ))}
      </div>

      {/* Phase grid */}
      <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-7xl mx-auto">
        {PHASES.map((phase) => (
          <PhaseCard key={phase.id} phase={phase} activeRole={activeRole} />
        ))}
      </motion.div>
    </div>
  )
}
