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

import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRevalidator } from 'react-router'

import { useToast } from '~/components/ui/feedback/use-toast'
import { Modal } from '~/components/ui/overlays/modal/modal'
import { ModalBody } from '~/components/ui/overlays/modal/modal-body'
import { ModalCloseButton } from '~/components/ui/overlays/modal/modal-close-button'
import { ModalHeader } from '~/components/ui/overlays/modal/modal-header'
import { ModalHelpButton } from '~/features/help/components/help-button'
import { WizardFooter } from '~/features/integrations/components/wizard/wizard-footer'
import { WizardProgress } from '~/features/integrations/components/wizard/wizard-progress'
import { WizardStepContent } from '~/features/integrations/components/wizard/wizard-step-content'
import { useMappingSaveQueue } from '~/features/integrations/hooks/use-mapping-save-queue'
import { useWizardState } from '~/features/integrations/hooks/use-wizard-state'
import { type MappingsByExternalProject } from '~/features/integrations/lib/mapping-helpers'
import {
  flattenMappings,
  getPreviousStep,
  STEP_IDS,
} from '~/features/integrations/lib/wizard-steps'
import { logger } from '~/lib/logger'

type Properties = {
  onClose: () => void
  open: boolean
  selectedOrgId: string
}

export const IssueImporterWizard = ({ onClose, open, selectedOrgId }: Properties) => {
  const { t } = useTranslation('integrations')
  const { addToast } = useToast()
  const revalidator = useRevalidator()
  const wizard = useWizardState()
  const { resetWizard, setCurrentStep, state } = wizard
  const { createdConfig, currentStep, formData } = state

  const [projectMappings, setProjectMappings] = useState<MappingsByExternalProject>({})
  const configFormReference = useRef<HTMLFormElement>(null)

  const handleClose = useCallback(() => {
    resetWizard()
    setProjectMappings({})
    onClose()
  }, [resetWizard, onClose])

  const { isSaving, saveAll } = useMappingSaveQueue({
    availableProjects: state.availableProjects,
    configId: createdConfig?.id,
    importerType: formData.importerType,
    onDone: (isLastSaved) => {
      void revalidator.revalidate()
      if (isLastSaved) {
        addToast({
          message: t('issueImporters.success.configCreated', {
            defaultValue: 'Integration created successfully',
          }),
          type: 'SUCCESS',
        })
      }
      handleClose()
    },
    selectedOrgId,
  })

  const currentStepIndex = STEP_IDS.indexOf(currentStep)

  const handlePrevious = () => {
    const previous = getPreviousStep(currentStep, !!createdConfig)
    if (previous) setCurrentStep(previous)
  }

  const handleNext = () => {
    if (currentStep === 'config') {
      configFormReference.current?.requestSubmit()
      return
    }
    const nextStep = STEP_IDS[currentStepIndex + 1]
    if (nextStep) setCurrentStep(nextStep)
  }

  const handleFinish = () => {
    if (!createdConfig || !formData.importerType) {
      logger.error('[IssueImporterWizard] Cannot save mappings: missing config or importer type')
      return
    }
    const entries = flattenMappings(projectMappings)
    if (entries.length === 0) {
      void revalidator.revalidate()
      handleClose()
      return
    }
    saveAll(entries)
  }

  const modalSize = currentStep === 'config' || currentStep === 'projects' ? 'xl' : 'lg'

  return (
    <Modal onClose={handleClose} open={open} size={modalSize}>
      <ModalCloseButton onClose={handleClose} />
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex-shrink-0 pb-4">
          <ModalHeader
            actionSlot={<ModalHelpButton helpKey="modal-importer-wizard" />}
            className="mb-0">
            {t('issueImporters.wizard.title', { defaultValue: 'Add Integration' })}
          </ModalHeader>
          <WizardProgress currentStepIndex={currentStepIndex} onSelectStep={setCurrentStep} />
        </div>

        <ModalBody className="relative">
          <WizardStepContent
            configFormRef={configFormReference}
            onBack={handlePrevious}
            onMappingsChange={setProjectMappings}
            selectedOrgId={selectedOrgId}
            wizard={wizard}
          />
        </ModalBody>

        {currentStep !== 'test' && (
          <WizardFooter
            currentStepIndex={currentStepIndex}
            isNextDisabled={currentStep === 'platform'}
            isSaving={isSaving}
            onBack={handlePrevious}
            onFinish={handleFinish}
            onNext={handleNext}
          />
        )}
      </div>
    </Modal>
  )
}
