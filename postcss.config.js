/**
 * postcss.config.js — PostCSS pipeline for Buek.
 *
 * Plugins:
 *  - tailwindcss  : Generates utility classes from tailwind.config.ts.
 *  - autoprefixer : Adds vendor prefixes for browser compatibility.
 */
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
