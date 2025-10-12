/** @type {import('next').NextConfig} */

// Conditionally require bundle analyzer only when needed
const withBundleAnalyzer =
  process.env.ANALYZE === 'true'
    ? require('@next/bundle-analyzer')({
        enabled: true,
      })
    : (config) => config

const { i18n } = require('./next-i18next.config')
const { generateBuildId, generateBuildIdSync } = require('./next.buildId')
const { redirects } = require('./next.redirects')

const { ENVIRONMENT } = process.env

const {
  LASIUS_API_WEBSOCKET_URL,
  LASIUS_API_URL,
  LASIUS_API_URL_INTERNAL,
  LASIUS_TELEMETRY_PLAUSIBLE_HOST,
  LASIUS_TELEMETRY_PLAUSIBLE_SOURCE_DOMAIN,
  LASIUS_DEMO_MODE,
  LASIUS_TERMSOFSERVICE_VERSION,
} = process.env

const nextConfiguration = {
  redirects,
  generateBuildId,
  i18n,
  poweredByHeader: false,
  compiler: {},
  productionBrowserSourceMaps: process.env.NODE_ENV !== 'production',
  reactStrictMode: true,
  publicRuntimeConfig: {
    BUILD_ID: generateBuildIdSync(),
    ENVIRONMENT,
    LASIUS_API_WEBSOCKET_URL,
    LASIUS_API_URL,
    LASIUS_API_URL_INTERNAL,
    LASIUS_TELEMETRY_PLAUSIBLE_HOST,
    LASIUS_TELEMETRY_PLAUSIBLE_SOURCE_DOMAIN,
    LASIUS_DEMO_MODE,
    LASIUS_TERMSOFSERVICE_VERSION,
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
