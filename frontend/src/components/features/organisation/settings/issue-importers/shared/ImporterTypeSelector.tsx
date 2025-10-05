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

import { ImporterTypeIcon } from 'components/features/issue-importers/shared/ImporterTypeIcon'
import {
  getImporterTypeLabel,
  type ImporterType,
} from 'components/features/issue-importers/shared/types'
import { Button } from 'components/primitives/buttons/Button'
import { Modal } from 'components/ui/overlays/modal/Modal'
import { useTranslation } from 'next-i18next'
import React from 'react'

type Props = {
  open: boolean
  onClose: () => void
  onSelect: (type: ImporterType) => void
}

const IMPORTERS: ImporterType[] = ['gitlab', 'jira', 'plane']

export const ImporterTypeSelector: React.FC<Props> = ({ open, onClose, onSelect }) => {
  const { t } = useTranslation('common')

  return (
    <Modal open={open} onClose={onClose}>
      <p className="text-base-content/70 mb-6 text-sm">
        {t('issueImporters.typeSelector.chooseTracker', {
          defaultValue: 'Choose which issue tracker you want to configure:',
        })}
      </p>
      <div className="space-y-3">
        {IMPORTERS.map((type) => (
          <Button
            key={type}
            variant="ghost"
            className="w-full justify-start gap-3 p-4"
            onClick={() => {
              onSelect(type)
              onClose()
            }}>
            <ImporterTypeIcon type={type} className="h-6 w-6" />
            <span className="text-base font-medium">{getImporterTypeLabel(type, t)}</span>
          </Button>
        ))}
      </div>
    </Modal>
  )
}
