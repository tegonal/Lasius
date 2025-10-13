/** @type {import('next').NextConfig} */

// Conditionally require bundle analyzer only when needed
const withBundleAnalyzer =
  process.env.ANALYZE === 'true'
    ? require('@next/bundle-analyzer')({
        enabled: true,
      })
    : (config) => config

const { i18n } = require('./next-i18next.config')
const { redirects } = require('./next.redirects')

// No environment variables required at build time

const nextConfiguration = {
  redirects,
  i18n,
  output: 'standalone',
  poweredByHeader: false,
  compiler: {},
  productionBrowserSourceMaps: process.env.NODE_ENV !== 'production',
  reactStrictMode: true,
  // Include missing dependencies in standalone build
  // These are transitive dependencies from get-intrinsic that Next.js tracing misses
  outputFileTracingIncludes: {
    '/*': [
      './node_modules/async-function/**/*',
      './node_modules/generator-function/**/*',
      './node_modules/async-generator-function/**/*',
    ],
  },
  headers: async () => [
    {
      // list more extensions here if needed; these are all the resources in the `public` folder including the subfolders
      source: '/:all*(svg|jpg|png|woff|woff2|eot|ttf|otf|ico)',
      locale: false,
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, s-maxage=31536000, stale-while-revalidate',
        },
      ],
    },
  ],
}

module.exports = withBundleAnalyzer(nextConfiguration)
