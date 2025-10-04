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

import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'

export const config = {
  runtime: 'edge',
}

export default async function handler(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const title = searchParams.get('title') || 'Lasius'
    const subtitle = searchParams.get('subtitle') || 'Open source time tracking for teams'

    // Fetch Roboto font
    const fontDataRegular = await fetch(
      new URL('../../../public/fonts/roboto-v29-latin-ext_latin-regular.woff', import.meta.url),
    ).then((res) => res.arrayBuffer())

    const fontDataBold = await fetch(
      new URL('../../../public/fonts/roboto-v29-latin-ext_latin-700.woff', import.meta.url),
    ).then((res) => res.arrayBuffer())

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0F1916',
            backgroundImage: 'linear-gradient(135deg, #0F1916 0%, #1a2a25 50%, #0F1916 100%)',
          }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '80px',
            }}>
            <h1
              style={{
                fontSize: 72,
                fontWeight: 700,
                color: '#D4FF66',
                marginBottom: 20,
                textAlign: 'center',
                fontFamily: 'Roboto',
              }}>
              {title}
            </h1>
            <p
              style={{
                fontSize: 36,
                color: '#FAFAFA',
                textAlign: 'center',
                fontFamily: 'Roboto',
                fontWeight: 400,
                maxWidth: 800,
              }}>
              {subtitle}
            </p>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: 'Roboto',
            data: fontDataRegular,
            weight: 400,
            style: 'normal',
          },
          {
            name: 'Roboto',
            data: fontDataBold,
            weight: 700,
            style: 'normal',
          },
        ],
      },
    )
  } catch (e) {
    console.error(e)
    return new Response('Failed to generate image', { status: 500 })
  }
}
