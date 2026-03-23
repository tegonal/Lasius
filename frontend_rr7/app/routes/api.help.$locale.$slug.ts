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

import { compile } from '@mdx-js/mdx'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { data } from 'react-router'

import { type Route } from './+types/api.help.$locale.$slug'

/**
 * Resource route for server-side MDX compilation of help files.
 *
 * Route: /api/help/:locale/:slug
 * Example: /api/help/en/user-home
 *
 * Returns compiled MDX JS string as JSON. Client uses @mdx-js/mdx run() to render.
 * This keeps the MDX compiler out of the client bundle.
 */
export async function loader({ params }: Route.LoaderArgs) {
  const { locale, slug } = params

  if (!locale || !slug) {
    return data({ error: 'Invalid parameters' }, { status: 400 })
  }

  // Sanitize inputs to prevent path traversal
  const safeLocale = locale.replace(/[^a-z-]/g, '')
  const safeSlug = slug.replace(/[^a-z0-9-]/g, '')

  const filePath = join(
    process.cwd(),
    'public',
    'help',
    safeLocale,
    `${safeSlug}.mdx`,
  )

  if (!existsSync(filePath)) {
    return data({ error: 'Help file not found' }, { status: 404 })
  }

  try {
    const mdxText = readFileSync(filePath, 'utf8')

    const compiled = await compile(mdxText, {
      development: false,
      outputFormat: 'function-body',
    })

    return data(
      { code: String(compiled) },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate',
        },
      },
    )
  } catch {
    return data({ error: 'Failed to compile MDX' }, { status: 500 })
  }
}
