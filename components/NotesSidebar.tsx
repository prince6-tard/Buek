/**
 * components/NotesSidebar.tsx — Right-side annotations drawer.
 *
 * Opens when the user presses [N] or clicks the pencil icon in
 * the Toolbar.  Displays all notes for the current book, sorted
 * by page number.
 *
 * Each note card shows:
 *  - A highlighted excerpt from the annotated paragraph.
 *  - The user's note text.
 *  - Page number + a delete button on hover.
 *
 * Clicking a note jumps to that page and closes the drawer.
 *
 * Note: creating new notes is done via right-click on a paragraph
 * in the page content (feature placeholder; the UI currently shows
 * instructions but paragraph-level interaction is not yet wired).
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/lib/store'
import type { Note } from '@/lib/store'

export default function NotesSidebar() {
  const {
    notesPanelOpen,
    setNotesPanelOpen,
    notes,
    removeNote,
    bookId,
    setCurrentPage,
  } = useStore()

  const bookNotes: Note[] = notes
    .filter((n) => n.bookId === bookId)
    .sort((a, b) => a.pageIndex - b.pageIndex)

  const jumpToNote = (note: Note) => {
    setCurrentPage(note.pageIndex)
    setNotesPanelOpen(false)
  }

  return (
    <AnimatePresence>
      {notesPanelOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
            onClick={() => setNotesPanelOpen(false)}
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3, ease: 'easeInOut' }}
            className="fixed right-0 top-0 bottom-0 z-50 flex flex-col overflow-hidden"
            style={{
              width: 320,
              backgroundColor: 'rgba(44,24,16,0.97)',
              borderLeft: '1px solid rgba(245,230,200,0.12)',
              boxShadow: '-8px 0 40px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(16px)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid rgba(245,230,200,0.12)' }}
            >
              <h2
                className="text-lg font-normal"
                style={{ fontFamily: '"IM Fell English", serif', color: '#F5E6C8' }}
              >
                Annotations
              </h2>
              <button
                onClick={() => setNotesPanelOpen(false)}
                className="opacity-50 hover:opacity-100 transition-opacity"
                style={{ color: '#F5E6C8' }}
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
                  <path
                    d="M18 6L6 18M6 6l12 12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            {/* Instructions */}
            <div className="px-5 py-3" style={{ borderBottom: '1px solid rgba(245,230,200,0.08)' }}>
              <p
                className="text-xs opacity-40 italic"
                style={{ fontFamily: '"Libre Baskerville", serif', color: '#F5E6C8' }}
              >
                Right-click any paragraph on a page to add a note & highlight.
              </p>
            </div>

            {/* Notes list */}
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
              {bookNotes.length === 0 ? (
                <p
                  className="text-sm opacity-40 italic text-center mt-8"
                  style={{ fontFamily: '"IM Fell English", serif', color: '#F5E6C8' }}
                >
                  No annotations yet.
                  <br />
                  Right-click a paragraph to begin.
                </p>
              ) : (
                bookNotes.map((note) => (
                  <motion.div
                    key={note.id}
                    whileHover={{ x: 4 }}
                    className="group p-3 rounded-sm cursor-pointer transition-all"
                    style={{
                      backgroundColor: 'rgba(245,166,35,0.08)',
                      border: '1px solid rgba(245,166,35,0.2)',
                    }}
                    onClick={() => jumpToNote(note)}
                  >
                    {/* Highlighted excerpt */}
                    <div
                      className="text-xs italic mb-2 pb-2 line-clamp-2 opacity-60"
                      style={{
                        fontFamily: '"IM Fell English", serif',
                        color: '#F5E6C8',
                        borderBottom: '1px solid rgba(245,230,200,0.1)',
                      }}
                    >
                      &ldquo;{note.highlight}&hellip;&rdquo;
                    </div>

                    {/* Note text */}
                    <p
                      className="text-sm"
                      style={{ fontFamily: '"Libre Baskerville", serif', color: '#F5E6C8' }}
                    >
                      {note.text}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-2">
                      <span
                        className="text-xs opacity-40"
                        style={{ fontFamily: '"Libre Baskerville", serif', color: '#F5E6C8' }}
                      >
                        Page {note.pageIndex + 1}
                      </span>

                      {/* Remove button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeNote(note.id)
                        }}
                        className="opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity"
                        style={{ color: '#F5E6C8' }}
                        title="Delete annotation"
                      >
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
                          <path
                            d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
