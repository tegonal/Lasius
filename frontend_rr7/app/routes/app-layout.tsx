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
import { Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { data, Form, href, Link, Outlet } from 'react-router'

import { DevInfoBadge } from '~/components/features/system/dev-info-badge'
import { Button } from '~/components/primitives/buttons/button'
import { Logo } from '~/components/ui/icons/logo'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { TegonalFooter } from '~/components/ui/navigation/tegonal-footer'
import { getUserProfile } from '~/services/api/lasius/user/user'
import {
	authHeaders,
	mergeAuthHeaders,
	requireUser,
} from '~/services/auth/auth-helpers.server'

import { type Route } from './+types/app-layout'

export const loader = async ({ request }: Route.LoaderArgs) => {
	const auth = await requireUser(request)
	const profile = await getUserProfile({
		headers: authHeaders(auth.session),
	})
	return data(
		{
			user: profile.data,
			websocketUrl: process.env.LASIUS_API_WEBSOCKET_URL || '',
		},
		{ headers: mergeAuthHeaders(auth) },
	)
}

export default function AppLayout(_props: Route.ComponentProps) {
	const { t } = useTranslation('common')

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
							{/* Center content placeholder: BookingCurrent / CalendarWeek */}
						</div>

						<div className="flex items-center justify-end gap-2 pr-8">
							{/* SelectUserOrganisation placeholder */}
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

			{/* Mobile header */}
			<div className="overflow-hidden md:hidden">
				<section className="flex h-full w-full items-center justify-between px-4">
					<Link to={href('/')}>
						<Logo size="sm" />
					</Link>
					<Form action="/logout" method="post">
						<Button
							aria-label={t('auth.actions.signOut', {
								defaultValue: 'Sign out',
							})}
							data-testid="auth-logout-btn-mobile"
							fullWidth={false}
							shape="circle"
							size="sm"
							variant="ghost"
						>
							<LucideIcon icon={LogOutIcon} size={18} />
						</Button>
					</Form>
				</section>
			</div>

			{/* Desktop content area */}
			<div className="bg-base-200 border-base-content/20 hidden h-full w-full overflow-hidden rounded-xl border shadow-2xl md:flex md:flex-col">
				<section className="h-full w-full overflow-auto">
					<div className="grid size-full grid-cols-[17rem_auto_18rem] overflow-auto lg:grid-cols-[18rem_auto_19rem] xl:grid-cols-[19rem_auto_20rem] 2xl:grid-cols-[19rem_auto_24rem]">
						{/* Left column: navigation sidebar */}
						<div className="h-full w-full rounded-tl-xl">
							{/* NavigationMenuTabs placeholder */}
						</div>

						{/* Center: main content */}
						<Suspense
							fallback={
								<div className="flex h-full items-center justify-center">
									<span className="loading loading-spinner loading-lg text-primary" />
								</div>
							}
						>
							<Outlet />
						</Suspense>

						{/* Right column placeholder */}
						<div className="border-base-100 bg-base-200 text-base-content flex h-full w-full overflow-auto rounded-tr-xl border-l" />
					</div>
				</section>

				{/* Desktop footer */}
				<footer className="border-base-content/20 bg-base-100 flex items-center justify-between border-t px-3 py-2">
					<TegonalFooter variant="compact" />
				</footer>
			</div>

			{/* Mobile content area */}
			<section className="bg-base-200 h-full w-full overflow-hidden md:hidden">
				<Suspense
					fallback={
						<div className="flex h-full items-center justify-center">
							<span className="loading loading-spinner loading-lg text-primary" />
						</div>
					}
				>
					<Outlet />
				</Suspense>
			</section>

			<DevInfoBadge />
		</div>
	)
}
