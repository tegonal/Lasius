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

import { type RefObject } from 'react'

import { ConfigFormStep } from '~/features/integrations/components/wizard/steps/config-form-step'
import { ListProjectsStep } from '~/features/integrations/components/wizard/steps/list-projects-step'
import { SelectPlatformStep } from '~/features/integrations/components/wizard/steps/select-platform-step'
import { TestConnectionStep } from '~/features/integrations/components/wizard/steps/test-connection-step'
import { type useWizardState } from '~/features/integrations/hooks/use-wizard-state'
import { type MappingsByExternalProject } from '~/features/integrations/lib/mapping-helpers'
import { PLATFORM_BASE_URLS } from '~/features/integrations/lib/wizard-steps'

type Wizard = ReturnType<typeof useWizardState>

interface WizardStepContentProperties {
  configFormRef: RefObject<HTMLFormElement | null>
  onBack: () => void
  onMappingsChange: (mappings: MappingsByExternalProject) => void
  selectedOrgId: string
  wizard: Wizard
}

/** Renders the step that the wizard state selects. */
export const WizardStepContent = ({
  configFormRef,
  onBack,
  onMappingsChange,
  selectedOrgId,
  wizard,
}: WizardStepContentProperties) => {
  const { setAvailableProjects, setCreatedConfig, setCurrentStep, state, updateFormData } = wizard
  const { createdConfig, currentStep, formData } = state

  if (currentStep === 'platform') {
    return (
      <SelectPlatformStep
        onSelectPlatform={(type) => {
          updateFormData({ baseUrl: PLATFORM_BASE_URLS[type], importerType: type })
          setCurrentStep('config')
        }}
      />
    )
  }
  const importerType = formData.importerType
  if (!importerType) return null
  if (currentStep === 'config') {
    return (
      <ConfigFormStep
        formData={formData}
        formRef={configFormRef}
        onSubmit={(data) => {
          updateFormData(data)
          setCurrentStep('test')
        }}
        selectedOrgId={selectedOrgId}
      />
    )
  }
  if (currentStep === 'test') {
    return (
      <TestConnectionStep
        existingConfig={createdConfig}
        formData={formData}
        onBack={onBack}
        onConfigCreated={setCreatedConfig}
        onNext={() => setCurrentStep('projects')}
        selectedOrgId={selectedOrgId}
      />
    )
  }
  if (!createdConfig) return null
  return (
    <ListProjectsStep
      configId={createdConfig.id}
      importerType={importerType}
      onMappingsChange={onMappingsChange}
      onProjectsLoaded={setAvailableProjects}
      orgId={selectedOrgId}
    />
  )
}
