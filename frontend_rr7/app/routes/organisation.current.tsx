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

import { useEffect, useState } from 'react'
import { data } from 'react-router'

import {
  ColumnCenter,
  ColumnRight,
  innerGridClasses,
} from '~/components/ui/layouts/layout-columns'
import { ScrollArea } from '~/components/ui/layouts/scroll-area'
import { Modal } from '~/components/ui/overlays/modal'
import { OrganisationAddUpdateForm } from '~/features/organisation/components/organisation-add-update-form'
import { OrganisationDetail } from '~/features/organisation/components/organisation-detail'
import { OrganisationRightColumn } from '~/features/organisation/components/organisation-right-column'
import { OrganisationStats } from '~/features/organisation/components/organisation-stats'
import { useOrganisation } from '~/features/organisation/hooks/use-organisation'
import { ManageUserInviteByEmailForm } from '~/features/projects/components/manage-user-invite-by-email-form'
import { type ModelsUserStub } from '~/services/api/lasius'
import { useGetOrganisationUserList } from '~/services/api/lasius-hooks/organisations/organisations'
import { getOrganisationUserList } from '~/services/api/lasius/organisations/organisations'
import { getUserProfile } from '~/services/api/lasius/user/user'
import {
  authHeaders,
  mergeAuthHeaders,
  requireUser,
} from '~/services/auth/auth-helpers.server'

import { type Route } from './+types/organisation.current'

export const loader = async ({ request }: Route.LoaderArgs) => {
  const auth = await requireUser(request)
  const headers = authHeaders(auth.session)

  const profile = await getUserProfile({ headers })
  const user = profile.data

  const organisations = user.organisations ?? []
  const selectedOrgId =
    user.settings?.lastSelectedOrganisation?.id ??
    organisations.find((o) => o.private)?.organisationReference.id ??
    organisations[0]?.organisationReference.id ??
    ''

  const usersResponse = await getOrganisationUserList(selectedOrgId, {
    headers,
  })

  return data(
    {
      users: usersResponse.data,
    },
    { headers: mergeAuthHeaders(auth) },
  )
}

const OrganisationCurrentPage = ({ loaderData }: Route.ComponentProps) => {
  const { selectedOrganisationId } = useOrganisation()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isUpdateOpen, setIsUpdateOpen] = useState(false)
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [users, setUsers] = useState<ModelsUserStub[]>(loaderData.users)

  const userListApi = useGetOrganisationUserList({
    onSuccess: (responseData) => {
      const list = Array.isArray(responseData) ? responseData : []
      setUsers(list)
    },
  })

  // Sync loader data on initial render & org switch
  useEffect(() => {
    setUsers(loaderData.users)
  }, [loaderData.users])

  const handleRefresh = () => {
    userListApi.submit({ orgId: selectedOrganisationId })
  }

  const handleInviteSave = () => {
    setIsInviteOpen(false)
    handleRefresh()
  }

  return (
    <>
      <div className={innerGridClasses} data-testid="org-current-page">
        <ColumnCenter>
          <ScrollArea className="bg-base-100 flex-1 overflow-y-auto">
            <OrganisationStats
              memberCount={users.length}
              onCreate={() => setIsAddOpen(true)}
              onEdit={() => setIsUpdateOpen(true)}
              onInvite={() => setIsInviteOpen(true)}
            />
            <div className="pt-4">
              <OrganisationDetail onRefresh={handleRefresh} users={users} />
            </div>
          </ScrollArea>
        </ColumnCenter>
        <ColumnRight>
          <ScrollArea className="flex-1 overflow-y-auto">
            <OrganisationRightColumn />
          </ScrollArea>
        </ColumnRight>
      </div>
      <Modal onClose={() => setIsAddOpen(false)} open={isAddOpen}>
        <OrganisationAddUpdateForm
          mode="add"
          onCancel={() => setIsAddOpen(false)}
          onSave={() => setIsAddOpen(false)}
        />
      </Modal>
      <Modal onClose={() => setIsUpdateOpen(false)} open={isUpdateOpen}>
        <OrganisationAddUpdateForm
          mode="update"
          onCancel={() => setIsUpdateOpen(false)}
          onSave={() => setIsUpdateOpen(false)}
        />
      </Modal>
      <Modal onClose={() => setIsInviteOpen(false)} open={isInviteOpen}>
        <ManageUserInviteByEmailForm
          onCancel={() => setIsInviteOpen(false)}
          onSave={handleInviteSave}
          organisation={selectedOrganisationId}
        />
      </Modal>
    </>
  )
}

export default OrganisationCurrentPage
