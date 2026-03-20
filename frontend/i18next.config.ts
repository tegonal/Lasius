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

import { defineConfig } from 'i18next-cli';

export default defineConfig({
  locales: ['en', 'de', 'fr', 'it', 'es'],

  extract: {
    input: ['src/**/*.{js,ts,tsx}'],
    output: 'public/locales/{{language}}/{{namespace}}.json',

    defaultNS: 'common',
    keySeparator: '.',
    nsSeparator: ':',
    contextSeparator: '_',
    pluralSeparator: '_',

    // Readable defaults from key path (merged from semantic config)
    defaultValue: (key, _namespace, _language, value) => {
      if (value) return value;
      const parts = key.split('.');
      const lastPart = parts[parts.length - 1];
      return lastPart
        .replace(/([A-Z])/g, ' $1')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase())
        .trim();
    },

    removeUnusedKeys: true,
    warnOnConflicts: true,
    extractFromComments: false,
  },

  types: {
    input: ['public/locales/en/*.json'],
    output: 'src/types/i18next.d.ts',
    resourcesFile: 'src/types/resources.d.ts',
  },

  lint: {
    // _document.tsx: noscript content can't use i18next (requires JS)
    // _app.tsx: "Lasius" is the app name in the AGPL license header comment
    ignore: ['src/pages/_document.tsx', 'src/pages/_app.tsx'],
    // noscript tags can't be translated (JS disabled)
    ignoredTags: ['noscript'],
  },
});
