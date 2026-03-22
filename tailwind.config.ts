/**
 * tailwind.config.ts — Tailwind CSS theme for Buek.
 *
 * Extends the default Tailwind palette with warm, vintage-inspired
 * colors that match the app's book-reading aesthetic.  Custom
 * keyframe animations (flicker, shimmer, fadeIn, slideIn) are also
 * registered here so they can be used as utility classes.
 */
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        parchment: '#F5E6C8',
        parchmentLight: '#FDFAF3',
        parchmentDark: '#E8D5A3',
        inkBrown: '#3D2B1F',
        sepia: '#8B7355',
        warmAmber: '#F5A623',
        deepRed: '#8B0000',
      },
      fontFamily: {
        serif: ['"IM Fell English"', '"Libre Baskerville"', 'serif'],
        baskerville: ['"Libre Baskerville"', 'serif'],
      },
      animation: {
        flicker: 'flicker 3s infinite',
        shimmer: 'shimmer 2s infinite',
        fadeIn: 'fadeIn 0.5s ease',
        slideIn: 'slideIn 0.3s ease',
      },
      keyframes: {
        flicker: {
          '0%, 100%': { opacity: '1' },
          '25%, 75%': { opacity: '0.99' },
          '50%': { opacity: '0.97' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      backgroundImage: {
        parchmentTexture:
          'repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(139,90,43,0.03) 28px, rgba(139,90,43,0.03) 29px)',
      },
    },
  },
  plugins: [],
}

export default config
