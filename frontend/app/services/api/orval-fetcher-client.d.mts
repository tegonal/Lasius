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

// tsconfig has no allowJs, so the unit test reads the types of the Orval generator from this file.

type GeneratedHook = {
  implementation: string
  imports: { name: string }[]
}

type GeneratorDependency = {
  dependency: string
  exports: { name: string; values: boolean }[]
}

type GeneratorProperty = {
  definition: string
  name: string
  type: string
}

type GeneratorVerbOptions = {
  body?: { definition: string }
  operationName: string
  props: GeneratorProperty[]
  queryParams?: { schema: { name: string } }
  response: { definition: { success: string } }
  verb: string
}

export declare const fetcherClientBuilder: () => {
  client: (verbOptions: GeneratorVerbOptions, options: { route: string }) => GeneratedHook
  dependencies: () => GeneratorDependency[]
  header: () => string
}
