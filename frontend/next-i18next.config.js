 

module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'de'],
    // Disable automatic locale detection - only use cookies
    localeDetection: false,
  },
  // Enable key and namespace separators for semantic keys
  keySeparator: '.',
  nsSeparator: ':',
  // Don't return the key if translation is missing
  returnEmptyString: false,
  // Use default value if provided
  fallbackLng: false,
  // Don't use URL locale prefixes - locale is determined by cookie only
  react: {
    useSuspense: false,
  },
};
