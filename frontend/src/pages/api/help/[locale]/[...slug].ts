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

import fs from 'fs'
import { NextApiRequest, NextApiResponse } from 'next'
import { serialize } from 'next-mdx-remote/serialize'
import path from 'path'

/**
 * API route for server-side MDX compilation of help files.
 * Compiles MDX to JSON on the server, eliminating the need for client-side MDX parsing.
 *
 * Route: /api/help/[locale]/[...slug]
 * Example: /api/help/en/user-home
 *
 * This keeps the MDX compiler (and acorn parser) out of the client bundle.
 */
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { locale, slug } = req.query

  // Validate locale and slug
  if (!locale || typeof locale !== 'string') {
    return res.status(400).json({ error: 'Invalid locale' })
  }

  if (!slug || !Array.isArray(slug)) {
    return res.status(400).json({ error: 'Invalid slug' })
  }

  const fileName = slug.join('/')
  const filePath = path.join(process.cwd(), 'public', 'help', locale, `${fileName}.mdx`)

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Help file not found' })
  }

  try {
    // Read and compile MDX on the server
    const mdxText = fs.readFileSync(filePath, 'utf8')
    const mdxSource = await serialize(mdxText)

    // Cache compiled MDX for 1 hour
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate')

    return res.status(200).json(mdxSource)
  } catch {
    return res.status(500).json({ error: 'Failed to compile MDX' })
  }
}

export default handler
