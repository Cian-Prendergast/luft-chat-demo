import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ISDDashboard from './ISDDashboard'
import ISDChat from './ISDChat'

export default function App() {
  const [dashboardOpen, setDashboardOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-[#f3f3f6]">

      {/* Chat — always the main view */}
      <div className="flex-1 overflow-hidden min-w-0">
        <ISDChat />
      </div>

      {/* Collapsible dashboard panel on the right */}
      <AnimatePresence>
        {dashboardOpen && (
          <motion.div
            key="dashboard-panel"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 520, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 35 }}
            className="shrink-0 border-l border-gray-200 shadow-xl overflow-y-auto bg-gray-50"
            style={{ height: '100vh' }}
          >
            <ISDDashboard />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button for the reference dashboard */}
      <motion.button
        onClick={() => setDashboardOpen((v) => !v)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-[#1a2044] text-white rounded-full shadow-lg font-medium text-sm"
      >
        {dashboardOpen ? (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Hide Framework
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            ISD Framework
          </>
        )}
      </motion.button>

    </div>
  )
}
