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

import { LogOutIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  data,
  Form,
  href,
  Link,
  Outlet,
  type ShouldRevalidateFunctionArgs,
} from 'react-router'

import { Button } from '~/components/primitives/buttons/button'
import { Logo } from '~/components/ui/icons/logo'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { TegonalFooter } from '~/components/ui/navigation/tegonal-footer'
import { TokenWatcher } from '~/features/auth/components/token-watcher'
import { BookingCurrent } from '~/features/bookings/components/booking-current'
import { CalendarWeek } from '~/features/calendar/components/calendar-week'
import { HelpButton } from '~/features/help/components/help-button'
import { MobileFloatingActionButton } from '~/features/navigation/components/mobile-floating-action-button'
import { OrgSwitcher } from '~/features/organisation/components/org-switcher'
import { useOrganisation } from '~/features/organisation/hooks/use-organisation'
import { DevInfoBadge } from '~/features/system/components/dev-info-badge'
import { HealthMonitor } from '~/features/system/components/health-monitor'
import { WebSocketEventHandler } from '~/features/system/websocket/websocket-event-handler'
import { getDeduplicatedUserProfile } from '~/lib/organisation-helpers.server'
import { getUserBookingCurrent } from '~/services/api/lasius/user-bookings/user-bookings'
import {
  authHeaders,
  mergeAuthHeaders,
  requireUser,
} from '~/services/auth/auth-helpers.server'

import { type Route } from './+types/app-layout'

/** Skip revalidation for same-page navigations, but allow action-triggered revalidation */
export const shouldRevalidate = ({
  currentUrl,
  defaultShouldRevalidate,
  formMethod,
  nextUrl,
}: ShouldRevalidateFunctionArgs) => {
  if (formMethod) {
    return defaultShouldRevalidate
  }
  if (currentUrl.pathname === nextUrl.pathname) {
    return false
  }
  return defaultShouldRevalidate
}

export const loader = async ({ request }: Route.LoaderArgs) => {
  const auth = await requireUser(request)
  const headers = authHeaders(auth.session)
  const [profile, currentBookingRes] = await Promise.all([
    getDeduplicatedUserProfile({ headers }),
    getUserBookingCurrent({ headers }),
  ])
  return data(
    {
      currentBooking: currentBookingRes.data,
      tokenIssuer: auth.session.tokenIssuer,
      user: profile.data,
      websocketUrl: process.env.LASIUS_API_WEBSOCKET_URL || '',
    },
    { headers: mergeAuthHeaders(auth) },
  )
}

export default function AppLayout({ loaderData }: Route.ComponentProps) {
  const { t } = useTranslation('common')
  const { selectedOrganisationId } = useOrganisation()
  const hasActiveBooking = Boolean(loaderData.currentBooking?.booking)

  return (
    <div className="container mx-auto grid size-full grid-rows-[116px_auto] gap-0 md:grid-rows-[148px_auto] md:pb-4">
      {/* Desktop header */}
      <div className="hidden md:block">
        <section className="h-full w-full overflow-visible">
          <div className="grid h-full w-full grid-cols-[minmax(200px,310px)_minmax(max-content,auto)_minmax(200px,310px)] gap-0 overflow-visible 2xl:grid-cols-[minmax(200px,340px)_minmax(max-content,auto)_minmax(200px,340px)]">
            <div className="hover:text-info flex cursor-pointer items-center justify-start gap-8 pl-8">
              <Link to={href('/')}>
                <Logo />
              </Link>
            </div>

            <div className="flex h-full w-full items-center justify-center gap-8">
              <CalendarWeek organisationId={selectedOrganisationId} />
            </div>

            <div className="flex items-center justify-end gap-2 pr-8">
              <OrgSwitcher />
              <HelpButton />
              <Form action="/logout" method="post">
                <Button
                  aria-label={t('auth.actions.signOut', {
                    defaultValue: 'Sign out',
                  })}
                  data-testid="auth-logout-btn"
                  fullWidth={false}
                  shape="circle"
                  variant="ghost"
                >
                  <LucideIcon icon={LogOutIcon} size={20} />
                </Button>
              </Form>
            </div>
          </div>
        </section>
      </div>

      {/* Mobile header — matches original: Calendar or BookingCurrent, no Logo/Logout */}
      <div className="overflow-hidden md:hidden">
        <section className="flex h-full w-full items-center gap-2 overflow-hidden">
          <div className="min-w-0 flex-1 overflow-hidden">
            {hasActiveBooking ? (
              <BookingCurrent
                currentBooking={loaderData.currentBooking}
                selectedOrgId={selectedOrganisationId}
              />
            ) : (
              <CalendarWeek organisationId={selectedOrganisationId} />
            )}
          </div>
        </section>
      </div>

      {/* Content area — single Outlet for unique test IDs */}
      <div className="bg-base-200 border-base-content/20 h-full w-full overflow-hidden md:flex md:flex-col md:rounded-xl md:border md:shadow-2xl">
        <div className="h-full w-full overflow-auto">
          <Outlet />
        </div>

        {/* Desktop footer */}
        <footer className="border-base-content/20 bg-base-100 hidden items-center justify-between border-t px-3 py-2 md:flex">
          <TegonalFooter variant="compact" />
        </footer>
      </div>

      <MobileFloatingActionButton />
      <DevInfoBadge />
      <TokenWatcher />
      <WebSocketEventHandler />
      <HealthMonitor />
    </div>
  )
}
