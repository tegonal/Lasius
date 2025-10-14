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

import { BootstrapTasks } from 'components/features/system/bootstrapTasks'
import { BrowserOnlineStatusCheck } from 'components/features/system/browserOnlineStatusCheck'
import { BundleVersionCheck } from 'components/features/system/bundleVersionCheck'
import { DevInfoBadge } from 'components/features/system/devInfoBadge'
import { GlobalLoading } from 'components/features/system/globalLoading'
import { HttpHeaderProvider } from 'components/features/system/httpHeaderProvider'
import { LasiusBackendOnlineCheck } from 'components/features/system/lasiusBackendOnlineCheck'
import { LasiusBackendWebsocketEventHandler } from 'components/features/system/lasiusBackendWebsocketEventHandler'
import 'styles/globals.css'
import { LasiusTOSCheck } from 'components/features/system/lasiusTOSCheck'
import { TokenWatcher } from 'components/features/system/tokenWatcher'
import { TopLoadingBar } from 'components/features/system/topLoadingBar'
import { BookingProgressBarExplosion } from 'components/ui/feedback/BookingProgressBarExplosion'
import { Error } from 'components/ui/feedback/Error'
import { Toasts } from 'components/ui/feedback/Toasts'
import { HelpDrawer } from 'components/ui/overlays/HelpDrawer'
import { LazyMotion } from 'framer-motion'
import { swrLogger } from 'lib/api/swrRequestLogger'
import { useThemeInitialization } from 'lib/hooks/useThemeInitialization'
import { logger } from 'lib/logger'
import { removeAccessibleCookies } from 'lib/utils/auth/removeAccessibleCookies'
import { SessionProvider } from 'next-auth/react'
import { appWithTranslation } from 'next-i18next'
// import PlausibleProvider from 'next-plausible' // Using custom implementation
import { DefaultSeo } from 'next-seo'
import { AppProps } from 'next/app'
import Head from 'next/head'
import { getIsDev, getLasiusPublicUrl, IS_SERVER } from 'projectConfig/constants'
import React, { JSX, useEffect } from 'react'
import { resetAllStores } from 'stores/globalActions'
import { SWRConfig } from 'swr'

import nextI18NextConfig from '../../next-i18next.config'

const loadFeatures = () => import('../lib/framerMotionFeatures.js').then((res) => res.default)

const App = ({ Component, pageProps }: AppProps): JSX.Element => {
  // Extract auth props from pageProps (they come from getServerSideProps now)
  const { session, profile, fallback, statusCode = 0, ...restPageProps } = pageProps

  const hasValidSession = !!(session?.access_token && profile?.id)

  // Initialize theme on app mount, respecting system preference
  useThemeInitialization()

  useEffect(() => {
    if (!hasValidSession) {
      logger.info('[App][UserNotLoggedIn]')
      resetAllStores()
      void removeAccessibleCookies()
    } else {
      logger.info('[App][UserLoggedIn]')
    }
  }, [hasValidSession])

  return (
    <>
      <SWRConfig
        value={{
          ...(fallback || {}),
          use: [swrLogger as any],
        }}>
        <SessionProvider session={session} refetchOnWindowFocus={true} refetchInterval={0}>
          <Head>
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, shrink-to-fit=no"
            />
            <title>Lasius</title>
          </Head>
          <LazyMotion features={loadFeatures}>
            <DefaultSeo
              titleTemplate="%s | Lasius"
              defaultTitle="Lasius - Open source time tracking for teams"
              description="Lasius is an open source time tracking application for teams. Track your time, manage projects, and collaborate with your team."
              openGraph={{
                type: 'website',
                siteName: 'Lasius',
                title: 'Lasius - Open source time tracking for teams',
                description:
                  'Lasius is an open source time tracking application for teams. Track your time, manage projects, and collaborate with your team.',
                images: [
                  {
                    url: `${IS_SERVER ? process.env.NEXTAUTH_URL || 'http://localhost:3000' : getLasiusPublicUrl()}/api/og?title=${encodeURIComponent('Lasius')}&subtitle=${encodeURIComponent('Open source time tracking for teams')}`,
                    width: 1200,
                    height: 630,
                    alt: 'Lasius - Open source time tracker for teams',
                  },
                ],
              }}
              twitter={{
                handle: '@tegonal',
                site: '@tegonal',
                cardType: 'summary_large_image',
              }}
            />
            {statusCode > 302 ? (
              <Error statusCode={statusCode} />
            ) : (
              <Component {...restPageProps} />
            )}
            <BrowserOnlineStatusCheck />
            <LasiusBackendOnlineCheck />
            <BundleVersionCheck />
            <Toasts />
            <HelpDrawer />
            {hasValidSession && (
              <>
                <BookingProgressBarExplosion />
                <TopLoadingBar />
                <GlobalLoading />
                <HttpHeaderProvider />
                <TokenWatcher />
                <BootstrapTasks />
                <LasiusBackendWebsocketEventHandler />
                <LasiusTOSCheck />
              </>
            )}
            {getIsDev() && <DevInfoBadge />}
          </LazyMotion>
        </SessionProvider>
      </SWRConfig>
    </>
  )
}

// Removed getInitialProps - auth is now handled in each page's getServerSideProps
// using getServerSidePropsWithAuth helper for better performance and type safety

export default appWithTranslation(App as any, nextI18NextConfig)
