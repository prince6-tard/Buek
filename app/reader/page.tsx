/**
 * app/reader/page.tsx — The book-reading experience.
 *
 * Renders the parsed PDF inside a page-flipping book viewer with:
 *  - Ambient lighting overlay (candlelight, daylight, moonlight, fireplace).
 *  - Moonlight vignette radial gradient.
 *  - Focus-mode vignette overlay.
 *  - Floating Toolbar (prev/next, go-to-page, lighting, fullscreen,
 *    bookmarks, notes).
 *  - Bookmark drawer (right-side slide-in).
 *  - Notes / annotations drawer (right-side slide-in).
 *
 * Guards:
 *  - If `parsedPages` is empty (e.g. direct URL access to /reader
 *    without uploading a PDF), the user is redirected to /.
 *  - The body class is swapped to match the current lighting mode
 *    and restored to default on unmount.
 *  - Global keyboard shortcuts: F=focus, B=bookmarks, N=notes,
 *    Esc=close everything. (Arrow keys handled in FlipBookClient.)
 */

'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import { useStore } from '@/lib/store'
import Toolbar from '@/components/Toolbar'
import FocusMode from '@/components/FocusMode'
import BookmarkPanel from '@/components/BookmarkPanel'
import NotesSidebar from '@/components/NotesSidebar'
import AIChatPanel from '@/components/AIChatPanel'

// BookViewer is client-only (react-pageflip requires DOM)
const BookViewer = dynamic(() => import('@/components/BookViewer'), {
  ssr: false,
  loading: () => <ReaderSkeleton />,
})

// ─── Parchment skeleton while BookViewer loads ──────────────────
function ReaderSkeleton() {
  return (
    <div className="flex items-center justify-center gap-1 h-full w-full">
      <div
        className="shimmer-skeleton rounded-sm"
        style={{ width: 420, height: 600 }}
      />
      <div
        className="shimmer-skeleton rounded-sm hidden md:block"
        style={{ width: 420, height: 600 }}
      />
    </div>
  )
}

// ─── LightingFlickerOverlay ─────────────────────────────────────
function LightingFlickerOverlay() {
  const lightingMode = useStore((s) => s.lightingMode)
  if (lightingMode !== 'candlelight' && lightingMode !== 'fireplace') return null

  const color =
    lightingMode === 'fireplace'
      ? 'rgba(180,60,0,0.03)'
      : 'rgba(245,166,35,0.025)'

  return (
    <div
      className="fixed inset-0 pointer-events-none flicker-overlay"
      style={{ backgroundColor: color, zIndex: 2 }}
      aria-hidden="true"
    />
  )
}

// ─── Reader Page ────────────────────────────────────────────────

export default function ReaderPage() {
  const router = useRouter()
  const {
    parsedPages,
    lightingMode,
    toggleFocusMode,
    setBookmarkPanelOpen,
    bookmarkPanelOpen,
    setNotesPanelOpen,
    notesPanelOpen,
    aiChatPanelOpen,
    setAiChatPanelOpen,
    focusMode,
  } = useStore()

  // Register callbacks for Toolbar next/prev buttons
  // These are filled in by BookViewer via a shared ref pattern.
  // We use a simple approach: store functions on window (client only)
  const handleNext = useCallback(() => {
    if (typeof window !== 'undefined' && (window as Window & { __flipNext?: () => void }).__flipNext) {
      ; (window as Window & { __flipNext?: () => void }).__flipNext!()
    }
  }, [])

  const handlePrev = useCallback(() => {
    if (typeof window !== 'undefined' && (window as Window & { __flipPrev?: () => void }).__flipPrev) {
      ; (window as Window & { __flipPrev?: () => void }).__flipPrev!()
    }
  }, [])

  // Redirect to upload if no pages loaded (e.g. direct URL access)
  useEffect(() => {
    if (parsedPages.length === 0) {
      router.replace('/')
    }
  }, [parsedPages.length, router])

  // Apply body class for lighting mode
  useEffect(() => {
    document.body.className = `lighting-${lightingMode}`
    return () => {
      document.body.className = 'lighting-candlelight'
    }
  }, [lightingMode])

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'TEXTAREA' || tag === 'INPUT') return

      switch (e.key) {
        case 'f':
        case 'F':
          e.preventDefault()
          toggleFocusMode()
          break
        case 'b':
        case 'B':
          e.preventDefault()
          setBookmarkPanelOpen(!bookmarkPanelOpen)
          break
        case 'n':
        case 'N':
          e.preventDefault()
          setNotesPanelOpen(!notesPanelOpen)
          break
        case 'Escape':
          setBookmarkPanelOpen(false)
          setNotesPanelOpen(false)
          setAiChatPanelOpen(false)
          if (focusMode) toggleFocusMode()
          break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [
    toggleFocusMode,
    setBookmarkPanelOpen,
    setNotesPanelOpen,
    bookmarkPanelOpen,
    notesPanelOpen,
    aiChatPanelOpen,
    setAiChatPanelOpen,
    focusMode,
  ])

  if (parsedPages.length === 0) return null

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{ transition: 'background-color 0.8s ease' }}
    >
      {/* Lighting ambient vignette */}
      <LightingFlickerOverlay />

      {/* Moonlight vignette */}
      {lightingMode === 'moonlight' && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 30%, rgba(10,10,30,0.6) 100%)',
            zIndex: 2,
          }}
          aria-hidden="true"
        />
      )}

      {/* Book area */}
      <div className="flex-1 flex items-center justify-center overflow-hidden relative z-10">
        <BookViewer />
      </div>

      {/* Focus mode vignette */}
      <AnimatePresence>
        <FocusMode />
      </AnimatePresence>

      {/* Toolbar */}
      <Toolbar onNext={handleNext} onPrev={handlePrev} />

      {/* Bookmark drawer */}
      <BookmarkPanel />

      {/* Notes drawer */}
      <NotesSidebar />

      {/* AI Chat drawer */}
      <AIChatPanel />
    </div>
  )
}
