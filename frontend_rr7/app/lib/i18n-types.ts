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

import { type Namespace, type TFunction } from 'i18next'

/**
 * Loosely-typed translation function for use in Zod schema factories,
 * helper functions that build dynamic keys, and server-side fallbacks.
 */

export type SchemaTranslationFunction = (
  key: string,
  defaultValue: string | { defaultValue: string },
) => string

/**
 * Erase i18next's branded type so a typed `t` can be passed to schema
 * factories or helper functions that use dynamic keys.
 *
 * Usage: `createSchema(untyped(t))`, `getLabel(type, untyped(t))`
 */

export const untyped =
  (translate: TFunction<Namespace>): SchemaTranslationFunction =>
  (key, defaultValue) =>
    typeof defaultValue === 'string' ? translate(key, defaultValue) : translate(key, defaultValue)
