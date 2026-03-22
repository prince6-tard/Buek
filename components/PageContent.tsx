/**
 * components/PageContent.tsx — Single page renderer.
 *
 * Renders one PDF page as an <img> element.  No parchment overlay
 * is applied so the original PDF colors, fonts, and layout are
 * preserved faithfully.
 *
 * Additional visual touches:
 *  - A subtle inner shadow on the binding edge to mimic a physical
 *    book's gutter (left pages get a right shadow, right pages
 *    get a left shadow).
 *  - A translucent page-number badge at the bottom center.
 *  - Cover pages (first & last) skip the shadow and page number.
 *
 * Must use `forwardRef` because react-pageflip injects a ref to
 * measure each page's DOM node.
 */

'use client'

import { forwardRef } from 'react'

// ─── Types ─────────────────────────────────────────────────────

export interface PageContentProps {
  pageNumber: number
  /** data-URL image of the rendered PDF page */
  imageSrc: string
  isLeft?: boolean
  /** Whether this page is a cover (first or last) */
  isCover?: boolean
}

// ─── PageContent ────────────────────────────────────────────────
// Renders the actual PDF page image. No parchment overlay so
// the real colors of the book are preserved.
// Must be wrapped in forwardRef because react-pageflip needs the DOM ref.

const PageContent = forwardRef<HTMLDivElement, PageContentProps>(
  ({ pageNumber, imageSrc, isLeft = false, isCover = false }, ref) => {
    return (
      <div
        ref={ref}
        className={`w-full h-full overflow-hidden ${isCover ? 'book-cover' : ''}`}
        style={{
          position: 'relative',
          backgroundColor: '#1a1a1a',
        }}
      >
        {/* The actual PDF page rendered as an image, or a "failed" placeholder */}
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={isCover ? 'Book cover' : `Page ${pageNumber}`}
            draggable={false}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full">
            <p
              className="text-sm opacity-40 italic"
              style={{ fontFamily: '"Libre Baskerville", serif', color: '#F5E6C8' }}
            >
              Page {pageNumber} could not be rendered.
            </p>
          </div>
        )}

        {/* Subtle inner shadow for book-like depth (non-cover pages only) */}
        {!isCover && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              boxShadow: isLeft
                ? 'inset -8px 0 16px -8px rgba(0,0,0,0.15)'
                : 'inset 8px 0 16px -8px rgba(0,0,0,0.15)',
            }}
          />
        )}

        {/* Page number (non-cover pages) */}
        {!isCover && (
          <div
            className="absolute bottom-2 left-0 right-0 flex justify-center pointer-events-none"
          >
            <span
              className="text-[10px] tracking-widest opacity-40 select-none px-2 py-0.5 rounded-sm"
              style={{
                backgroundColor: 'rgba(0,0,0,0.4)',
                color: 'rgba(255,255,255,0.7)',
                fontFamily: '"Libre Baskerville", serif',
              }}
            >
              {pageNumber}
            </span>
          </div>
        )}
      </div>
    )
  }
)

PageContent.displayName = 'PageContent'

export default PageContent
