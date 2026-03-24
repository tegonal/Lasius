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

import { ArrowLeft, ArrowRight, CheckCircle2, Circle } from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRevalidator } from 'react-router'

import { Button } from '~/components/primitives/buttons/button'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { Modal } from '~/components/ui/overlays/modal/modal'
import {
  ListProjectsStep,
  type MappingWithTagConfig,
} from '~/features/integrations/components/wizard/steps/list-projects-step'
import { SelectPlatformStep } from '~/features/integrations/components/wizard/steps/select-platform-step'
import { TestConnectionStep } from '~/features/integrations/components/wizard/steps/test-connection-step'
import {
  useWizardState,
  type WizardStep,
} from '~/features/integrations/hooks/use-wizard-state'
import { buildMappingPayload } from '~/features/integrations/lib/mapping-helpers'
import { logger } from '~/lib/logger'
import { type ImporterType } from '~/lib/utils/tag-helpers'
import { useAddProjectMapping } from '~/services/api/lasius-hooks/issue-importers/issue-importers'

type Props = {
  onClose: () => void
  open: boolean
  selectedOrgId: string
}

const STEPS: Array<{ id: WizardStep; label: string }> = [
  { id: 'platform', label: 'Platform' },
  { id: 'config', label: 'Configure' },
  { id: 'test', label: 'Test' },
  { id: 'projects', label: 'Projects' },
]

