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

import { type SelectOption } from '~/components/ui/forms/input/select'
import { type SchemaTranslationFunction } from '~/lib/i18n-types'
import { type ModelsUserOrganisationRole, type ModelsUserProjectRole } from '~/services/api/lasius'

export type RoleScope = 'organisation' | 'project'

type AssignableRole = ModelsUserOrganisationRole | ModelsUserProjectRole

const ROLES_BY_SCOPE = {
  organisation: ['OrganisationMember', 'OrganisationAdministrator'],
  project: ['ProjectMember', 'ProjectAdministrator'],
} as const satisfies Record<RoleScope, readonly [AssignableRole, AssignableRole]>

export const getDefaultRole = (scope: RoleScope): AssignableRole => ROLES_BY_SCOPE[scope][0]

export const getRoleLabel = (role: AssignableRole, t: SchemaTranslationFunction): string => {
  switch (role) {
    case 'OrganisationAdministrator':
    case 'ProjectAdministrator': {
      return t('common:roles.administrator', { defaultValue: 'Administrator' })
    }
    case 'OrganisationMember':
    case 'ProjectMember': {
      return t('common:roles.member', { defaultValue: 'Member' })
    }
  }
}

export const getRoleOptions = (scope: RoleScope, t: SchemaTranslationFunction): SelectOption[] =>
  ROLES_BY_SCOPE[scope].map((role) => ({ label: getRoleLabel(role, t), value: role }))
