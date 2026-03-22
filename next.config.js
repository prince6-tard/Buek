/**
 * next.config.js — Next.js configuration for Buek.
 *
 * Key decisions:
 *  1. `pdfjs-dist` is aliased to `false` on the client so webpack never
 *     tries to bundle it. Instead we load the library at runtime from
 *     a CDN via a <script> tag (see lib/pdfParser.ts). This avoids
 *     chunk-loading errors caused by pdfjs's internal worker setup.
 *  2. `canvas` and `encoding` are also aliased to `false` because
 *     pdfjs-dist optionally imports them, but they are Node-only
 *     modules that would break the browser build.
 *
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Prevent Node-only optional deps from being bundled
    config.resolve.alias.canvas = false
    config.resolve.alias.encoding = false

    if (!isServer) {
      // Replace pdfjs-dist with an empty module on the client.
      // The actual library is loaded from CDN at runtime.
      config.resolve.alias['pdfjs-dist'] = false
    }

    return config
  },
}

module.exports = nextConfig
