/**
 * components/Toolbar.tsx — Floating pill toolbar for the reader.
 *
 * Always visible at the bottom-center of the viewport (hidden in
 * focus mode).  Contains, left to right:
 *
 *  [Home] | [Prev] [PageIndicator] [Next] | [Lighting] [Focus]
 *         [Fullscreen] | [Bookmarks] [Notes]
 *
 * Sub-components defined in this file:
 *  - `ToolbarButton`   — Reusable icon button with hover/active state.
 *  - `PageIndicator`   — Shows current page / total with SVG progress ring.
 *  - `GoToPagePopover` — Number input that jumps to a specific page.
 *
 * The Toolbar does NOT own the page-flip logic.  It calls `onNext`
 * and `onPrev` callbacks received from the reader page, which
 * ultimately invoke imperative methods on the FlipBookClient via
 * functions stored on `window`.
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/lib/store'
import { useRouter } from 'next/navigation'
import LightingPanel from './LightingPanel'

// ─── ToolbarButton — reusable icon button with hover/active state ───

interface ToolbarButtonProps {
  onClick: () => void
  active?: boolean
  title: string
  children: React.ReactNode
}

function ToolbarButton({ onClick, active, title, children }: ToolbarButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      title={title}
      className="relative flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200"
      style={{
        backgroundColor: active ? 'rgba(245,166,35,0.15)' : 'transparent',
        color: active ? '#F5A623' : 'rgba(245,230,200,0.6)',
      }}
    >
      {children}
      {active && (
        <motion.div
          layoutId="toolbar-active"
          className="absolute -bottom-0.5 w-4 h-0.5 rounded-full"
          style={{ backgroundColor: '#F5A623' }}
        />
      )}
    </motion.button>
  )
}

// ─── Compact page counter with progress ─────────────────────────

function PageIndicator() {
  const { currentPage, totalPages } = useStore()
  const progress = totalPages > 0 ? ((currentPage + 1) / totalPages) * 100 : 0

  return (
    <div className="flex items-center gap-2 px-2">
      {/* Mini progress ring */}
      <svg viewBox="0 0 20 20" className="w-5 h-5 -rotate-90">
        <circle cx="10" cy="10" r="8" fill="none" stroke="rgba(245,230,200,0.08)" strokeWidth="2" />
        <circle
          cx="10" cy="10" r="8" fill="none" stroke="#F5A623" strokeWidth="2"
          strokeDasharray={`${(progress / 100) * 50.27} 50.27`}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <span
        className="text-xs tabular-nums"
        style={{ fontFamily: '"Libre Baskerville", serif', color: 'rgba(245,230,200,0.6)' }}
      >
        {currentPage + 1}
        <span className="opacity-30 mx-0.5">/</span>
        {totalPages}
      </span>
    </div>
  )
}

// ─── Go-to-page popover ─────────────────────────────────────────

function GoToPagePopover({ onClose }: { onClose: () => void }) {
  const { totalPages } = useStore()
  const inputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState('')

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleGo = () => {
    const num = parseInt(value, 10)
    if (num >= 1 && num <= totalPages) {
      useStore.getState().setCurrentPage(num - 1)
      // Try to flip to that page via the pageflip API
      if (typeof window !== 'undefined') {
        const w = window as Window & { __flipToPage?: (n: number) => void }
        w.__flipToPage?.(num - 1)
      }
      onClose()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      className="absolute bottom-14 left-1/2 rounded-xl shadow-2xl p-3 flex items-center gap-2"
      style={{
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(44,24,16,0.95)',
        border: '1px solid rgba(245,230,200,0.12)',
        backdropFilter: 'blur(16px)',
      }}
    >
      <input
        ref={inputRef}
        type="number"
        min={1}
        max={totalPages}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleGo(); if (e.key === 'Escape') onClose() }}
        placeholder={`1–${totalPages}`}
        className="w-20 text-xs text-center px-2 py-1.5 rounded-lg outline-none"
        style={{
          fontFamily: '"Libre Baskerville", serif',
          backgroundColor: 'rgba(245,230,200,0.06)',
          color: '#F5E6C8',
          border: '1px solid rgba(245,230,200,0.1)',
        }}
      />
      <button
        onClick={handleGo}
        className="text-xs px-3 py-1.5 rounded-lg"
        style={{
          fontFamily: '"Libre Baskerville", serif',
          backgroundColor: 'rgba(245,166,35,0.15)',
          color: '#F5A623',
          border: '1px solid rgba(245,166,35,0.2)',
        }}
      >
        Go
      </button>
    </motion.div>
  )
}

// ─── Toolbar ────────────────────────────────────────────────────

