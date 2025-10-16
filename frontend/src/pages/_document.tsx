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
import React from 'react'
import { APP_SETTINGS_STORAGE_KEY } from 'stores/appSettingsStore'

import type { RuntimeConfig } from 'projectConfig/constants'

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

    // Build runtime config from process.env (server-side only)
    const runtimeConfig: RuntimeConfig = {
      LASIUS_API_URL: process.env.LASIUS_API_URL || '',
      LASIUS_API_WEBSOCKET_URL: process.env.LASIUS_API_WEBSOCKET_URL || '',
      LASIUS_PUBLIC_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      LASIUS_TELEMETRY_PLAUSIBLE_HOST: process.env.LASIUS_TELEMETRY_PLAUSIBLE_HOST || '',
      LASIUS_TELEMETRY_PLAUSIBLE_SOURCE_DOMAIN:
        process.env.LASIUS_TELEMETRY_PLAUSIBLE_SOURCE_DOMAIN || '',
      LASIUS_DEMO_MODE: process.env.LASIUS_DEMO_MODE || 'false',
      LASIUS_TERMSOFSERVICE_VERSION: process.env.LASIUS_TERMSOFSERVICE_VERSION || '',
      LASIUS_VERSION: process.env.LASIUS_VERSION || 'dev',
      ENVIRONMENT: process.env.ENVIRONMENT || 'development',
    }

    return { ...initialProps, locale, runtimeConfig }
  }

  render() {
    // Type assertion to access custom props
    const { locale, runtimeConfig } = this.props as any

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
          <meta name="lasius-version" content={runtimeConfig?.LASIUS_VERSION || 'dev'} />
          <meta name="environment" content={runtimeConfig?.ENVIRONMENT || 'development'} />
          {/* Inject runtime config into window object */}
          <script
            dangerouslySetInnerHTML={{
              __html: `window.ENV = ${JSON.stringify(runtimeConfig || {})};`,
            }}
          />
          {/* Script to initialize DaisyUI/Tailwind theme before render to avoid FOUC */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  try {
                    var savedTheme = null;

                    // Read theme from Zustand persist store
                    try {
                      var persistedState = localStorage.getItem('${APP_SETTINGS_STORAGE_KEY}');
                      if (persistedState) {
                        var parsed = JSON.parse(persistedState);
                        savedTheme = parsed.state && parsed.state.theme;
                      }
                    } catch (e) {
                      // Ignore parsing errors
                    }

                    // Apply theme based on user preference
                    if (savedTheme && savedTheme !== 'system') {
                      // User explicitly chose light or dark
                      document.documentElement.setAttribute('data-theme', savedTheme);
                    } else {
                      // User chose 'system' or no preference - use system preference
                      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                        document.documentElement.setAttribute('data-theme', 'dark');
                      } else {
                        document.documentElement.setAttribute('data-theme', 'light');
                      }
                    }
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
