/**
 * components/FlipBookClient.tsx — Thin wrapper around react-pageflip.
 *
 * Why a separate file?
 *  react-pageflip uses CommonJS `module.exports` which causes an
 *  ESM/CJS mismatch when Next.js tries to server-render it.  By
 *  placing the import in a file that is ONLY loaded via
 *  `dynamic({ ssr: false })` we guarantee it runs client-side only.
 *
 * Responsibilities:
 *  - Renders all pages inside <HTMLFlipBook> with cover mode.
 *  - Exposes imperative navigation methods (next, prev, goToPage)
 *    on the `window` object so the Toolbar can call them.
 *  - Handles keyboard shortcuts (Arrow keys, Space) for page flips.
 *  - Plays a page-turn sound (`/sounds/pturn.wav`) via the
 *    HTML5 Audio API on every flip.
 *  - Syncs the current page index back to the Zustand store
 *    via the `onFlip` callback.
 */

'use client'

import { useRef, useEffect } from 'react'
// Direct import — safe because this file is only ever loaded client-side
// via next/dynamic with { ssr: false }
// react-pageflip uses CJS module.exports = component, so default import only.
import HTMLFlipBook from 'react-pageflip'
import PageContent from './PageContent'
import { useStore } from '@/lib/store'

interface PageFlipAPI {
  flipNext: (corner?: string) => void
  flipPrev: (corner?: string) => void
  flip: (page: number, corner?: string) => void
  getCurrentPageIndex: () => number
  getPageCount: () => number
  getOrientation: () => string
  destroy: () => void
}

interface Props {
  /** Array of data-URL images for each PDF page */
  pages: string[]
  width: number
  height: number
  usePortrait: boolean
  onFlip: (pageIndex: number) => void
}

export default function FlipBookClient({
  pages,
  width,
  height,
  usePortrait,
  onFlip,
}: Props) {
  const setCurrentPage = useStore((s) => s.setCurrentPage)

  // react-pageflip exposes its API through a ref whose shape is
  // { pageFlip(): PageFlipAPI }
  const bookRef = useRef<{ pageFlip: () => PageFlipAPI }>(null)

  const goNext = () => {
    bookRef.current?.pageFlip().flipNext('bottom')
    playSound()
  }
  const goPrev = () => {
    bookRef.current?.pageFlip().flipPrev('bottom')
    playSound()
  }

  const goToPage = (page: number) => {
    bookRef.current?.pageFlip().flip(page, 'bottom')
    playSound()
  }

  // Expose to reader page toolbar
  useEffect(() => {
    ;(window as Window & { __flipNext?: () => void }).__flipNext = goNext
    ;(window as Window & { __flipPrev?: () => void }).__flipPrev = goPrev
    ;(window as Window & { __flipToPage?: (n: number) => void }).__flipToPage = goToPage
    return () => {
      delete (window as Window & { __flipNext?: () => void }).__flipNext
      delete (window as Window & { __flipPrev?: () => void }).__flipPrev
      delete (window as Window & { __flipToPage?: (n: number) => void }).__flipToPage
    }
  })

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'TEXTAREA' || tag === 'INPUT') return
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        goNext()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goPrev()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })

  const lastIndex = pages.length - 1

  return (
    <HTMLFlipBook
      ref={bookRef}
      width={width}
      height={height}
      size="fixed"
      minWidth={200}
      maxWidth={600}
      minHeight={300}
      maxHeight={860}
      showCover={true}
      mobileScrollSupport={false}
      drawShadow={true}
      flippingTime={700}
      usePortrait={usePortrait}
      maxShadowOpacity={0.5}
      showPageCorners={!usePortrait}
      autoSize={false}
      onFlip={(e: { data: number }) => {
        setCurrentPage(e.data)
        onFlip(e.data)
        playSound()
      }}
      style={{ margin: '0 auto' }}
    >
      {pages.map((imgSrc, i) => (
        <PageContent
          key={i}
          pageNumber={i + 1}
          imageSrc={imgSrc}
          isLeft={i % 2 === 0}
          isCover={i === 0 || i === lastIndex}
        />
      ))}
    </HTMLFlipBook>
  )
}

// ─── Page-turn sound ────────────────────────────────────────────
// We clone the audio element on each play so overlapping sounds
// are possible (fast flipping).  volume=0.3 keeps it subtle.
// `.play().catch(...)` silences browser autoplay-policy errors.

let audioEl: HTMLAudioElement | null = null

function playSound() {
  if (typeof window === 'undefined') return
  try {
    if (!audioEl) audioEl = new Audio('/sounds/pturn.wav')
    const clone = audioEl.cloneNode() as HTMLAudioElement
    clone.volume = 0.3
    clone.play().catch(() => { /* autoplay policy — not critical */ })
  } catch {
    // Audio creation can fail in restrictive environments — ignore
  }
}
