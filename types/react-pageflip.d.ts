/**
 * types/react-pageflip.d.ts — Type declarations for the `react-pageflip` package.
 *
 * react-pageflip ships without TypeScript types and uses CommonJS
 * `module.exports`, so we declare the module manually.  The component
 * exposes a `pageFlip()` method via ref that gives imperative control
 * over page navigation (flipNext, flipPrev, flip-to-page, etc.).
 */
declare module 'react-pageflip' {
  import React from 'react'

  export interface HTMLFlipBookProps {
    width: number
    height: number
    size?: 'fixed' | 'stretch'
    minWidth?: number
    maxWidth?: number
    minHeight?: number
    maxHeight?: number
    showCover?: boolean
    mobileScrollSupport?: boolean
    drawShadow?: boolean
    flippingTime?: number
    usePortrait?: boolean
    startPage?: number
    autoSize?: boolean
    maxShadowOpacity?: number
    showPageCorners?: boolean
    disableFlipByClick?: boolean
    style?: React.CSSProperties
    className?: string
    onFlip?: (e: { data: number }) => void
    onChangeOrientation?: (e: { data: string }) => void
    onInit?: (e: { data: unknown }) => void
    children?: React.ReactNode
  }

  export interface PageFlipAPI {
    flipNext: (corner?: string) => void
    flipPrev: (corner?: string) => void
    flip: (page: number, corner?: string) => void
    getCurrentPageIndex: () => number
    getPageCount: () => number
    getOrientation: () => string
    destroy: () => void
  }

  // react-pageflip uses CJS module.exports = component, so the component
  // is the default export when imported via ESM dynamic import.
  const HTMLFlipBook: React.ForwardRefExoticComponent<
    HTMLFlipBookProps & React.RefAttributes<{ pageFlip: () => PageFlipAPI }>
  >

  export { HTMLFlipBook }
  export default HTMLFlipBook
}
