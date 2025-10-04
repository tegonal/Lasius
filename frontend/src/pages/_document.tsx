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

import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME } from 'lib/config/locales'
import NextDocument, { DocumentContext, Head, Html, Main, NextScript } from 'next/document'
import { BUILD_ID, ENVIRONMENT } from 'projectConfig/constants'
import React from 'react'

class MyDocument extends NextDocument {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await NextDocument.getInitialProps(ctx)
    // Without i18n config, we must read locale from cookie or header
    const locale =
      (ctx.req?.headers['x-middleware-request-locale'] as string) ||
      ctx.req?.headers.cookie
        ?.split(';')
        .find((c) => c.trim().startsWith(`${LOCALE_COOKIE_NAME}=`))
        ?.split('=')[1]
        ?.trim() ||
      DEFAULT_LOCALE

    return { ...initialProps, locale }
  }

  render() {
    // Type assertion to access locale from props
    const { locale } = this.props as any

    return (
      <Html lang={locale}>
        <Head>
          <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
          <meta name="color-scheme" content="dark light" />
          <link rel="manifest" href="/manifest.json" />
          <meta name="application-name" content="Lasius Timetracking" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="Lasius Timetracking" />
          <meta name="description" content="Lasius Timetracking by https://tegonal.com" />
          <link rel="icon" type="image/png" href="/icon-16x16.png" sizes="16x16" />
          <link rel="icon" type="image/png" href="/icon-32x32.png" sizes="32x32" />
          <link rel="icon" type="image/png" href="/icon-32x32.png" sizes="96x96" />
          <link rel="apple-touch-icon" href="/icon-310x310.png" />
          <link rel="apple-touch-icon" sizes="180x180" href="/icon-310x310.png" />
          <link rel="apple-touch-icon" sizes="152x152" href="/icon-310x310.png" />
          <link rel="apple-touch-icon" sizes="167x167" href="/icon-310x310.png" />
          <meta httpEquiv="X-UA-Compatible" content="IE=Edge,chrome=1" />
          <meta name="build-id" content={`${BUILD_ID}`} />
          <meta name="environment" content={`${ENVIRONMENT}`} />
          {/* Script to initialize DaisyUI/Tailwind theme before render to avoid FOUC */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() { 
                  try {
                    // Check for saved theme in localStorage
                    var savedTheme = localStorage.getItem('theme');

                    // If no saved theme, check for Theme-UI mode
                    if (!savedTheme) {
                      var themeUIMode = localStorage.getItem('theme-ui-color-mode');
                      if (themeUIMode === 'dark') {
                        savedTheme = 'dark';
                      } else if (themeUIMode === 'light') {
                        savedTheme = 'light';
                      }
                    }

                    // If still no theme, check system preference
                    if (!savedTheme) {
                      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                        savedTheme = 'dark';
                      } else {
                        savedTheme = 'light';
                      }
                    }

                    // Apply the theme
                    document.documentElement.setAttribute('data-theme', savedTheme);
                  } catch (e) {
                    // Fallback to light theme if anything goes wrong
                    document.documentElement.setAttribute('data-theme', 'light');
                  }
                })();
              `,
            }}
          />
        </Head>
        <body id="body">
          <noscript>
            <p>Please enable JavaScript in your browser settings and reload this page.</p>
          </noscript>
          <Main />
          <div id="modal" />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument
