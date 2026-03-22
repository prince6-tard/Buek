/**
 * components/BookViewer.tsx — Responsive book container.
 *
 * This component:
 *  - Dynamically imports FlipBookClient (SSR: false) because
 *    react-pageflip requires the DOM.
 *  - Calculates page dimensions based on viewport size (mobile
 *    gets a single portrait page, desktop gets a two-page spread).
 *  - Renders an ambient glow behind the book that changes color
 *    depending on the current lighting mode.
 *  - Adds swipe gesture support (onTouchStart/End) so mobile
 *    users can flip pages with a finger swipe.
 *  - Shows a shimmer skeleton while the FlipBook chunk loads.
 */

'use client'

import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useStore } from '@/lib/store'

// ─── FlipBookClient loaded client-only ─────────────────────────
// This avoids the "module.exports = component" CJS/ESM mismatch that
// breaks react-pageflip when imported via dynamic() directly.
const FlipBookClient = dynamic(() => import('./FlipBookClient'), {
  ssr: false,
  loading: () => <BookSkeleton />,
})

/** Shown while the FlipBookClient JS chunk is loading. */
function BookSkeleton() {
  return (
    <div className="flex gap-1">
      <div className="shimmer-skeleton rounded-sm" style={{ width: 400, height: 580 }} />
      <div className="shimmer-skeleton rounded-sm hidden md:block" style={{ width: 400, height: 580 }} />
    </div>
  )
}

// ─── Error boundary ─────────────────────────────────────────────
// Catches runtime crashes inside react-pageflip so they don't
// unmount the entire reader. Shows a friendly fallback instead.

interface EBState { hasError: boolean }

class FlipBookErrorBoundary extends React.Component<
  { children: React.ReactNode },
  EBState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError(): EBState { return { hasError: true } }
  componentDidCatch(err: Error) { console.error('[Buek] FlipBook crashed:', err) }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center text-center gap-4 p-8">
          <p className="text-sm" style={{ fontFamily: '"Libre Baskerville", serif', color: '#F5E6C8' }}>
            Something went wrong rendering the book.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="text-xs px-4 py-2 rounded-lg"
            style={{ backgroundColor: 'rgba(245,166,35,0.15)', color: '#F5A623', border: '1px solid rgba(245,166,35,0.3)' }}
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// ─── Swipe hook ─────────────────────────────────────────────────
/** Detects horizontal swipes (> 50 px) and calls onNext or onPrev. */
function useSwipe(onNext: () => void, onPrev: () => void) {
  const startX = { current: null as number | null }

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (startX.current === null) return
    const diff = startX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) diff > 0 ? onNext() : onPrev()
    startX.current = null
  }
  return { onTouchStart, onTouchEnd }
}

// ─── BookViewer ─────────────────────────────────────────────────

export default function BookViewer() {
  const { parsedPages, lightingMode } = useStore()
  const [isMobile, setIsMobile] = useState(false)
  const [dimensions, setDimensions] = useState({ width: 460, height: 640 })

  // Responsive page sizing
  useEffect(() => {
    function update() {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) {
        const w = Math.min(window.innerWidth - 32, 380)
        setDimensions({ width: w, height: Math.round(w * 1.4) })
      } else {
        const pageH = Math.min(window.innerHeight - 160, 700)
        const pageW = Math.round(pageH * 0.65)
        setDimensions({ width: pageW, height: pageH })
      }
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const goNext = () =>
    (window as Window & { __flipNext?: () => void }).__flipNext?.()
  const goPrev = () =>
    (window as Window & { __flipPrev?: () => void }).__flipPrev?.()

  const swipe = useSwipe(goNext, goPrev)

  if (!parsedPages.length) return null

  const glowColor =
    lightingMode === 'candlelight' ? 'rgba(245,166,35,0.15)' :
    lightingMode === 'fireplace'   ? 'rgba(200,80,10,0.18)'  :
    lightingMode === 'moonlight'   ? 'rgba(120,130,200,0.12)' :
                                     'rgba(180,160,100,0.12)'

  return (
    <div
      className="flex items-center justify-center w-full h-full select-none"
      {...swipe}
      style={{ minHeight: 0 }}
    >
      {/* Ambient glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: isMobile ? dimensions.width + 60 : dimensions.width * 2 + 80,
          height: dimensions.height + 60,
          background: `radial-gradient(ellipse at center, ${glowColor} 0%, transparent 70%)`,
          filter: 'blur(24px)',
          zIndex: 0,
        }}
      />

      <div className="relative z-10">
        <FlipBookErrorBoundary>
          <FlipBookClient
            pages={parsedPages}
            width={dimensions.width}
            height={dimensions.height}
            usePortrait={isMobile}
            onFlip={() => {}}
          />
        </FlipBookErrorBoundary>
      </div>
    </div>
  )
}
