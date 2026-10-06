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
import { Modal } from '~/components/ui/overlays/modal/modal'
import { ModalBody } from '~/components/ui/overlays/modal/modal-body'
import { ModalCloseButton } from '~/components/ui/overlays/modal/modal-close-button'
import { ModalHeader } from '~/components/ui/overlays/modal/modal-header'
import { ModalHelpButton } from '~/features/help/components/help-button'
import { ImporterTypeBadge } from '~/features/integrations/components/importer-type-badge'
import { AuditSection } from '~/features/integrations/components/modals/config-info/audit-section'
import { HealthSection } from '~/features/integrations/components/modals/config-info/health-section'
import { InfoRow } from '~/features/integrations/components/modals/config-info/info-row'
import {
  InfoCard,
  InfoSection,
} from '~/features/integrations/components/modals/config-info/info-section'
import { ProjectStatsSection } from '~/features/integrations/components/modals/config-info/project-stats-section'
import { type ModelsIssueImporterConfigResponse } from '~/services/api/lasius'

type Properties = {
  config: ModelsIssueImporterConfigResponse | null
  onClose: () => void
  open: boolean
}

export const ConfigInfoModal = ({ config, onClose, open }: Properties) => {
  const { t } = useTranslation('integrations')

  return (
    <Modal onClose={onClose} open={open} size="lg">
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <ModalCloseButton onClose={onClose} />
        <ModalHeader actionSlot={<ModalHelpButton helpKey="modal-config-info" />} className="mb-0">
          {t('issueImporters.info.title', { defaultValue: 'Configuration Info' })}
        </ModalHeader>

        {config ? (
          <ModalBody>
            <div className="space-y-6">
              <InfoSection
                title={t('issueImporters.info.basicInfo', { defaultValue: 'Basic Information' })}>
                <InfoCard>
                  <dl className="space-y-2">
                    <InfoRow label={t('issueImporters.info.name', { defaultValue: 'Name' })}>
                      {config.name}
                    </InfoRow>
                    <InfoRow label={t('issueImporters.info.type', { defaultValue: 'Type' })}>
                      <ImporterTypeBadge type={config.importerType} />
                    </InfoRow>
                    <InfoRow label={t('issueImporters.info.baseUrl', { defaultValue: 'Base URL' })}>
                      {config.baseUrl}
                    </InfoRow>
                    <InfoRow
                      label={t('issueImporters.info.checkFrequency', {
                        defaultValue: 'Check Frequency',
                      })}>
                      {t('issueImporters.info.checkFrequencyValue', {
                        defaultValue: '{{minutes}} minutes',
                        minutes: Math.round((config.checkFrequency || 0) / 60_000),
                      })}
                    </InfoRow>
                  </dl>
                </InfoCard>
              </InfoSection>

              <HealthSection syncStatus={config.syncStatus} />
              {config.projects.length > 0 && <ProjectStatsSection config={config} />}
              <AuditSection audit={config.audit} />
            </div>
          </ModalBody>
        ) : (
          <p className="text-base-content/60 text-sm">
            {t('issueImporters.info.noConfig', { defaultValue: 'No configuration selected.' })}
          </p>
        )}

        <div className="mt-2">
          <Button className="w-full" onClick={onClose} type="button" variant="secondary">
            {t('actions.close', { defaultValue: 'Close' })}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
