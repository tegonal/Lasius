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
import 'styles/globals.css'
import { LasiusBackendWebsocketEventHandler } from 'components/features/system/lasiusBackendWebsocketEventHandler'
import { LasiusBackendWebsocketStatus } from 'components/features/system/lasiusBackendWebsocketStatus'
import { LasiusTOSCheck } from 'components/features/system/lasiusTOSCheck'
import { TokenWatcher } from 'components/features/system/tokenWatcher'
import { BookingProgressBarExplosion } from 'components/ui/feedback/BookingProgressBarExplosion'
import { Error } from 'components/ui/feedback/Error'
import { Toasts } from 'components/ui/feedback/Toasts'
import { HelpDrawer } from 'components/ui/overlays/HelpDrawer'
import { LazyMotion } from 'framer-motion'
import { swrLogger } from 'lib/api/swrRequestLogger'
import { logger } from 'lib/logger'
import { removeAccessibleCookies } from 'lib/utils/auth/removeAccessibleCookies'
import { NextPage } from 'next'
import { SessionProvider } from 'next-auth/react'
import { appWithTranslation } from 'next-i18next'
// import PlausibleProvider from 'next-plausible' // Using custom implementation
import { DefaultSeo } from 'next-seo'
import { AppProps } from 'next/app'
import dynamic from 'next/dynamic'
import Head from 'next/head'
import { SOCIAL_MEDIA_CARD_IMAGE_URL } from 'projectConfig/constants'
import React, { JSX, ReactElement, ReactNode, useEffect } from 'react'
import { useAsync } from 'react-async-hook'
import { resetAllStores } from 'stores/globalActions'
import { SWRConfig } from 'swr'

export type NextPageWithLayout<P = Record<string, unknown>, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement<P>) => ReactNode
}

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout
}

const loadFeatures = () => import('../lib/framerMotionFeatures.js').then((res) => res.default)

// Enable PWA Updater only in browsers and if workbox object is available
const LasiusPwaUpdater =
  typeof window !== 'undefined' && window?.workbox
    ? dynamic(() => import(`../components/features/system/lasiusPwaUpdater`), {
        ssr: false,
      })
    : () => <></>

const App = ({ Component, pageProps }: AppPropsWithLayout): JSX.Element => {
  // Extract auth props from pageProps (they come from getServerSideProps now)
  const { session, profile, fallback, statusCode = 0, ...restPageProps } = pageProps

  // Use the layout defined at the page level, if available
  const getLayout = Component.getLayout ?? ((page) => page)
  const lasiusIsLoggedIn = !!(session?.access_token && profile?.id)

  // Initialize theme on app mount, respecting system preference
  useEffect(() => {
    // Check if there's a saved theme in localStorage
    const savedTheme = localStorage.getItem('theme')

    if (savedTheme) {
      // User has explicitly set a theme preference
      document.documentElement.setAttribute('data-theme', savedTheme)
    } else {
      // No saved preference, check system preference
      if (typeof window !== 'undefined' && window.matchMedia) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        const systemTheme = prefersDark ? 'dark' : 'light'
        document.documentElement.setAttribute('data-theme', systemTheme)
      } else {
        // Fallback to light theme if matchMedia is not supported
        document.documentElement.setAttribute('data-theme', 'light')
      }
    }

    // Listen to system preference changes (only if no saved preference)
    if (!savedTheme && typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

      const handleChange = (e: MediaQueryListEvent) => {
        // Only apply system changes if user hasn't set a manual preference
        if (!localStorage.getItem('theme')) {
          const systemTheme = e.matches ? 'dark' : 'light'
          document.documentElement.setAttribute('data-theme', systemTheme)
        }
      }

      // Modern browsers
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange)
        return () => mediaQuery.removeEventListener('change', handleChange)
      }
      // Legacy browsers
      else if (mediaQuery.addListener) {
        mediaQuery.addListener(handleChange)
        return () => mediaQuery.removeListener(handleChange)
      }
    }
  }, [])

  useAsync(async () => {
    if (!lasiusIsLoggedIn) {
      logger.info('[App][UserNotLoggedIn]')
      resetAllStores()
      await removeAccessibleCookies()
    } else {
      logger.info('[App][UserLoggedIn]')
    }
  }, [lasiusIsLoggedIn])

  return (
    <>
      <SWRConfig
        value={{
          ...(fallback || {}),
          use: [swrLogger as any],
        }}>
        <SessionProvider
          session={session}
          refetchOnWindowFocus={true}
          refetchInterval={10} // Refetch every 10 seconds to catch token refreshes
        >
          <HttpHeaderProvider session={session} />
          <TokenWatcher />
          <Head>
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, shrink-to-fit=no"
            />
            <title>Lasius</title>
          </Head>
          <LazyMotion features={loadFeatures}>
            <GlobalLoading />
            <DefaultSeo
              openGraph={{
                images: [{ url: SOCIAL_MEDIA_CARD_IMAGE_URL }],
              }}
            />
            {statusCode > 302 ? (
              <Error statusCode={statusCode} />
            ) : (
              getLayout(<Component {...restPageProps} />)
            )}
            <BrowserOnlineStatusCheck />
            <LasiusBackendOnlineCheck />
            <LasiusPwaUpdater />
            <BundleVersionCheck />
            <Toasts />
            <HelpDrawer />
            <BookingProgressBarExplosion />
            {lasiusIsLoggedIn && (
              <>
                <BootstrapTasks />
                <LasiusBackendWebsocketStatus />
                <LasiusBackendWebsocketEventHandler />
                <DevInfoBadge />
                <LasiusTOSCheck />
              </>
            )}
          </LazyMotion>
        </SessionProvider>
      </SWRConfig>
    </>
  )
}

// Removed getInitialProps - auth is now handled in each page's getServerSideProps
// using getServerSidePropsWithAuth helper for better performance and type safety

import nextI18NextConfig from '../../next-i18next.config'

export default appWithTranslation(App as any, nextI18NextConfig)
