/**
 * components/LightingPanel.tsx — Ambient lighting mode picker.
 *
 * Appears as a floating popover above the Toolbar when the user
 * clicks the sun icon.  Offers four modes:
 *
 *  | Mode        | Body bg   | Vibe                  |
 *  |-------------|-----------|------------------------|
 *  | Candlelight | #2C1810   | Warm amber glow        |
 *  | Daylight    | #6B5B4B   | Clear natural light    |
 *  | Moonlight   | #1a1a2e   | Cool blue-grey tones   |
 *  | Fireplace   | #1C0A00   | Deep warm embers       |
 *
 * Selecting a mode:
 *  1. Updates the Zustand store (`setLightingMode`).
 *  2. Swaps the <body> class so globals.css background kicks in.
 *  3. Closes the popover.
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/lib/store'

// ─── Mode definitions ─────────────────────────────────────────────────

const MODES = [
  {
    key: 'candlelight' as const,
    label: 'Candlelight',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
        <path
          d="M12 2 C11 5, 9 6, 9 9 C9 11.2 10.3 13 12 13 C13.7 13 15 11.2 15 9 C15 6 13 5 12 2Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <rect x="10" y="13" width="4" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <line x1="8" y1="22" x2="16" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="6" y1="20" x2="18" y2="20" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      </svg>
    ),
    bodyBg: '#2C1810',
    pageBg: '#F5E6C8',
    description: 'Warm amber glow',
  },
  {
    key: 'daylight' as const,
    label: 'Daylight',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <line
            key={deg}
            x1={12 + 6.5 * Math.cos((deg * Math.PI) / 180)}
            y1={12 + 6.5 * Math.sin((deg * Math.PI) / 180)}
            x2={12 + 9 * Math.cos((deg * Math.PI) / 180)}
            y2={12 + 9 * Math.sin((deg * Math.PI) / 180)}
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        ))}
      </svg>
    ),
    bodyBg: '#8B7355',
    pageBg: '#FDFAF3',
    description: 'Clear, natural light',
  },
  {
    key: 'moonlight' as const,
    label: 'Moonlight',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
        <path
          d="M20 13.5 A8 8 0 1 1 10.5 4 A6 6 0 0 0 20 13.5 Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    ),
    bodyBg: '#1a1a2e',
    pageBg: '#E8EAF0',
    description: 'Cool, blue-grey tones',
  },
  {
    key: 'fireplace' as const,
    label: 'Fireplace',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
        <path
          d="M12 3 C10 6 8 7 8 10 C8 12 9 13 10 13 C9 11 10 9 12 8 C11 11 13 13 13 16 C15 15 16 13 16 11 C16 8 14 6 12 3Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M7 21 H17 M6 19 H18"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path d="M8 19 C8 16 10 14 12 14 C14 14 16 16 16 19" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
    bodyBg: '#1C0A00',
    pageBg: '#F5E6C8',
    description: 'Deep, warm embers',
  },
]

// ─── LightingPanel ──────────────────────────────────────────────

export default function LightingPanel({ onClose }: { onClose: () => void }) {
  const { lightingMode, setLightingMode } = useStore()

  const handleModeSelect = (key: typeof MODES[0]['key']) => {
    setLightingMode(key)
    // Apply body class for global background
    document.body.className = `lighting-${key}${key === 'candlelight' ? ' flicker-overlay' : ''}`
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="absolute bottom-14 left-1/2 rounded-xl shadow-2xl overflow-hidden"
      style={{
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(44,24,16,0.96)',
        border: '1px solid rgba(245,230,200,0.15)',
        width: 280,
        zIndex: 100,
        backdropFilter: 'blur(16px)',
      }}
    >
      <div className="p-2.5 border-b" style={{ borderColor: 'rgba(245,230,200,0.06)' }}>
        <p
          className="text-xs text-center tracking-wide"
          style={{ fontFamily: '"Libre Baskerville", serif', color: 'rgba(245,230,200,0.5)' }}
        >
          Ambiance
        </p>
      </div>

      <div className="grid grid-cols-2 gap-1.5 p-2.5">
        {MODES.map((mode) => {
          const isActive = lightingMode === mode.key
          return (
            <motion.button
              key={mode.key}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleModeSelect(mode.key)}
              className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg transition-all"
              style={{
                backgroundColor: isActive
                  ? 'rgba(245,166,35,0.12)'
                  : 'rgba(245,230,200,0.03)',
                border: `1px solid ${isActive ? 'rgba(245,166,35,0.3)' : 'rgba(245,230,200,0.06)'}`,
                color: isActive ? '#F5A623' : 'rgba(245,230,200,0.6)',
              }}
            >
              <div className={isActive && (mode.key === 'candlelight' || mode.key === 'fireplace') ? 'animate-pulse' : ''}>
                {mode.icon}
              </div>
              <span
                className="text-[11px] font-normal"
                style={{ fontFamily: '"Libre Baskerville", serif' }}
              >
                {mode.label}
              </span>
            </motion.button>
          )
        })}
      </div>
    </motion.div>
  )
}

export { MODES }
