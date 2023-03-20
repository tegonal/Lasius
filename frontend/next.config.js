/* eslint-disable license-header/header */

/** @type {import('next').NextConfig} */

/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-var-requires */
const { redirects } = require('./next.redirects');
const { generateBuildId, generateBuildIdSync } = require('./next.buildId');
const { i18n } = require('./next-i18next.config');
const { runtimeCaching } = require('./next.pwa-cache');

const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching,
});

// const withBundleAnalyzer = require('@next/bundle-analyzer')({
//   enabled: process.env.ANALYZE === 'true',
// });

const { ENVIRONMENT } = process.env;

const { LASIUS_API_WEBSOCKET_URL, LASIUS_API_URL, LASIUS_API_URL_INTERNAL } = process.env;

const nextConfiguration = {
  redirects,
  generateBuildId,
  i18n,
  poweredByHeader: false,
  compiler: {
    emotion: {
      sourceMap: true,
      autoLabel: 'always',
      labelFormat: '[filename]',
    },
  },
  modularizeImports: {
    lodash: {
      transform: 'lodash/{{member}}',
    },
    'date-fns': {
      transform: 'date-fns/{{member}}',
    },
  },
  productionBrowserSourceMaps: true,
  reactStrictMode: true,
  publicRuntimeConfig: {
    BUILD_ID: generateBuildIdSync(),
    ENVIRONMENT,
    LASIUS_API_WEBSOCKET_URL,
    LASIUS_API_URL,
    LASIUS_API_URL_INTERNAL,
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
};

// module.exports = withPWA(withBundleAnalyzer(nextConfiguration));
module.exports = withPWA(nextConfiguration);
