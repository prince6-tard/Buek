/**
 * app/page.tsx — Landing page for Buek.
 *
 * This is the entry point users see at `/`.  It contains:
 *
 *  1. **Hero section** — Headline, description, drag-and-drop upload
 *     zone, and a file-picker button.
 *  2. **Demo books** — Three pre-loaded PDFs from /public/books/ so
 *     visitors can try the reader without uploading their own file.
 *  3. **Features grid** — Six cards describing app capabilities.
 *  4. **How It Works** — Three-step guide.
 *  5. **Footer**.
 *
 * Upload flow:
 *  - User drops/selects a PDF (or clicks a demo book card).
 *  - `processFile()` calls `parsePdf()` which renders every page
 *    to a JPEG data-URL via the CDN-loaded pdfjs library.
 *  - Progress is shown in a fullscreen `LoadingOverlay`.
 *  - On success, pages are stored in Zustand and the router
 *    navigates to `/reader`.
 *
 * Stability guards:
 *  - File type validated before parsing starts.
 *  - All async errors caught and surfaced in an animated banner.
 *  - Demo book fetch failures show a clear error message.
 *  - Body scroll is enabled on mount and disabled on unmount
 *    so the reader page stays non-scrollable.
*/

'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { parsePdf } from '@/lib/pdfParser'
import { useStore } from '@/lib/store'
//─── Loading Overlay  ───────────────────────────────────────────
function LoadingOverlay({ progress }: { progress: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ backgroundColor: 'rgba(44,24,16,0.95)', backdropFilter: 'blur(12px)' }}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="flex flex-col items-center gap-6"
      >
        {/* Spinning book */}
        <motion.div
          animate={{ rotateY: [0, 180, 360] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ perspective: 200 }}
        >
          <svg viewBox="0 0 48 48" className="w-14 h-14" fill="none" style={{ color: '#F5A623' }}>
            <path d="M8 6h24a2 2 0 012 2v32a2 2 0 01-2 2H8V6z" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 6h-2a2 2 0 00-2 2v32a2 2 0 002 2h2" stroke="currentColor" strokeWidth="1.5" />
            <line x1="14" y1="14" x2="28" y2="14" stroke="currentColor" strokeWidth="1" opacity="0.5" />
            <line x1="14" y1="20" x2="28" y2="20" stroke="currentColor" strokeWidth="1" opacity="0.5" />
            <line x1="14" y1="26" x2="22" y2="26" stroke="currentColor" strokeWidth="1" opacity="0.5" />
          </svg>
        </motion.div>

        <div className="text-center space-y-2">
          <p className="text-lg" style={{ fontFamily: '"IM Fell English", serif', color: '#F5E6C8' }}>
            Preparing your book...
          </p>
          <p className="text-xs" style={{ fontFamily: '"Libre Baskerville", serif', color: 'rgba(245,230,200,0.4)' }}>
            Rendering pages with original quality
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-64">
          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(245,230,200,0.1)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #F5A623, #E8923A)' }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: 'easeInOut', duration: 0.3 }}
            />
          </div>
          <p className="text-center text-xs mt-2 tabular-nums" style={{ fontFamily: '"Libre Baskerville", serif', color: 'rgba(245,230,200,0.3)' }}>
            {progress}%
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Landing Page ──────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const { setParsedPages, setTotalPages, setBookTitle, setBookId, setParsedText } = useStore()

  // Enable body scrolling on the landing page
  useEffect(() => {
    document.body.classList.add('landing-page')
    document.body.classList.remove('lighting-candlelight')
    return () => {
      document.body.classList.remove('landing-page')
    }
  }, [])

  const processFile = useCallback(
    async (file: File) => {
      // Guard: file type
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setError('Please upload a valid PDF file.')
        return
      }

      // Guard: empty / suspiciously small file (< 100 bytes is not a real PDF)
      if (file.size < 100) {
        setError('This file appears to be empty or corrupted.')
        return
      }

      // Guard: very large files (> 200 MB) — warn but don't block
      if (file.size > 200 * 1024 * 1024) {
        console.warn('[Buek] Large PDF detected (%d MB). This may be slow.', Math.round(file.size / 1024 / 1024))
      }

      setError(null)
      setIsLoading(true)
      setLoadingProgress(0)

      try {
        const result = await parsePdf(file, (pct) => {
          setLoadingProgress(pct)
        })

        // Guard: parser returned 0 pages
        if (!result.pages.length) {
          throw new Error('This PDF has no renderable pages.')
        }

        setParsedPages(result.pages)
        setParsedText(result.text || [])
        setTotalPages(result.totalPages)
        setBookTitle(result.title)
        setBookId(crypto.randomUUID())

        router.push('/reader')
      } catch (err) {
        setIsLoading(false)
        setLoadingProgress(0)
        setError(err instanceof Error ? err.message : 'Failed to parse PDF. Please try another file.')
      }
    },
    [router, setParsedPages, setParsedText, setTotalPages, setBookTitle, setBookId]
  )

  const handleDemoBook = useCallback(
    async (url: string, filename: string) => {
      setError(null)
      setIsLoading(true)
      setLoadingProgress(0)

      try {
        const res = await fetch(url)
        if (!res.ok) throw new Error(`Failed to fetch demo PDF (HTTP ${res.status}).`)
        const blob = await res.blob()

        // Guard: empty response
        if (blob.size < 100) throw new Error('Demo PDF file appears empty.')

        const file = new File([blob], filename, { type: 'application/pdf' })

        const result = await parsePdf(file, (pct) => {
          setLoadingProgress(pct)
        })

        if (!result.pages.length) {
          throw new Error('This demo PDF has no renderable pages.')
        }

        setParsedPages(result.pages)
        setParsedText(result.text || [])
        setTotalPages(result.totalPages)
        setBookTitle(result.title)
        setBookId(crypto.randomUUID())

        router.push('/reader')
      } catch (err) {
        setIsLoading(false)
        setLoadingProgress(0)
        setError(err instanceof Error ? err.message : 'Failed to load demo book.')
      }
    },
    [router, setParsedPages, setParsedText, setTotalPages, setBookTitle, setBookId]
  )

  const demoBooks = [
    {
      title: 'The Hard Thing About Hard Things',
      author: 'Ben Horowitz',
      emoji: '💼',
      file: '/books/Ben-Horowitz-The-Hard-Thing-About-Hard-Things_-Building-a-Business-When-There-Are-No-Easy-Answers-HarperBusiness-2014.pdf',
    },
    {
      title: 'Ikigai',
      author: 'Héctor García & Francesc Miralles',
      emoji: '🌸',
      file: '/books/Ikigai _ the Japanese secret to a long and happy life ( PDFDrive.com ).pdf',
    },
    {
      title: 'Rich Dad Poor Dad',
      author: 'Robert T. Kiyosaki',
      emoji: '💰',
      file: '/books/Rich Dad Poor Dad.pdf',
    },
  ]

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files?.[0]
      if (file) processFile(file)
    },
    [processFile]
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }
  const handleDragLeave = () => setIsDragging(false)

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: '#2C1810' }}
    >
      {/* ─── Hero Section ──────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden">
        {/* Warm ambient glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(245,166,35,0.08) 0%, transparent 70%)',
          }}
        />

        {/* Nav */}
        <nav className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-8 py-4"
          style={{ backdropFilter: 'blur(12px)', backgroundColor: 'rgba(44,24,16,0.7)', borderBottom: '1px solid rgba(245,230,200,0.08)' }}
        >
          <div className="flex items-center gap-2.5">
            <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none" style={{ color: '#F5A623' }}>
              <path d="M4 4h18a1 1 0 011 1v22a1 1 0 01-1 1H4V4z" stroke="currentColor" strokeWidth="1.5" />
              <path d="M4 4H3a1 1 0 00-1 1v22a1 1 0 001 1h1" stroke="currentColor" strokeWidth="1.5" />
              <line x1="8" y1="10" x2="18" y2="10" stroke="currentColor" strokeWidth="1" opacity="0.5" />
              <line x1="8" y1="14" x2="18" y2="14" stroke="currentColor" strokeWidth="1" opacity="0.5" />
              <line x1="8" y1="18" x2="14" y2="18" stroke="currentColor" strokeWidth="1" opacity="0.5" />
              <path d="M23 8l7-4v24l-7-4" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
            </svg>
            <span className="text-sm font-medium tracking-wide" style={{ fontFamily: '"IM Fell English", serif', color: '#F5E6C8' }}>
              Buek
            </span>
          </div>
          <span className="text-xs px-3 py-1 rounded-md" style={{ fontFamily: '"Libre Baskerville", serif', color: 'rgba(245,230,200,0.4)', border: '1px solid rgba(245,230,200,0.1)' }}>
            v1.0
          </span>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 text-center max-w-xl mx-auto space-y-6 pt-20">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-5"
          >
            <h1
              className="text-4xl md:text-6xl font-normal leading-[1.15] tracking-tight"
              style={{ fontFamily: '"IM Fell English", serif', color: '#F5E6C8' }}
            >
              Read PDFs like
              <br />
              <span style={{ color: '#F5A623' }}>real books</span>
            </h1>

            <p
              className="text-sm md:text-base max-w-md mx-auto leading-relaxed"
              style={{ fontFamily: '"Libre Baskerville", serif', color: 'rgba(245,230,200,0.5)' }}
            >
              Drop any PDF and experience it as a beautiful flip-book with
              ambient lighting, page-turn sounds, and bookmarks — all in your browser.
            </p>
          </motion.div>

          {/* Upload area */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center gap-4 pt-2"
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className="relative w-full max-w-sm cursor-pointer select-none rounded-xl overflow-hidden transition-all duration-300"
              style={{
                border: `1.5px dashed ${isDragging ? '#F5A623' : 'rgba(245,230,200,0.18)'}`,
                backgroundColor: isDragging ? 'rgba(245,166,35,0.08)' : 'rgba(245,230,200,0.04)',
              }}
            >
              <div className="flex flex-col items-center gap-3 px-8 py-8">
                <div
                  className="w-12 h-12 flex items-center justify-center rounded-xl"
                  style={{ backgroundColor: 'rgba(245,166,35,0.1)' }}
                >
                  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" style={{ color: '#F5A623' }}>
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm" style={{ fontFamily: '"Libre Baskerville", serif', color: '#F5E6C8' }}>
                    {isDragging ? 'Drop your PDF here' : 'Drop a PDF or click to browse'}
                  </p>
                  <p className="text-xs" style={{ fontFamily: '"Libre Baskerville", serif', color: 'rgba(245,230,200,0.3)' }}>
                    Processed locally — nothing leaves your device
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => fileInputRef.current?.click()}
              className="px-8 py-3 rounded-xl text-sm font-medium transition-all"
              style={{
                fontFamily: '"Libre Baskerville", serif',
                color: '#2C1810',
                background: 'linear-gradient(135deg, #F5A623 0%, #E8923A 100%)',
                boxShadow: '0 4px 20px rgba(245,166,35,0.3)',
              }}
            >
              Open a PDF
            </motion.button>

            <p className="text-xs flex items-center gap-2" style={{ fontFamily: '"Libre Baskerville", serif', color: 'rgba(245,230,200,0.2)' }}>
              <kbd className="px-1.5 py-0.5 rounded text-[10px]" style={{ border: '1px solid rgba(245,230,200,0.12)', color: 'rgba(245,230,200,0.3)' }}>← →</kbd>
              navigate
              <kbd className="px-1.5 py-0.5 rounded text-[10px]" style={{ border: '1px solid rgba(245,230,200,0.12)', color: 'rgba(245,230,200,0.3)' }}>F</kbd>
              focus
              <kbd className="px-1.5 py-0.5 rounded text-[10px]" style={{ border: '1px solid rgba(245,230,200,0.12)', color: 'rgba(245,230,200,0.3)' }}>Esc</kbd>
              exit
            </p>
          </motion.div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-3 text-sm text-center px-4 py-2.5 rounded-xl max-w-sm mx-auto"
                style={{
                  fontFamily: '"Libre Baskerville", serif',
                  backgroundColor: 'rgba(220,38,38,0.12)',
                  color: '#fca5a5',
                  border: '1px solid rgba(220,38,38,0.2)',
                }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Scroll hint */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-8"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" style={{ color: 'rgba(245,230,200,0.2)' }}>
            <path d="M7 13l5 5 5-5M7 6l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>
      </section>

      {/* ─── Demo Books ──────────────────────────────────── */}
      <section className="px-6 py-20 max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-10">
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(245,230,200,0.1))' }} />
          <span className="text-xs tracking-[0.2em] uppercase" style={{ fontFamily: '"Libre Baskerville", serif', color: 'rgba(245,230,200,0.25)' }}>Try a demo</span>
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, transparent, rgba(245,230,200,0.1))' }} />
        </div>

        <p className="text-center text-sm mb-8" style={{ fontFamily: '"Libre Baskerville", serif', color: 'rgba(245,230,200,0.4)' }}>
          Don&apos;t have a PDF handy? Try one of these books.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {demoBooks.map((book, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleDemoBook(book.file, book.file.split('/').pop()!)}
              className="flex flex-col items-center gap-3 p-6 rounded-xl text-center transition-all cursor-pointer"
              style={{
                backgroundColor: 'rgba(245,230,200,0.04)',
                border: '1px solid rgba(245,230,200,0.08)',
              }}
            >
              <span className="text-3xl">{book.emoji}</span>
              <div className="space-y-1">
                <h3 className="text-sm leading-tight" style={{ fontFamily: '"IM Fell English", serif', color: '#F5E6C8' }}>
                  {book.title}
                </h3>
                <p className="text-[11px]" style={{ fontFamily: '"Libre Baskerville", serif', color: 'rgba(245,230,200,0.3)' }}>
                  {book.author}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* ─── Features ─────────────────────────────────────── */}
      <section className="px-6 py-20 max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-10">
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(245,230,200,0.1))' }} />
          <span className="text-xs tracking-[0.2em] uppercase" style={{ fontFamily: '"Libre Baskerville", serif', color: 'rgba(245,230,200,0.25)' }}>Features</span>
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, transparent, rgba(245,230,200,0.1))' }} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { icon: '📖', title: 'Realistic Page Flipping', desc: 'Smooth, animated page turns that feel like reading a physical book.' },
            { icon: '🕯️', title: 'Ambient Lighting Modes', desc: 'Candlelight, daylight, moonlight, and fireplace ambiances.' },
            { icon: '🎯', title: 'Focus Mode', desc: 'Distraction-free reading with a vignette overlay.' },
            { icon: '🔖', title: 'Bookmarks & Notes', desc: 'Mark your place and annotate pages as you go.' },
            { icon: '🖼️', title: 'True PDF Rendering', desc: 'Every page displayed as designed — real colors, fonts, layouts.' },
            { icon: '🔒', title: 'Fully Private', desc: 'Everything runs locally. No uploads, no tracking, no servers.' },
          ].map((f, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-4 rounded-lg transition-colors"
              style={{
                backgroundColor: 'rgba(245,230,200,0.04)',
                border: '1px solid rgba(245,230,200,0.07)',
              }}
            >
              <span className="text-xl flex-shrink-0 mt-0.5">{f.icon}</span>
              <div>
                <h3 className="text-sm mb-1" style={{ fontFamily: '"IM Fell English", serif', color: '#F5E6C8' }}>{f.title}</h3>
                <p className="text-xs leading-relaxed" style={{ fontFamily: '"Libre Baskerville", serif', color: 'rgba(245,230,200,0.4)' }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── How It Works ─────────────────────────────────── */}
      <section className="px-6 py-16 max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-10">
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(245,230,200,0.1))' }} />
          <span className="text-xs tracking-[0.2em] uppercase" style={{ fontFamily: '"Libre Baskerville", serif', color: 'rgba(245,230,200,0.25)' }}>How it works</span>
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, transparent, rgba(245,230,200,0.1))' }} />
        </div>

        <div className="flex flex-col md:flex-row items-start gap-8 text-center">
          {[
            { step: '1', title: 'Open a PDF', desc: 'Drag and drop or select any PDF from your device.' },
            { step: '2', title: 'Pages render', desc: 'Each page is rendered as a high-quality image in your browser.' },
            { step: '3', title: 'Start reading', desc: 'Flip pages, adjust lighting, bookmark your favorites.' },
          ].map((s, i) => (
            <div key={i} className="flex-1 space-y-3">
              <div
                className="inline-flex items-center justify-center w-10 h-10 rounded-full text-sm"
                style={{
                  fontFamily: '"Libre Baskerville", serif',
                  color: '#F5A623',
                  backgroundColor: 'rgba(245,166,35,0.1)',
                  border: '1px solid rgba(245,166,35,0.2)',
                }}
              >
                {s.step}
              </div>
              <h3 className="text-sm" style={{ fontFamily: '"IM Fell English", serif', color: '#F5E6C8' }}>{s.title}</h3>
              <p className="text-xs leading-relaxed" style={{ fontFamily: '"Libre Baskerville", serif', color: 'rgba(245,230,200,0.35)' }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────── */}
      <footer className="px-6 py-8 text-center" style={{ borderTop: '1px solid rgba(245,230,200,0.06)' }}>
        <p className="text-xs" style={{ fontFamily: '"Libre Baskerville", serif', color: 'rgba(245,230,200,0.2)' }}>
          Buek — Open source. Private. Beautiful.
        </p>
      </footer>

      <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleFileChange} />

      <AnimatePresence>
        {isLoading && <LoadingOverlay progress={loadingProgress} />}
      </AnimatePresence>
    </div>
  )
}
