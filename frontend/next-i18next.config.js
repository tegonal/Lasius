/** @type {import('next-i18next').UserConfig} */
module.exports = {
  debug: process.env.LASIUS_DEBUG === 'true',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'de', 'fr', 'it', 'es'],
    // Disable automatic locale detection - we handle it via cookies for prefix-less URLs
    localeDetection: false,
  },
  // Path configuration - use path.resolve on server, /locales on client
  localePath:
    typeof window === 'undefined' ? require('path').resolve('./public/locales') : '/locales',
  // Reload translations in development
  reloadOnPrerender: process.env.NODE_ENV === 'development',
  // Enable key and namespace separators for semantic keys
  keySeparator: '.',
  nsSeparator: ':',
  // Don't return the key if translation is missing
  returnEmptyString: false,
  // Use default value if provided
  fallbackLng: false,
}