export default function Toolbar({
  onNext,
  onPrev,
}: {
  onNext: () => void
  onPrev: () => void
}) {
  const router = useRouter()
  const {
    focusMode,
    toggleFocusMode,
    bookmarkPanelOpen,
    setBookmarkPanelOpen,
    notesPanelOpen,
    setNotesPanelOpen,
    aiChatPanelOpen,
    setAiChatPanelOpen,
    bookTitle,
    parsedText,
    currentPage,
  } = useStore()

  const [lightingOpen, setLightingOpen] = useState(false)
  const [goToOpen, setGoToOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopyText = async () => {
    if (!parsedText || !parsedText[currentPage]) return
    try {
      await navigator.clipboard.writeText(parsedText[currentPage])
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text', err)
    }
  }

  // Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen?.()
      setIsFullscreen(false)
    }
  }

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  if (focusMode) return null

  return (
    <div className="fixed bottom-5 left-1/2 z-50" style={{ transform: 'translateX(-50%)' }}>
      <AnimatePresence>
        {lightingOpen && <LightingPanel onClose={() => setLightingOpen(false)} />}
        {goToOpen && <GoToPagePopover onClose={() => setGoToOpen(false)} />}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-0.5 px-2 py-1.5 rounded-2xl"
        style={{
          backgroundColor: 'rgba(44,24,16,0.88)',
          backdropFilter: 'blur(16px) saturate(1.4)',
          border: '1px solid rgba(245,230,200,0.12)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}
      >
        {/* Home */}
        <ToolbarButton onClick={() => router.push('/')} title="Back to home">
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
            <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </ToolbarButton>

        {/* Divider */}
        <div className="w-px h-5 mx-1" style={{ backgroundColor: 'rgba(245,230,200,0.06)' }} />

        {/* Previous */}
        <ToolbarButton onClick={onPrev} title="Previous page (←)">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </ToolbarButton>

        {/* Page indicator — click to go-to-page */}
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setGoToOpen((v) => !v)}
          title="Go to page"
          className="px-1 rounded-lg transition-colors"
          style={{ backgroundColor: goToOpen ? 'rgba(245,166,35,0.1)' : 'transparent' }}
        >
          <PageIndicator />
        </motion.button>

        {/* Next */}
        <ToolbarButton onClick={onNext} title="Next page (→)">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none">
            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </ToolbarButton>

        {/* Divider */}
        <div className="w-px h-5 mx-1" style={{ backgroundColor: 'rgba(245,230,200,0.06)' }} />

        {/* Lighting */}
        <ToolbarButton
          onClick={() => { setLightingOpen((v) => !v); setGoToOpen(false) }}
          active={lightingOpen}
          title="Lighting mode"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
            <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </ToolbarButton>

        {/* Focus mode */}
        <ToolbarButton
          onClick={toggleFocusMode}
          active={focusMode}
          title="Focus mode (F)"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M3 9V6a1 1 0 011-1h3M15 5h3a1 1 0 011 1v3M21 15v3a1 1 0 01-1 1h-3M9 19H6a1 1 0 01-1-1v-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </ToolbarButton>

        {/* Fullscreen */}
        <ToolbarButton
          onClick={toggleFullscreen}
          active={isFullscreen}
          title="Fullscreen"
        >
          {isFullscreen ? (
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
              <path d="M8 3v3a2 2 0 01-2 2H3M21 8h-3a2 2 0 01-2-2V3M3 16h3a2 2 0 012 2v3M16 21v-3a2 2 0 012-2h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
              <path d="M8 3H5a2 2 0 00-2 2v3M21 8V5a2 2 0 00-2-2h-3M3 16v3a2 2 0 002 2h3M16 21h3a2 2 0 002-2v-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </ToolbarButton>

        {/* Divider */}
        <div className="w-px h-5 mx-1" style={{ backgroundColor: 'rgba(245,230,200,0.06)' }} />

        {/* Copy Text */}
        <ToolbarButton
          onClick={handleCopyText}
          active={copied}
          title={copied ? "Copied!" : "Copy Page Text"}
        >
          {copied ? (
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
              <rect x="9" y="9" width="11" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="1.5" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </ToolbarButton>

        {/* Divider */}
        <div className="w-px h-5 mx-1" style={{ backgroundColor: 'rgba(245,230,200,0.06)' }} />

        {/* Bookmarks */}
        <ToolbarButton
          onClick={() => {
            setBookmarkPanelOpen(!bookmarkPanelOpen)
            if (notesPanelOpen) setNotesPanelOpen(false)
            if (aiChatPanelOpen) setAiChatPanelOpen(false)
          }}
          active={bookmarkPanelOpen}
          title="Bookmarks (B)"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
            <path d="M5 3h14v18l-7-4-7 4V3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill={bookmarkPanelOpen ? 'rgba(245,166,35,0.25)' : 'none'} />
          </svg>
        </ToolbarButton>

        {/* Notes */}
        <ToolbarButton
          onClick={() => {
            setNotesPanelOpen(!notesPanelOpen)
            if (bookmarkPanelOpen) setBookmarkPanelOpen(false)
            if (aiChatPanelOpen) setAiChatPanelOpen(false)
          }}
          active={notesPanelOpen}
          title="Annotations (N)"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
            <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </ToolbarButton>

        {/* AI Chat */}
        <ToolbarButton
          onClick={() => {
            setAiChatPanelOpen(!aiChatPanelOpen)
            if (bookmarkPanelOpen) setBookmarkPanelOpen(false)
            if (notesPanelOpen) setNotesPanelOpen(false)
          }}
          active={aiChatPanelOpen}
          title="AI Assistant"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
            <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a2.25 2.25 0 00-1.556-1.556L15.15 6.9l1.035-.259a2.25 2.25 0 001.556-1.556L18 4.05l.259 1.035a2.25 2.25 0 001.556 1.556L20.85 6.9l-1.035.259a2.25 2.25 0 00-1.556 1.556z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill={aiChatPanelOpen ? 'rgba(245,166,35,0.25)' : 'none'} />
          </svg>
        </ToolbarButton>
      </motion.div>

      {/* Book title — shown subtly above the toolbar */}
      {bookTitle && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="absolute -top-7 left-1/2 whitespace-nowrap"
          style={{ transform: 'translateX(-50%)' }}
        >
          <span
            className="text-[10px] tracking-wide"
            style={{ fontFamily: '"IM Fell English", serif', color: 'rgba(245,230,200,0.15)' }}
          >
            {bookTitle.length > 40 ? bookTitle.slice(0, 40) + '…' : bookTitle}
          </span>
        </motion.div>
      )}
    </div>
  )
}
