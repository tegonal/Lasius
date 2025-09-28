/**
 * Lasius - Open source time tracker for teams
 * Copyright (c) Tegonal Genossenschaft (https://tegonal.com)
 *
 * This file is part of Lasius.
 *
 * Lasius is free software: you can redistribute it and/or modify it under the terms of the
 * GNU Affero General Public License as published by the Free Software Foundation, either
 * version 3 of the License, or (at your option) any later version.
 *
 * Lasius is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without
 * even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with Lasius.
 * If not, see <https://www.gnu.org/licenses/>.
 *
 */

// Alternative configuration for semantic keys
// This allows using keys like 'bookings.actions.delete' with proper extraction

module.exports = {
  contextSeparator: '_',
  createOldCatalogs: true,
  defaultNamespace: 'common',

  // IMPORTANT: Enable key separator for nested keys
  keySeparator: '.',

  // IMPORTANT: Enable namespace separator for organization
  namespaceSeparator: ':',

  // Custom defaultValue function that extracts from t() calls
  // This will NOT be used if defaultValue is provided in the t() call
  defaultValue: (locale, namespace, key, value) => {
    // If a defaultValue was provided in the code, use it
    if (value) return value;

    // Otherwise, create a readable default from the key
    // 'bookings.actions.delete' -> 'Delete'
    const parts = key.split('.');
    const lastPart = parts[parts.length - 1];

    // Convert camelCase/snake_case to Title Case
    return lastPart
      .replace(/([A-Z])/g, ' $1') // Add space before capitals
      .replace(/_/g, ' ') // Replace underscores with spaces
      .replace(/\b\w/g, l => l.toUpperCase()) // Capitalize first letters
      .trim();
  },

  // Don't use keys as default values since we're using semantic keys
  useKeysAsDefaultValue: false,

  // Don't skip default values - we want them extracted
  skipDefaultValues: false,

  indentation: 2,
  keepRemoved: false,

  lexers: {
    hbs: ['HandlebarsLexer'],
    handlebars: ['HandlebarsLexer'],
    htm: ['HTMLLexer'],
    html: ['HTMLLexer'],
    mjs: ['JavascriptLexer'],
    js: ['JavascriptLexer'],
    ts: ['JavascriptLexer'],
    tsx: ['JsxLexer'],
    jsx: ['JsxLexer'],
    default: ['JavascriptLexer'],
  },

  lineEnding: 'auto',
  locales: ['en', 'de'],
  output: 'public/locales/$LOCALE/$NAMESPACE.json',

  // Use different plural separator to avoid conflicts
  pluralSeparator: '_plural_',

  input: ['src/**/*.{js,ts,tsx}'],
  sort: true,
  verbose: true,
  failOnWarnings: false,
  failOnUpdate: false,

  // Optional: Store metadata about translations
  customValueTemplate: {
    message: '${defaultValue}',
    // description: '${description}', // If you add description in t() calls
  },

  resetDefaultValueLocale: null,
  i18nextOptions: null,
};