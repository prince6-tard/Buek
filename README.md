<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14.2-black?logo=next.js" />
  <img src="https://img.shields.io/badge/React-18-61dafb?logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-5.4-3178c6?logo=typescript" />
  <img src="https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwindcss" />
  <img src="https://img.shields.io/badge/License-MIT-brightgreen" />
</p>

# 📖 Buek — PDF Book Reader

**Read PDFs like real books.** Drop any PDF and experience it as a beautiful flip-book with ambient lighting, page-turn sounds, and bookmarks — all in your browser. Nothing leaves your device.

![Buek hero](https://github.com/user-attachments/assets/placeholder-hero.png)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📖 **Realistic Page Flipping** | Smooth, animated page turns powered by [react-pageflip](https://github.com/nicklockwood/react-page-flip). |
| 🕯️ **4 Lighting Modes** | Candlelight · Daylight · Moonlight · Fireplace — each with a unique ambient vignette. |
| 🎯 **Focus Mode** | Distraction-free reading with a radial vignette overlay. Press `F` to toggle. |
| 🔖 **Bookmarks** | Save your place with an optional label and note. Persisted to localStorage. |
| ✏️ **Annotations** | Highlight & annotate paragraphs. Notes are saved per book. |
| 🖼️ **True PDF Rendering** | Every page rendered at 2× as a JPEG so original colors, fonts, and layouts are preserved. |
| 🔊 **Page-Turn Sound** | A subtle paper sound on every flip for immersion. |
| 📱 **Responsive** | Portrait mode on mobile, two-page spread on desktop. Touch-swipe supported. |
| ⛶ **Fullscreen** | One-click fullscreen reading. |
| 🔒 **Fully Private** | Everything runs client-side. No uploads, no tracking, no server. |
| 📚 **Demo Books** | 3 built-in books so visitors can try instantly without uploading. |

---

## 🏗️ Project Structure

```
BUEK/
├── app/
│   ├── layout.tsx          # Root layout — metadata, fonts, body class
│   ├── page.tsx            # Landing page — upload, demo books, features
│   ├── globals.css         # Global styles — lighting modes, animations
│   └── reader/
│       └── page.tsx        # Reader page — book viewer, toolbar, panels
│
├── components/
│   ├── BookViewer.tsx      # Responsive book container + ambient glow
│   ├── FlipBookClient.tsx  # react-pageflip wrapper (client-only)
│   ├── PageContent.tsx     # Single page renderer (img + binding shadow)
│   ├── Toolbar.tsx         # Floating pill toolbar (nav, lighting, etc.)
│   ├── LightingPanel.tsx   # Lighting mode picker popover
│   ├── FocusMode.tsx       # Vignette overlay for focused reading
│   ├── BookmarkPanel.tsx   # Bookmark drawer (right-side slide-in)
│   └── NotesSidebar.tsx    # Notes/annotations drawer
│
├── lib/
│   ├── pdfParser.ts        # PDF → page images via CDN-loaded pdfjs
│   └── store.ts            # Zustand global store (state + persistence)
│
├── types/
│   └── react-pageflip.d.ts # TypeScript declarations for react-pageflip
│
├── public/
│   ├── books/              # Demo PDF books (3 files)
│   └── sounds/
│       └── pturn.wav       # Page-turn sound effect
│
├── next.config.js          # Webpack aliases (pdfjs CDN strategy)
├── tailwind.config.ts      # Custom vintage color palette & animations
├── tsconfig.json           # TypeScript config (strict, path aliases)
├── postcss.config.js       # PostCSS pipeline (Tailwind + Autoprefixer)
├── .eslintrc.json          # ESLint rules
├── .gitignore              # Files excluded from version control
└── package.json            # Dependencies & scripts
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9 (or yarn / pnpm)

### Install & Run

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/buek.git
cd buek

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build   # Creates an optimized production build in .next/
npm start       # Starts the production server on port 3000
```

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `←` `→` | Previous / Next page |
| `Space` | Next page |
| `F` | Toggle focus mode |
| `B` | Toggle bookmark panel |
| `N` | Toggle notes panel |
| `Esc` | Close panels / exit focus mode |

---

## 🔧 Technical Notes

### Why is pdfjs loaded from CDN?

`pdfjs-dist` relies on an internal web worker (`pdf.worker.js`) that causes chunk-loading errors when processed by Next.js's webpack bundler. To avoid this:

1. `next.config.js` aliases `pdfjs-dist` to `false` on the client.
2. `lib/pdfParser.ts` injects a `<script>` tag at runtime pointing to the cdnjs-hosted `pdf.min.js` and configures the worker URL.

This means **an internet connection is required** the first time a PDF is opened (to download pdfjs). Subsequent loads may hit the browser cache.

### Why is react-pageflip in a separate wrapper?

`react-pageflip` uses CommonJS `module.exports` which clashes with Next.js's ESM dynamic imports on the server. By isolating it in `FlipBookClient.tsx` and loading that file with `dynamic({ ssr: false })`, the CJS module is only ever evaluated in the browser.

### State Persistence

Only `lightingMode`, `bookmarks`, and `notes` are saved to localStorage (key: `vintage-reader-storage`). Parsed page images are intentionally **not** persisted because a single book can easily be 50–200 MB of base64 data.

---

## 🛡️ Stability & Error Handling

| Scenario | Guard |
|----------|-------|
| Invalid file type (non-PDF) | Validated before parsing; error banner shown |
| Corrupt / password-protected PDF | `parsePdf()` catches pdfjs errors and re-throws with a user-friendly message |
| CDN unreachable (offline) | Script `onerror` handler surfaces "check your internet" message |
| Demo book fetch failure | Network error caught; loading overlay dismissed, error banner shown |
| Direct URL to `/reader` (no book loaded) | `useEffect` redirects to `/` if `parsedPages` is empty |
| Canvas context unavailable | Throws immediately with a descriptive error |
| Autoplay policy blocks sound | `play().catch(() => {})` silently swallows the browser restriction |
| localStorage full / unavailable | Zustand `persist` middleware gracefully falls back to in-memory state |

---

## 📦 Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 14.2.3 | React framework (App Router) |
| `react` | ^18.3 | UI library |
| `framer-motion` | ^11.2 | Animations (overlays, transitions, hover effects) |
| `react-pageflip` | ^2.0 | Realistic page-flip engine |
| `pdfjs-dist` | ^3.11 | PDF parsing (loaded from CDN at runtime) |
| `zustand` | ^4.5 | Lightweight global state management |
| `tailwindcss` | ^3.4 | Utility-first CSS |
| `typescript` | ^5.4 | Type safety |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">
  <strong>Buek</strong> — Open source. Private. Beautiful.
</p>
