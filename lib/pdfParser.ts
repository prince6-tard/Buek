/**
 * lib/pdfParser.ts — PDF parsing engine for Buek.
 *
 * Architecture:
 *  - pdfjs-dist is loaded FROM CDN at runtime (not bundled by webpack)
 *    because its internal web-worker setup causes chunk-loading errors
 *    when processed by Next.js's webpack pipeline.
 *  - `loadPdfjsFromCDN()` injects a <script> tag once and resolves
 *    when `window.pdfjsLib` becomes available.
 *  - Each page is rendered to an off-screen <canvas> at 2× scale,
 *    then exported as a JPEG data-URL (quality 0.92) so the book
 *    viewer can display it as a plain <img>.
 *  - `parsePdf()` is the public entry point — accepts a File and an
 *    optional progress callback, returns an array of page image URLs.
 *
 * Error handling:
 *  - Network failures (CDN unreachable) surface a clear message.
 *  - Corrupt / password-protected PDFs are caught and re-thrown with
 *    a user-friendly message.
 *  - Metadata extraction failure is non-fatal (falls back to filename).
 */

// ─── CDN URLs for pdf.js v3.11.174 ────────────────────────────
const PDFJS_CDN =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
const WORKER_CDN =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'

// Shape of the pdfjs global we need
interface PdfjsLib {
  GlobalWorkerOptions: { workerSrc: string }
  getDocument: (src: { data: ArrayBuffer }) => {
    promise: Promise<PdfjsDocument>
  }
}
interface PdfjsDocument {
  numPages: number
  getPage: (n: number) => Promise<PdfjsPage>
  getMetadata: () => Promise<{ info: unknown }>
  destroy: () => void
}
interface PdfjsViewport {
  width: number
  height: number
}
interface PdfjsRenderTask {
  promise: Promise<void>
}
interface PdfjsPage {
  getViewport: (params: { scale: number }) => PdfjsViewport
  render: (params: {
    canvasContext: CanvasRenderingContext2D
    viewport: PdfjsViewport
  }) => PdfjsRenderTask
  getTextContent: () => Promise<{
    items: Array<{ str?: string; transform?: number[] }>
  }>
  cleanup: () => void
}

declare global {
  interface Window {
    pdfjsLib?: PdfjsLib
  }
}

export interface ParseResult {
  pages: string[]       // Array of data-URL images (one per PDF page)
  text: string[]        // Array of raw text strings (one per PDF page)
  totalPages: number
  title: string
}

/** Inject the pdfjs CDN script once and resolve when ready. */
let loadPromise: Promise<PdfjsLib> | null = null

function loadPdfjsFromCDN(): Promise<PdfjsLib> {
  if (loadPromise) return loadPromise

  loadPromise = new Promise<PdfjsLib>((resolve, reject) => {
    // Already available (e.g. script was injected elsewhere)
    if (window.pdfjsLib) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_CDN
      resolve(window.pdfjsLib)
      return
    }

    const script = document.createElement('script')
    script.src = PDFJS_CDN
    script.async = true

    // Timeout guard — if CDN doesn't respond within 15 s, fail
    const timeout = setTimeout(() => {
      reject(new Error('PDF.js CDN timed out. Check your internet connection.'))
    }, 15_000)

    script.onload = () => {
      clearTimeout(timeout)
      if (!window.pdfjsLib) {
        reject(new Error('pdfjs-dist loaded but window.pdfjsLib is not defined.'))
        return
      }
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_CDN
      resolve(window.pdfjsLib)
    }
    script.onerror = () => {
      clearTimeout(timeout)
      reject(new Error('Failed to load PDF.js from CDN. Check your internet connection.'))
    }
    document.head.appendChild(script)
  })

  // If the promise rejects, reset so the next call retries
  loadPromise.catch(() => {
    loadPromise = null
  })

  return loadPromise
}

/**
 * Render a single PDF page to a canvas and return a data-URL image.
 * Uses scale=2.0 for crisp rendering.
 */
async function renderPageToImage(page: PdfjsPage): Promise<string> {
  const scale = 2.0
  const viewport = page.getViewport({ scale })

  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get 2d canvas context')

  await page.render({ canvasContext: ctx, viewport }).promise

  // Convert to JPEG for smaller size (quality 0.92 is high fidelity)
  const dataUrl = canvas.toDataURL('image/jpeg', 0.92)

  // Clean up
  canvas.width = 0
  canvas.height = 0

  return dataUrl
}

/**
 * Parse an entire PDF File and return an array of page image data URLs.
 * Calls onProgress(0..100) if provided.
 */
export async function parsePdf(
  file: File,
  onProgress?: (percent: number) => void
): Promise<ParseResult> {
  const pdfjs = await loadPdfjsFromCDN()

  const arrayBuffer = await file.arrayBuffer()
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer })

  let doc: PdfjsDocument
  try {
    doc = await loadingTask.promise
  } catch (err) {
    throw new Error(
      `Failed to load PDF: ${err instanceof Error ? err.message : 'Unknown error'}`
    )
  }

  const numPages = doc.numPages
  const pages: string[] = []
  const textStrings: string[] = []

  // Try to get title from metadata
  let title = file.name.replace(/\.pdf$/i, '')
  try {
    const meta = await doc.getMetadata()
    const info = meta.info as Record<string, string>
    if (info?.Title) title = info.Title
  } catch {
    // Metadata not critical
  }

  for (let i = 1; i <= numPages; i++) {
    try {
      const page = await doc.getPage(i)
      const imageDataUrl = await renderPageToImage(page)
      pages.push(imageDataUrl)

      try {
        const textContent = await page.getTextContent()
        const pageText = textContent.items.map((item: any) => item.str).join(' ')
        textStrings.push(pageText)
      } catch (textErr) {
        console.warn(`[Buek] Failed to extract text for page ${i}:`, textErr)
        textStrings.push('')
      }

      page.cleanup()
    } catch (pageErr) {
      // If a single page fails, push a blank placeholder so page
      // numbering stays consistent — don't crash the entire parse.
      console.warn(`[Buek] Failed to render page ${i}:`, pageErr)
      pages.push('')
      textStrings.push('')
    }

    if (onProgress) {
      onProgress(Math.round((i / numPages) * 100))
    }
  }

  // Free the PDF document to reclaim memory
  try { doc.destroy() } catch { /* non-critical */ }

  return { pages, text: textStrings, totalPages: numPages, title }
}
