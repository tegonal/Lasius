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

import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { DataListField } from '~/components/ui/data-display/data-list/data-list-field'
import { DataListRow } from '~/components/ui/data-display/data-list/data-list-row'
import { MemberNameFields } from '~/components/ui/data-display/member-name-fields'
import { Select } from '~/components/ui/forms/input/select'
import { getRoleOptions } from '~/features/projects/lib/role-labels'
import { untyped } from '~/lib/i18n-types'
import { type ModelsUserStub } from '~/services/api/lasius'

interface AddExistingMemberRowProperties {
  isAdding: boolean
  isDisabled: boolean
  onAdd: () => void
  onRoleChange: (role: string) => void
  role: string
  user: ModelsUserStub
}

export const AddExistingMemberRow = ({
  isAdding,
  isDisabled,
  onAdd,
  onRoleChange,
  role,
  user,
}: AddExistingMemberRowProperties) => {
  const { t } = useTranslation()

  return (
    <DataListRow>
      <MemberNameFields user={user} />
      <DataListField>
        <Select
          onChange={onRoleChange}
          options={getRoleOptions('project', untyped(t))}
          value={role}
        />
      </DataListField>
      <DataListField>
        <Button disabled={isDisabled} fullWidth={false} onClick={onAdd} size="sm" variant="primary">
          {isAdding
            ? t('actions.adding', 'Adding...')
            : t('invitation:addExistingMembers.addButton', 'Add')}
        </Button>
      </DataListField>
    </DataListRow>
  )
}
