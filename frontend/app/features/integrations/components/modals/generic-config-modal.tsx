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

import { useRef } from 'react'

import { Modal } from '~/components/ui/overlays/modal/modal'
import { GenericConfigForm } from '~/features/integrations/components/modals/generic-config-form'
import { type ModelsIssueImporterConfigResponse } from '~/services/api/lasius/modelsIssueImporterConfigResponse'

type Properties = {
  config: ModelsIssueImporterConfigResponse | null
  onClose: () => void
  open: boolean
  selectedOrgId: string
}

export const GenericConfigModal = ({ config, onClose, open, selectedOrgId }: Properties) => {
  const nameInputReference = useRef<HTMLInputElement>(null)

  if (!config) return null

  // The closed Modal unmounts the form. The key also remounts it for another config, so the
  // form and the connection test always start from a clean state.
  return (
    <Modal initialFocus={nameInputReference} onClose={onClose} open={open} size="xl">
      <GenericConfigForm
        config={config}
        key={config.id}
        nameInputRef={nameInputReference}
        onClose={onClose}
        selectedOrgId={selectedOrgId}
      />
    </Modal>
  )
}
