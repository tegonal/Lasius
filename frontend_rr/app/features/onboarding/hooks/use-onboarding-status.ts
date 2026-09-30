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

import { useOrganisation } from '~/features/organisation/hooks/use-organisation'
import { useProjects } from '~/features/projects/hooks/use-projects'

/**
 * Derives onboarding checklist completion status from existing layout loader data.
 * No extra API calls — reads from useOrganisation and useProjects hooks.
 */
export const useOnboardingStatus = () => {
  const { organisations, selectedOrganisation } = useOrganisation()
  const { userProjects } = useProjects()

  const hasMultipleOrganisations = organisations.length > 1

  const hasProjects = userProjects.length > 0

  const hasWorkingHours = (() => {
    const hours = selectedOrganisation?.plannedWorkingHours
    if (!hours) return false
    const total =
      (hours.monday || 0) +
      (hours.tuesday || 0) +
      (hours.wednesday || 0) +
      (hours.thursday || 0) +
      (hours.friday || 0) +
      (hours.saturday || 0) +
      (hours.sunday || 0)
    return total > 0
  })()

  return {
    hasMultipleOrganisations,
    hasProjects,
    hasWorkingHours,
  }
}
