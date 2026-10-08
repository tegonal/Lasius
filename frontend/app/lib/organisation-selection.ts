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

import { type ModelsUser } from '~/services/api/lasius'
import { type ModelsEntityReference } from '~/services/api/lasius/modelsEntityReference'
import { type ModelsUserOrganisation } from '~/services/api/lasius/modelsUserOrganisation'
import { ModelsUserOrganisationRole } from '~/services/api/lasius/modelsUserOrganisationRole'

/** The reference of a project in any organisation of the user, also of an inactive project. */
export function findProjectReference(
  organisations: ModelsUserOrganisation[] | undefined,
  projectId: string,
): ModelsEntityReference | undefined {
  if (!projectId) return undefined
  return (organisations ?? [])
    .flatMap((organisation) => organisation.projects)
    .find((project) => project.projectReference.id === projectId)?.projectReference
}

/** The organisation values that useOrganisation returns. A missing id or key is an empty text. */
export function getOrganisationState(
  user: Pick<ModelsUser, 'organisations' | 'settings'> | undefined,
) {
  const selectedOrganisation = selectOrganisation(user)
  return {
    isAdministrator:
      selectedOrganisation?.role === ModelsUserOrganisationRole.OrganisationAdministrator,
    organisations: user?.organisations ?? [],
    selectedOrganisation,
    selectedOrganisationId: selectedOrganisation?.organisationReference.id ?? '',
    selectedOrganisationKey: selectedOrganisation?.organisationReference?.key ?? '',
  }
}

/**
 * The selected organisation of a user: the last selected one, else the private one, else the first.
 * A last selected organisation that the user no longer belongs to is ignored. The server loaders and
 * the client hooks share this rule, so both always select the same organisation.
 */
export function selectOrganisation(
  user: Pick<ModelsUser, 'organisations' | 'settings'> | undefined,
): ModelsUserOrganisation | undefined {
  const organisations = user?.organisations ?? []
  const lastSelectedId = user?.settings?.lastSelectedOrganisation?.id
  return (
    organisations.find((o) => o.organisationReference.id === lastSelectedId) ??
    organisations.find((o) => o.private) ??
    organisations[0]
  )
}
