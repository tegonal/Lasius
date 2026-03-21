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

import { useFetcher, useRouteLoaderData } from 'react-router'

import { type ModelsEntityReference } from '~/services/api/lasius/modelsEntityReference'
import { type ModelsUser } from '~/services/api/lasius/modelsUser'
import { type ModelsUserOrganisation } from '~/services/api/lasius/modelsUserOrganisation'
import { ModelsUserOrganisationRole } from '~/services/api/lasius/modelsUserOrganisationRole'

/**
 * Custom hook for managing organisation selection and organisation-related data.
 * Reads org data from the app-layout loader and derives selection from user settings.
 *
 * In the RR7 version, all org state comes from the layout loader — no Zustand store.
 * Switching organisation is done via a fetcher action to the org-switch resource route.
 *
 * @returns Object containing:
 *   - selectedOrganisationId: ID of the currently selected organisation
 *   - selectedOrganisationKey: Key/slug of the selected organisation
 *   - selectedOrganisation: Complete selected organisation object
 *   - organisations: Array of all organisations the user belongs to
 *   - setSelectedOrganisation: Function to change the active organisation
 *   - isAdministrator: Boolean indicating if user is admin of selected org
 */
export const useOrganisation = () => {
	const loaderData = useRouteLoaderData('routes/app-layout') as
		| undefined
		| { user: ModelsUser; websocketUrl: string }

	const user = loaderData?.user
	const organisations: ModelsUserOrganisation[] = user?.organisations ?? []
	const settings = user?.settings

	// Derive selected org: settings > private org > first org
	const selectedOrganisationId =
		settings?.lastSelectedOrganisation?.id ??
		organisations.find((o) => o.private)?.organisationReference.id ??
		organisations[0]?.organisationReference.id ??
		''

	const selectedOrganisation = organisations.find(
		(o) => o.organisationReference.id === selectedOrganisationId,
	)

	const selectedOrganisationKey =
		selectedOrganisation?.organisationReference?.key ?? ''

	const isAdministrator =
		selectedOrganisation?.role ===
		ModelsUserOrganisationRole.OrganisationAdministrator

	// Use fetcher to switch org without full navigation
	const fetcher = useFetcher()

	const setSelectedOrganisation = (
		organisationReference: ModelsEntityReference,
	) => {
		if (organisationReference) {
			void fetcher.submit(
				{
					organisationId: organisationReference.id,
					organisationKey: organisationReference.key,
				},
				{ action: '/api/org-switch', method: 'post' },
			)
		}
	}

	return {
		isAdministrator,
		organisations,
		selectedOrganisation,
		selectedOrganisationId,
		selectedOrganisationKey,
		setSelectedOrganisation,
	}
}
