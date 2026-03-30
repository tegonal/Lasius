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

import { i18nConfig, NAMESPACES } from '~/i18n-config'
import de from '~/locales/de'
import en from '~/locales/en'
import es from '~/locales/es'
import fr from '~/locales/fr'
import it from '~/locales/it'

/** All locale resources — server-only to avoid bundling all languages in the client */
export const resources = { de, en, es, fr, it }

/** Server-side i18n config with resources and cross-namespace fallback */
export const i18nServerConfig = {
  ...i18nConfig,
  /**
   * Allow key lookup across all namespaces. Since all namespaces are eagerly
   * loaded server-side, this lets utility functions and dynamic keys resolve
   * without knowing the source namespace.
   */
  fallbackNS: [...NAMESPACES] as string[],
  resources,
}
