/**
 * components/FocusMode.tsx — Distraction-free reading overlay.
 *
 * When active, renders a full-screen radial-gradient vignette that
 * darkens the edges of the viewport, drawing attention to the book.
 * The user can exit by:
 *  - Clicking anywhere on the overlay.
 *  - Pressing the [F] or [Escape] key (handled in reader/page.tsx).
 *
 * A subtle "exit hint" fades in after 1.5 s so first-time users
 * know how to leave focus mode.
 */

'use client'

import { motion } from 'framer-motion'
import { useStore } from '@/lib/store'

export default function FocusMode() {
  const { focusMode, toggleFocusMode } = useStore()

  if (!focusMode) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="focus-vignette fixed inset-0"
      style={{ zIndex: 30, cursor: 'pointer' }}
      onClick={toggleFocusMode}
      aria-label="Exit focus mode"
    >
      {/* Exit hint — fades in after a moment */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        className="absolute top-6 left-1/2 flex items-center gap-2 px-4 py-2 rounded-full"
        style={{
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" style={{ color: 'rgba(255,255,255,0.6)' }}>
          <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span
          className="text-xs"
          style={{ color: 'rgba(255,255,255,0.5)', fontFamily: '"Libre Baskerville", serif' }}
        >
          Click or press Esc to exit focus
        </span>
      </motion.div>
    </motion.div>
  )
}