export const IssueImporterWizard = ({
  onClose,
  open,
  selectedOrgId,
}: Props) => {
  const { t } = useTranslation('integrations')
  const {
    resetWizard,
    setAvailableProjects,
    setCreatedConfig,
    setCurrentStep,
    state,
    updateFormData,
  } = useWizardState()

  const [projectMappings, setProjectMappings] = useState<
    Record<string, MappingWithTagConfig>
  >({})
  const [isSaving, setIsSaving] = useState(false)
  const revalidator = useRevalidator()
  const mappingsQueueRef = useRef<
    Array<{
      externalProjectId: string
      mapping: MappingWithTagConfig
    }>
  >([])
  const mappingsQueueIndexRef = useRef(0)

  const { submit: submitAddMapping } = useAddProjectMapping({
    onError: () => {
      logger.error('[IssueImporterWizard] Failed to save project mapping')
      setIsSaving(false)
    },
    onSuccess: () => {
      // Process next mapping in queue
      mappingsQueueIndexRef.current += 1
      if (mappingsQueueIndexRef.current < mappingsQueueRef.current.length) {
        submitNextMapping()
      } else {
        // All mappings saved
        setIsSaving(false)
        void revalidator.revalidate()
        handleClose()
      }
    },
  })

  const submitNextMapping = useCallback(() => {
    const entry = mappingsQueueRef.current[mappingsQueueIndexRef.current]
    if (!entry || !state.createdConfig || !state.formData.importerType) return

    const externalProject = state.availableProjects?.find(
      (p) => p.id === entry.externalProjectId,
    )

    const result = buildMappingPayload(
      state.formData.importerType,
      entry.externalProjectId,
      entry.mapping.projectId,
      entry.mapping.tagConfig,
      externalProject?.name,
    )

    if (!result.success) {
      logger.error(
        '[IssueImporterWizard] Mapping payload build failed:',
        result.error,
      )
      // Skip this mapping and process next
      mappingsQueueIndexRef.current += 1
      if (mappingsQueueIndexRef.current < mappingsQueueRef.current.length) {
        submitNextMapping()
      } else {
        setIsSaving(false)
        void revalidator.revalidate()
        handleClose()
      }
      return
    }

    submitAddMapping({
      body: result.payload,
      configId: state.createdConfig.id,
      orgId: selectedOrgId,
    })
  }, [
    state.createdConfig,
    state.formData.importerType,
    state.availableProjects,
    submitAddMapping,
    selectedOrgId,
    revalidator,
  ])

  const translatedSteps = useMemo(
    () => [
      {
        id: 'platform' as WizardStep,
        label: t('issueImporters.wizard.steps.platform', {
          defaultValue: 'Platform',
        }),
      },
      {
        id: 'config' as WizardStep,
        label: t('issueImporters.wizard.steps.config', {
          defaultValue: 'Configure',
        }),
      },
      {
        id: 'test' as WizardStep,
        label: t('issueImporters.wizard.steps.test', {
          defaultValue: 'Test',
        }),
      },
      {
        id: 'projects' as WizardStep,
        label: t('issueImporters.wizard.steps.projects', {
          defaultValue: 'Projects',
        }),
      },
    ],
    [t],
  )

  const currentStepIndex = STEPS.findIndex((s) => s.id === state.currentStep)

  const isLastStep = currentStepIndex === STEPS.length - 1

  const getStepClassName = (index: number, current: number): string => {
    if (index < current) return 'text-success'
    if (index === current) return 'text-primary font-medium'
    return 'text-base-content/40'
  }

  const handleClose = useCallback(() => {
    resetWizard()
    setProjectMappings({})
    onClose()
  }, [resetWizard, onClose])

  const handleSelectPlatform = useCallback(
    (type: ImporterType) => {
      const baseUrls: Record<ImporterType, string> = {
        github: 'https://api.github.com',
        gitlab: 'https://gitlab.com',
        jira: 'https://your-company.atlassian.net',
        plane: 'https://app.plane.so',
      }

      updateFormData({
        baseUrl: baseUrls[type],
        importerType: type,
      })
      setCurrentStep('config')
    },
    [updateFormData, setCurrentStep],
  )

  const handleConfigCreated = useCallback(
    (config: Parameters<typeof setCreatedConfig>[0]) => {
      setCreatedConfig(config)
    },
    [setCreatedConfig],
  )

  const handleTestNext = useCallback(() => {
    setCurrentStep('projects')
  }, [setCurrentStep])

  const handlePrevious = useCallback(() => {
    if (state.currentStep === 'config') {
      setCurrentStep('platform')
    } else if (state.currentStep === 'projects') {
      // Skip test step when going back if config already exists
      if (state.createdConfig) {
        setCurrentStep('config')
      } else {
        setCurrentStep('test')
      }
    } else if (state.currentStep === 'test') {
      setCurrentStep('config')
    }
  }, [state.currentStep, state.createdConfig, setCurrentStep])

  const handleMappingsChange = useCallback(
    (mappings: Record<string, MappingWithTagConfig>) => {
      setProjectMappings(mappings)
    },
    [],
  )

  const handleFinish = useCallback(() => {
    if (!state.createdConfig || !state.formData.importerType) {
      logger.error(
        '[IssueImporterWizard] Cannot save mappings: missing config or importer type',
      )
      return
    }

    const mappingEntries = Object.entries(projectMappings)

    if (mappingEntries.length === 0) {
      // No mappings to save, just close
      void revalidator.revalidate()
      handleClose()
      return
    }

    setIsSaving(true)
    mappingsQueueRef.current = mappingEntries.map(
      ([externalProjectId, mapping]) => ({
        externalProjectId,
        mapping,
      }),
    )
    mappingsQueueIndexRef.current = 0
    submitNextMapping()
  }, [
    state.createdConfig,
    state.formData.importerType,
    projectMappings,
    revalidator,
    handleClose,
    submitNextMapping,
  ])

  const canGoPrevious = state.currentStep !== 'platform'

  const modalSize =
    state.currentStep === 'config' || state.currentStep === 'projects'
      ? 'xl'
      : 'lg'

  return (
    <Modal onClose={handleClose} open={open} size={modalSize}>
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex-shrink-0 pb-4">
          <h2 className="text-lg font-semibold">
            {t('issueImporters.wizard.title', {
              defaultValue: 'Add Integration',
            })}
          </h2>

          {/* Progress indicator */}
          <div className="mt-4 flex items-center justify-center gap-1">
            {translatedSteps.map((step, index) => (
              <div className="flex items-center" key={step.id}>
                <button
                  className={`flex items-center gap-1.5 rounded-full px-2 py-1 text-xs transition-colors ${getStepClassName(index, currentStepIndex)}`}
                  disabled={index > currentStepIndex}
                  type="button"
                >
                  {index < currentStepIndex ? (
                    <LucideIcon icon={CheckCircle2} size={16} />
                  ) : (
                    <LucideIcon icon={Circle} size={16} />
                  )}
                  <span>{step.label}</span>
                </button>
                {index < STEPS.length - 1 && (
                  <div className="bg-base-content/20 mx-1 h-px w-4" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="relative flex-1 overflow-y-auto">
          {state.currentStep === 'platform' && (
            <SelectPlatformStep onSelectPlatform={handleSelectPlatform} />
          )}

          {state.currentStep === 'config' && state.formData.importerType && (
            <div className="flex h-full items-center justify-center">
              <p className="text-base-content/60">
                {t('issueImporters.wizard.configTodo', {
                  defaultValue: 'Configuration form (TODO)',
                })}
              </p>
            </div>
          )}

          {state.currentStep === 'test' && state.formData.importerType && (
            <TestConnectionStep
              formData={state.formData}
              onBack={handlePrevious}
              onConfigCreated={handleConfigCreated}
              onNext={handleTestNext}
              selectedOrgId={selectedOrgId}
            />
          )}

          {state.currentStep === 'projects' &&
            state.formData.importerType &&
            state.createdConfig && (
              <ListProjectsStep
                configId={state.createdConfig.id}
                importerType={state.formData.importerType}
                onMappingsChange={handleMappingsChange}
                onProjectsLoaded={setAvailableProjects}
                orgId={selectedOrgId}
              />
            )}
        </div>

        {/* Footer navigation */}
        {state.currentStep !== 'test' && (
          <div className="mt-6 flex flex-shrink-0 items-center justify-between">
            <Button
              disabled={!canGoPrevious}
              fullWidth={false}
              onClick={handlePrevious}
              size="sm"
              variant="ghost"
            >
              <LucideIcon icon={ArrowLeft} size={16} />
              {t('actions.back', { defaultValue: 'Back' })}
            </Button>

            <div className="text-base-content/50 text-sm">
              {currentStepIndex + 1} / {STEPS.length}
            </div>

            {isLastStep ? (
              <Button
                disabled={isSaving}
                fullWidth={false}
                onClick={handleFinish}
                size="sm"
                variant="primary"
              >
                {isSaving
                  ? t('actions.saving', {
                      defaultValue: 'Saving...',
                    })
                  : t('actions.finish', {
                      defaultValue: 'Finish',
                    })}
              </Button>
            ) : (
              <Button
                disabled={state.currentStep === 'platform'}
                fullWidth={false}
                onClick={() => {
                  const nextStep = STEPS[currentStepIndex + 1]
                  if (nextStep) setCurrentStep(nextStep.id)
                }}
                size="sm"
                variant="primary"
              >
                {t('actions.next', { defaultValue: 'Next' })}
                <LucideIcon icon={ArrowRight} size={16} />
              </Button>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
