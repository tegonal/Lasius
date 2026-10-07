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

import { useState } from 'react'

import { Modal } from '~/components/ui/overlays/modal/modal'
import { type ModelsIssueImporterConfigResponse } from '~/services/api/lasius'

import { ProjectMappingsModalContent } from './project-mappings-modal-content'

type Properties = {
  config: ModelsIssueImporterConfigResponse | null
  onClose: () => void
  open: boolean
  selectedOrgId: string
}

export const ProjectMappingsModal = ({ config, onClose, open, selectedOrgId }: Properties) => {
  // The parent clears the config when the modal closes. The last config keeps the content
  // visible while the popup plays its exit transition.
  const [lastConfig, setLastConfig] = useState(config)
  if (config && config !== lastConfig) {
    setLastConfig(config)
  }
  const shownConfig = config ?? lastConfig

  return (
    <Modal onClose={onClose} open={open} size="lg">
      {shownConfig && (
        <ProjectMappingsModalContent
          config={shownConfig}
          // A new config remounts the content, so a reopen during the exit transition fetches again.
          key={shownConfig.id}
          onClose={onClose}
          selectedOrgId={selectedOrgId}
        />
      )}
    </Modal>
  )
}
