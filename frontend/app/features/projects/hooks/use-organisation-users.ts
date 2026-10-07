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

import { useCallback, useEffect, useState } from 'react'

import { type ModelsUserStub } from '~/services/api/lasius'
import { useGetOrganisationUserList } from '~/services/api/lasius-hooks/organisations/organisations'

/** Loads the users of an organisation, and loads them again when `orgId` changes. */
export const useOrganisationUsers = (orgId: string) => {
  const [orgUsers, setOrgUsers] = useState<ModelsUserStub[]>([])

  const orgUserListApi = useGetOrganisationUserList({
    onSuccess: useCallback((data: ModelsUserStub[]) => {
      setOrgUsers(Array.isArray(data) ? data : [])
    }, []),
  })

  const submitOrgUserList = orgUserListApi.submit
  useEffect(() => {
    submitOrgUserList({ orgId })
  }, [orgId, submitOrgUserList])

  return { isLoading: orgUserListApi.isLoading, orgUsers }
}
