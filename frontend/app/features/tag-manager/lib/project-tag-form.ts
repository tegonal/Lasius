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

import { type ModelsProject } from '~/services/api/lasius/modelsProject'
import { type ModelsSimpleTag } from '~/services/api/lasius/modelsSimpleTag'
import { type ModelsTag } from '~/services/api/lasius/modelsTag'
import { type ModelsTagGroup } from '~/services/api/lasius/modelsTagGroup'
import { type ModelsUserProject } from '~/services/api/lasius/modelsUserProject'

/** Splits the booking categories of a project into tag groups and simple tags. */
export const splitBookingCategories = (
  tags: ModelsTag[],
): { groups: ModelsTagGroup[]; simple: ModelsSimpleTag[] } => ({
  groups: tags.filter((tag) => tag.type === 'TagGroup') as ModelsTagGroup[],
  simple: tags.filter((tag) => tag.type === 'SimpleTag') as ModelsSimpleTag[],
})

/**
 * The project id, key and organisation of either project shape. A user project carries no
 * organisation, so the selected organisation applies.
 */
export const resolveProjectReferences = (
  item: ModelsProject | ModelsUserProject,
  selectedOrganisationId: string,
): { organisationId: string; projectId: string; projectKey: string } => {
  const reference = 'projectReference' in item ? item.projectReference : item
  const organisationId =
    'organisationReference' in item
      ? (item as unknown as { organisationReference: { id: string } }).organisationReference.id
      : selectedOrganisationId
  return { organisationId, projectId: reference.id, projectKey: reference.key }
}

export const sortTagGroupsById = (groups: ModelsTagGroup[]): ModelsTagGroup[] =>
  groups.toSorted((a, b) => a.id.localeCompare(b.id))
