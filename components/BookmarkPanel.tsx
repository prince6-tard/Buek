/**
 * components/BookmarkPanel.tsx — Right-side bookmark drawer.
 *
 * Opens as a slide-in panel from the right when the user presses
 * [B] or clicks the bookmark icon in the Toolbar.
 *
 * Features:
 *  - "Bookmark current page" button with optional label & note.
 *  - Sorted list of all bookmarks; click to jump to that page.
 *  - Delete individual bookmarks via hover-reveal × button.
 *  - Visual highlight on the bookmark matching the current page.
 *  - Full-screen backdrop that closes the drawer on click.
 *
 * All bookmark data lives in the Zustand store and is persisted
 * to localStorage.
 */

'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/lib/store'
import type { Bookmark } from '@/lib/store'

export default function BookmarkPanel() {
  const {
    bookmarks,
    addBookmark,
    removeBookmark,
    currentPage,
    totalPages,
    bookmarkPanelOpen,
    setBookmarkPanelOpen,
  } = useStore()

  const [noteInput, setNoteInput] = useState('')
  const [labelInput, setLabelInput] = useState('')
  const [addingNew, setAddingNew] = useState(false)

  const isCurrentPageBookmarked = bookmarks.some(
    (b) => b.page === currentPage + 1
  )

  const handleAddBookmark = () => {
    addBookmark({
      page: currentPage + 1,
      label: labelInput.trim() || `Page ${currentPage + 1}`,
      note: noteInput.trim(),
    })
    setLabelInput('')
    setNoteInput('')
    setAddingNew(false)
  }

  const jumpTo = (bookmark: Bookmark) => {
    useStore.getState().setCurrentPage(bookmark.page - 1)
    setBookmarkPanelOpen(false)
  }

  return (
    <AnimatePresence>
      {bookmarkPanelOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
            onClick={() => setBookmarkPanelOpen(false)}
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
                Bookmarks
              </h2>
              <button
                onClick={() => setBookmarkPanelOpen(false)}
                className="opacity-50 hover:opacity-100 transition-opacity"
                style={{ color: '#F5E6C8' }}
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Current page action */}
            <div className="px-5 py-3" style={{ borderBottom: '1px solid rgba(245,230,200,0.08)' }}>
              {isCurrentPageBookmarked ? (
                <p
                  className="text-sm opacity-50 italic"
                  style={{ fontFamily: '"IM Fell English", serif', color: '#F5E6C8' }}
                >
                  Page {currentPage + 1} is already bookmarked.
                </p>
              ) : (
                <>
                  {!addingNew ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setAddingNew(true)}
                      className="w-full text-sm py-2 rounded-sm"
                      style={{
                        fontFamily: '"Libre Baskerville", serif',
                        backgroundColor: 'rgba(245,230,200,0.1)',
                        color: '#F5E6C8',
                        border: '1px solid rgba(245,230,200,0.15)',
                      }}
                    >
                      + Bookmark page {currentPage + 1}
                    </motion.button>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <input
                        autoFocus
                        type="text"
                        value={labelInput}
                        onChange={(e) => setLabelInput(e.target.value)}
                        placeholder={`Page ${currentPage + 1}`}
                        className="w-full text-sm px-3 py-2 rounded-sm outline-none"
                        style={{
                          fontFamily: '"Libre Baskerville", serif',
                          backgroundColor: 'rgba(245,230,200,0.08)',
                          color: '#F5E6C8',
                          border: '1px solid rgba(245,230,200,0.2)',
                        }}
                      />
                      <textarea
                        value={noteInput}
                        onChange={(e) => setNoteInput(e.target.value)}
                        placeholder="Optional note…"
                        rows={2}
                        className="w-full text-sm px-3 py-2 rounded-sm outline-none resize-none"
                        style={{
                          fontFamily: '"Libre Baskerville", serif',
                          backgroundColor: 'rgba(245,230,200,0.08)',
                          color: '#F5E6C8',
                          border: '1px solid rgba(245,230,200,0.2)',
                        }}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => setAddingNew(false)}
                          className="flex-1 text-xs py-1.5 rounded-sm opacity-60 hover:opacity-100 transition-opacity"
                          style={{ fontFamily: '"Libre Baskerville", serif', color: '#F5E6C8' }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAddBookmark}
                          className="flex-1 text-xs py-1.5 rounded-sm"
                          style={{
                            fontFamily: '"Libre Baskerville", serif',
                            backgroundColor: '#F5E6C8',
                            color: '#2C1810',
                          }}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Bookmarks list */}
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
              {bookmarks.length === 0 ? (
                <p
                  className="text-sm opacity-40 italic text-center mt-8"
                  style={{ fontFamily: '"IM Fell English", serif', color: '#F5E6C8' }}
                >
                  No bookmarks yet.
                  <br />
                  Navigate to a page and add one above.
                </p>
              ) : (
                [...bookmarks]
                  .sort((a, b) => a.page - b.page)
                  .map((bookmark) => (
                    <motion.div
                      key={bookmark.id}
                      whileHover={{ x: 4 }}
                      className="group flex items-start gap-3 p-3 rounded-sm cursor-pointer transition-all"
                      style={{
                        backgroundColor:
                          bookmark.page === currentPage + 1
                            ? 'rgba(245,230,200,0.12)'
                            : 'rgba(245,230,200,0.05)',
                        border: '1px solid rgba(245,230,200,0.1)',
                      }}
                      onClick={() => jumpTo(bookmark)}
                    >
                      {/* Bookmark ribbon icon */}
                      <svg
                        viewBox="0 0 24 24"
                        className="w-4 h-4 flex-shrink-0 mt-0.5"
                        fill="none"
                        style={{ color: bookmark.page === currentPage + 1 ? '#F5A623' : '#F5E6C8' }}
                      >
                        <path
                          d="M5 3h14v18l-7-4-7 4V3z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinejoin="round"
                          fill={bookmark.page === currentPage + 1 ? 'rgba(245,166,35,0.3)' : 'none'}
                        />
                      </svg>

                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm truncate"
                          style={{ fontFamily: '"IM Fell English", serif', color: '#F5E6C8' }}
                        >
                          {bookmark.label}
                        </p>
                        <p
                          className="text-xs opacity-50 mt-0.5"
                          style={{ fontFamily: '"Libre Baskerville", serif', color: '#F5E6C8' }}
                        >
                          Page {bookmark.page} of {totalPages}
                        </p>
                        {bookmark.note && (
                          <p
                            className="text-xs opacity-40 mt-1 truncate italic"
                            style={{ fontFamily: '"Libre Baskerville", serif', color: '#F5E6C8' }}
                          >
                            {bookmark.note}
                          </p>
                        )}
                      </div>

                      {/* Remove button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeBookmark(bookmark.id)
                        }}
                        className="opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity flex-shrink-0"
                        style={{ color: '#F5E6C8' }}
                        title="Remove bookmark"
                      >
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
                          <path
                            d="M18 6L6 18M6 6l12 12"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
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
