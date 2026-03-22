/**
 * lib/store.ts — Global state management for Buek (Zustand).
 *
 * This single store drives the entire app:
 *  - **Lighting mode** — candlelight / daylight / moonlight / fireplace.
 *  - **Focus mode** — boolean toggle for the vignette overlay.
 *  - **Panel visibility** — bookmark drawer & notes drawer open/close.
 *  - **Book state** — parsed page images, current page, total pages,
 *    book title, and a unique book ID per session.
 *  - **Loading** — progress bar state while the PDF is being parsed.
 *  - **Bookmarks & Notes** — CRUD operations on user-created data.
 *
 * Persistence:
 *  Only `lightingMode`, `bookmarks`, and `notes` are persisted to
 *  localStorage via the Zustand `persist` middleware (key:
 *  "vintage-reader-storage").  Parsed page data is intentionally
 *  NOT persisted because it can be very large (hundreds of MBs of
 *  base64 image data).
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ─── Types ────────────────────────────────────────────────────

export type LightingMode = 'candlelight' | 'daylight' | 'moonlight' | 'fireplace'

export interface Bookmark {
  id: string
  page: number
  label: string
  note: string
  createdAt: number
}

export interface Note {
  id: string
  bookId: string
  pageIndex: number
  paragraphIndex: number
  text: string
  highlight: string
  createdAt: number
}

// ─── Store Shape ──────────────────────────────────────────────

interface BuekState {
  // Lighting
  lightingMode: LightingMode
  setLightingMode: (mode: LightingMode) => void

  // Focus
  focusMode: boolean
  setFocusMode: (value: boolean) => void
  toggleFocusMode: () => void

  // Panels
  bookmarkPanelOpen: boolean
  setBookmarkPanelOpen: (value: boolean) => void
  notesPanelOpen: boolean
  setNotesPanelOpen: (value: boolean) => void
  aiChatPanelOpen: boolean
  setAiChatPanelOpen: (value: boolean) => void

  // Book reading state
  currentPage: number
  setCurrentPage: (page: number) => void
  totalPages: number
  setTotalPages: (total: number) => void
  parsedPages: string[]
  setParsedPages: (pages: string[]) => void
  parsedText: string[]
  setParsedText: (text: string[]) => void

  // Book metadata
  bookId: string
  setBookId: (id: string) => void
  bookTitle: string
  setBookTitle: (title: string) => void

  // Loading
  isLoading: boolean
  setIsLoading: (value: boolean) => void
  loadingProgress: number
  setLoadingProgress: (value: number) => void

  // Bookmarks
  bookmarks: Bookmark[]
  addBookmark: (bookmark: Omit<Bookmark, 'id' | 'createdAt'>) => void
  removeBookmark: (id: string) => void
  clearBookmarks: () => void

  // Notes
  notes: Note[]
  addNote: (note: Omit<Note, 'id' | 'createdAt'>) => void
  removeNote: (id: string) => void
  getNotesByPage: (bookId: string, pageIndex: number) => Note[]
}

// ─── Store ────────────────────────────────────────────────────

export const useStore = create<BuekState>()(
  persist(
    (set, get) => ({
      // Lighting
      lightingMode: 'candlelight',
      setLightingMode: (mode) => set({ lightingMode: mode }),

      // Focus
      focusMode: false,
      setFocusMode: (value) => set({ focusMode: value }),
      toggleFocusMode: () => set((state) => ({ focusMode: !state.focusMode })),

      // Panels
      bookmarkPanelOpen: false,
      setBookmarkPanelOpen: (value) => set({ bookmarkPanelOpen: value }),
      notesPanelOpen: false,
      setNotesPanelOpen: (value) => set({ notesPanelOpen: value }),
      aiChatPanelOpen: false,
      setAiChatPanelOpen: (value) => set({ aiChatPanelOpen: value }),

      // Book reading state
      currentPage: 0,
      setCurrentPage: (page) => set({ currentPage: page }),
      totalPages: 0,
      setTotalPages: (total) => set({ totalPages: total }),
      parsedPages: [],
      setParsedPages: (pages) => set({ parsedPages: pages }),
      parsedText: [],
      setParsedText: (text) => set({ parsedText: text }),

      // Metadata
      bookId: '',
      setBookId: (id) => set({ bookId: id }),
      bookTitle: '',
      setBookTitle: (title) => set({ bookTitle: title }),

      // Loading
      isLoading: false,
      setIsLoading: (value) => set({ isLoading: value }),
      loadingProgress: 0,
      setLoadingProgress: (value) => set({ loadingProgress: value }),

      // Bookmarks
      bookmarks: [],
      addBookmark: (bookmark) =>
        set((state) => ({
          bookmarks: [
            ...state.bookmarks,
            { ...bookmark, id: crypto.randomUUID(), createdAt: Date.now() },
          ],
        })),
      removeBookmark: (id) =>
        set((state) => ({
          bookmarks: state.bookmarks.filter((b) => b.id !== id),
        })),
      clearBookmarks: () => set({ bookmarks: [] }),

      // Notes
      notes: [],
      addNote: (note) =>
        set((state) => ({
          notes: [
            ...state.notes,
            { ...note, id: crypto.randomUUID(), createdAt: Date.now() },
          ],
        })),
      removeNote: (id) =>
        set((state) => ({
          notes: state.notes.filter((n) => n.id !== id),
        })),
      getNotesByPage: (bookId, pageIndex) =>
        get().notes.filter(
          (n) => n.bookId === bookId && n.pageIndex === pageIndex
        ),
    }),
    {
      name: 'vintage-reader-storage',
      partialize: (state) => ({
        lightingMode: state.lightingMode,
        bookmarks: state.bookmarks,
        notes: state.notes,
      }),
    }
  )
)
