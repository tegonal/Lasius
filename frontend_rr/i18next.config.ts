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

import { defineConfig } from 'i18next-cli'

export default defineConfig({
  extract: {
    contextSeparator: '_',
    defaultNS: 'common',

    // Readable defaults from key path (merged from semantic config)
    defaultValue: (key, _namespace, _language, value) => {
      if (value) return value
      const parts = key.split('.')
      const lastPart = parts.at(-1) ?? key
      return lastPart
        .replaceAll(/([A-Z])/g, ' $1')
        .replaceAll('_', ' ')
        .replaceAll(/\b\w/g, (l) => l.toUpperCase())
        .trim()
    },
    extractFromComments: false,
    input: ['app/**/*.{js,ts,tsx}'],
    keySeparator: '.',
    nsSeparator: ':',

    output: 'app/locales/{{language}}/{{namespace}}.json',

    pluralSeparator: '_',
    removeUnusedKeys: true,
    warnOnConflicts: true,
  },

  lint: {
    ignore: [],
    ignoredTags: ['noscript'],
  },

  // Keep in sync with app/i18n-config.ts LOCALES
  // (cannot import directly — CLI config does not resolve app path aliases)
  locales: ['en', 'de', 'fr', 'it', 'es'],

  types: {
    input: ['app/locales/en/*.json'],
    output: 'app/types/i18next.d.ts',
    resourcesFile: 'app/types/resources.d.ts',
  },
})
