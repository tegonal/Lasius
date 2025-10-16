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

import {
  buildMappingPayload,
  type TagConfiguration,
} from 'components/features/issue-importers/lib/mappingHelpers'
import { Button } from 'components/primitives/buttons/Button'
import { ScrollContainer } from 'components/primitives/layout/ScrollContainer'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { Modal } from 'components/ui/overlays/modal/Modal'
import { ModelsImporterType } from 'lib/api/lasius'
import {
  getGetConfigsKey,
  useAddProjectMapping,
  useCreateConfig,
} from 'lib/api/lasius/issue-importers/issue-importers'
import { logger } from 'lib/logger'
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, X } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React, { useCallback, useRef, useState } from 'react'
import { mutate } from 'swr'

import { ConfigFormStep } from './steps/ConfigFormStep'
import { ListProjectsStep } from './steps/ListProjectsStep'
import { SelectPlatformStep } from './steps/SelectPlatformStep'
import { TestConnectionStep } from './steps/TestConnectionStep'
import { useWizardState, type WizardStep } from './useWizardState'

import type { ImporterType } from 'components/features/issue-importers/shared/types'
import type { useToast } from 'components/ui/feedback/hooks/useToast'
import type { ModelsExternalProject } from 'lib/api/lasius'

type Props = {
  open: boolean
  onClose: () => void
  orgId: string
  addToast: ReturnType<typeof useToast>['addToast']
}

export const IssueImporterWizard: React.FC<Props> = ({ open, onClose, orgId, addToast }) => {
  const { t } = useTranslation('integrations')

  const STEPS: Array<{ id: WizardStep; label: string }> = [
    {
      id: 'platform',
      label: t('issueImporters.wizard.steps.platform', { defaultValue: 'Platform' }),
    },
    {
      id: 'config',
      label: t('issueImporters.wizard.steps.configure', { defaultValue: 'Configure' }),
    },
    { id: 'test', label: t('issueImporters.wizard.steps.test', { defaultValue: 'Test' }) },
    {
      id: 'projects',
      label: t('issueImporters.wizard.steps.projects', { defaultValue: 'Projects' }),
    },
    // Mapping step temporarily disabled - will be implemented when API mapping is clarified
    // { id: 'mapping', label: t('issueImporters.wizard.steps.map', { defaultValue: 'Map' }) },
  ]
  const wizardRef = useRef<HTMLDivElement>(null)
  const {
    state,
    updateFormData,
    setCurrentStep,
    setCreatedConfig,
    setAvailableProjects,
    resetWizard,
  } = useWizardState()

  const [isSaving, setIsSaving] = useState(false)
  const [testStatus, setTestStatus] = useState<'testing' | 'success' | 'error' | 'idle'>('idle')

  type MappingWithTagConfig = {
    projectId: string
    tagConfig?: TagConfiguration
  }
  const [projectMappings, setProjectMappings] = useState<Record<string, MappingWithTagConfig>>({})
  const isCreatingConfigRef = useRef(false)
  const { trigger: createConfig } = useCreateConfig(orgId)
  const { trigger: addMapping } = useAddProjectMapping(orgId, state.createdConfig?.id || '')

  const currentStepIndex = STEPS.findIndex((s) => s.id === state.currentStep)

  const handleClose = () => {
    resetWizard()
    onClose()
  }

  const handleSelectPlatform = (type: ImporterType) => {
    // Set platform-specific default base URLs
    const baseUrls: Record<ImporterType, string> = {
      github: 'https://api.github.com',
      gitlab: 'https://gitlab.com',
      jira: 'https://your-company.atlassian.net',
      plane: 'https://app.plane.so',
    }

    updateFormData({
      importerType: type,
      baseUrl: baseUrls[type],
    })
    setCurrentStep('config')
  }

  const handleConfigSubmit = (formData: typeof state.formData) => {
    updateFormData(formData)

    // If config already exists, skip test and go directly to projects
    if (state.createdConfig) {
      setCurrentStep('projects')
    } else {
      setCurrentStep('test')
    }
  }

  const handleTestSuccess = async () => {
    // Create the configuration
    if (!state.formData.importerType) return

    // Prevent duplicate creation (e.g., from React Strict Mode double-mounting)
    if (isCreatingConfigRef.current || state.createdConfig) {
      return
    }

    isCreatingConfigRef.current = true
    setIsSaving(true)
    try {
      const config = await createConfig({
        importerType: ModelsImporterType[state.formData.importerType],
        name: state.formData.name,
        baseUrl: state.formData.baseUrl,
        checkFrequency: state.formData.checkFrequency,
        accessToken: state.formData.accessToken || null,
        consumerKey: state.formData.consumerKey || null,
        privateKey: state.formData.privateKey || null,
        apiKey: state.formData.apiKey || null,
        resourceOwner: state.formData.resourceOwner || null,
        resourceOwnerType: state.formData.resourceOwnerType,
        workspace: state.formData.workspace || null,
      })

      if (config) {
        setCreatedConfig(config)
        setCurrentStep('projects')
      }
    } catch (error) {
      logger.error('[IssueImporterWizard] Failed to create config:', error)
      addToast({
        message: t('issueImporters.errors.saveFailed', {
          defaultValue: 'Failed to save configuration',
        }),
        type: 'ERROR',
      })
    } finally {
      setIsSaving(false)
      isCreatingConfigRef.current = false
    }
  }

  const handleProjectsLoaded = useCallback(
    (projects: ModelsExternalProject[]) => {
      setAvailableProjects(projects)
    },
    [setAvailableProjects],
  )

  const handleMappingsChange = useCallback((mappings: Record<string, MappingWithTagConfig>) => {
    setProjectMappings(mappings)
  }, [])

  const handleNext = () => {
    // On config step, trigger form submission instead of direct navigation
    if (state.currentStep === 'config') {
      // Find and trigger the hidden submit button in the config form
      const form = document.querySelector('form')
      if (form) {
        form.requestSubmit()
      }
      return
    }

    const nextStep = STEPS[currentStepIndex + 1]
    if (nextStep) {
      setCurrentStep(nextStep.id)
      wizardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handlePrevious = () => {
    // If on projects step, skip test step and go directly to config
    if (state.currentStep === 'projects' && state.createdConfig) {
      // Populate form with existing config data (but not credentials for security)
      updateFormData({
        name: state.createdConfig.name,
        baseUrl: state.createdConfig.baseUrl as string,
        checkFrequency: state.createdConfig.checkFrequency,
        // Don't populate credentials - they should remain in formData from initial input
      })
      setCurrentStep('config')
      wizardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }

    const prevStep = STEPS[currentStepIndex - 1]
    if (prevStep) {
      setCurrentStep(prevStep.id)
      wizardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handleFinish = async () => {
    if (!state.createdConfig || !state.formData.importerType) {
      logger.error('[IssueImporterWizard] Cannot save mappings: missing config or importer type')
      return
    }

    setIsSaving(true)

    try {
      // Save all project mappings
      const mappingEntries = Object.entries(projectMappings)

      if (mappingEntries.length > 0) {
        // Map external project IDs to Lasius project IDs with tag configurations
        for (const [externalProjectId, mappingWithConfig] of mappingEntries) {
          // Find the external project to get its name
          const externalProject = state.availableProjects?.find((p) => p.id === externalProjectId)

          // Build platform-specific mapping payload using helper
          const result = buildMappingPayload(
            state.formData.importerType,
            externalProjectId,
            mappingWithConfig.projectId,
            mappingWithConfig.tagConfig,
            externalProject?.name,
          )

          if (!result.success) {
            logger.error('[IssueImporterWizard] Mapping payload build failed:', result.error)
            addToast({
              message: t('issueImporters.errors.invalidMappingData', {
                defaultValue: result.error,
              }),
              type: 'ERROR',
            })
            continue // Skip this mapping and continue with next
          }

          await addMapping(result.payload)
        }
      }

      // Invalidate cache
      await mutate(getGetConfigsKey(orgId, { type: state.formData.importerType as any }))

      addToast({
        message: t('issueImporters.success.configSaved', {
          defaultValue: 'Configuration saved successfully',
        }),
        type: 'SUCCESS',
      })

      handleClose()
    } catch (error) {
      logger.error('[IssueImporterWizard] Failed to save project mappings:', error)
      addToast({
        message: t('issueImporters.errors.mappingSaveFailed', {
          defaultValue: 'Failed to save project mapping',
        }),
        type: 'ERROR',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const isLastStep = currentStepIndex === STEPS.length - 1 || state.currentStep === 'projects'
  const canGoNext =
    (state.currentStep === 'platform' && !!state.formData.importerType) ||
    state.currentStep === 'config' ||
    (state.currentStep === 'projects' && !!state.createdConfig)
  // Allow going back from test step only when test failed
  const canGoPrevious =
    currentStepIndex > 0 && (state.currentStep !== 'test' || testStatus === 'error')

  // Use a wider modal for the config step to accommodate 2-column layout
  const modalSize = state.currentStep === 'config' ? '2xl' : 'lg'

  return (
    <Modal open={open} onClose={handleClose} size={modalSize}>
      <div ref={wizardRef} className="flex h-full flex-1 flex-col">
        {/* Close button */}
        <div className="absolute top-4 right-4">
          <Button
            onClick={handleClose}
            variant="ghost"
            shape="circle"
            fullWidth={false}
            aria-label={t('actions.close', { defaultValue: 'Close' })}>
            <LucideIcon icon={X} size={20} />
          </Button>
        </div>

        {/* Progress indicators */}
        <div className="mb-6 flex min-h-0 items-center justify-center gap-2">
          {STEPS.map((step, index) => {
            const isActive = index === currentStepIndex
            const isCompleted = index < currentStepIndex

            return (
              <div key={step.id} className="flex items-center gap-2">
                <button
                  onClick={() => {
                    // Allow going back to previous steps
                    if (index < currentStepIndex) {
                      setCurrentStep(step.id)
                    }
                  }}
                  disabled={index >= currentStepIndex}
                  className="flex items-center gap-2 transition-opacity hover:opacity-80 disabled:cursor-not-allowed"
                  aria-label={`Go to ${step.label}`}>
                  <LucideIcon
                    icon={isCompleted ? CheckCircle2 : isActive ? CheckCircle2 : Circle}
                    size={12}
                    className={
                      isCompleted
                        ? 'text-success'
                        : isActive
                          ? 'text-primary'
                          : 'text-base-content/30'
                    }
                  />
                  <span
                    className={`text-xs ${
                      isActive ? 'text-primary font-semibold' : 'text-base-content/60'
                    }`}>
                    {step.label}
                  </span>
                </button>
                {index < STEPS.length - 1 && <div className="bg-base-content/20 mx-1 h-px w-4" />}
              </div>
            )
          })}
        </div>

        <ScrollContainer>
          {/* Step content with animation */}
          {state.currentStep === 'platform' && (
            <SelectPlatformStep onSelectPlatform={handleSelectPlatform} />
          )}

          {state.currentStep === 'config' && state.formData.importerType && (
            <ConfigFormStep
              importerType={state.formData.importerType}
              initialData={state.formData}
              onSubmit={handleConfigSubmit}
              orgId={orgId}
            />
          )}

          {state.currentStep === 'test' &&
            state.formData.importerType &&
            (() => {
              const testConfig = {
                importerType: ModelsImporterType[state.formData.importerType],
                name: state.formData.name,
                baseUrl: state.formData.baseUrl,
                checkFrequency: state.formData.checkFrequency,
                accessToken: state.formData.accessToken || null,
                consumerKey: state.formData.consumerKey || null,
                privateKey: state.formData.privateKey || null,
                apiKey: state.formData.apiKey || null,
                resourceOwner: state.formData.resourceOwner || null,
                resourceOwnerType: state.formData.resourceOwnerType || null,
                workspace: state.formData.workspace || null,
              }
              return (
                <TestConnectionStep
                  config={testConfig}
                  orgId={orgId}
                  onSuccess={handleTestSuccess}
                  onStatusChange={setTestStatus}
                />
              )
            })()}

          {state.currentStep === 'projects' &&
            state.formData.importerType &&
            state.createdConfig && (
              <ListProjectsStep
                importerType={state.formData.importerType}
                configId={state.createdConfig.id}
                orgId={orgId}
                onProjectsLoaded={handleProjectsLoaded}
                onMappingsChange={handleMappingsChange}
              />
            )}

          {/* Mapping step temporarily disabled - mappings now happen inline in projects step */}
          {state.currentStep === 'mapping' &&
            state.formData.importerType &&
            state.availableProjects && (
              <div className="flex h-full items-center justify-center">
                <p className="text-base-content/60">Mapping step not yet implemented</p>
              </div>
            )}
        </ScrollContainer>

        {/* Navigation */}
        {(state.currentStep !== 'test' || testStatus === 'error') && (
          <div className="mt-6 flex items-center justify-between">
            <Button
              onClick={handlePrevious}
              disabled={!canGoPrevious || isSaving}
              variant="ghost"
              size="sm"
              fullWidth={false}
              className="gap-2">
              <LucideIcon icon={ArrowLeft} size={16} />
              {t('actions.back', { defaultValue: 'Back' })}
            </Button>

            <div className="text-base-content/50 text-sm">
              {currentStepIndex + 1} / {STEPS.length}
            </div>

            {isLastStep ? (
              <Button
                onClick={handleFinish}
                variant="primary"
                size="sm"
                fullWidth={false}
                disabled={isSaving}>
                {isSaving
                  ? t('actions.saving', { defaultValue: 'Saving...' })
                  : t('actions.finish', { defaultValue: 'Finish' })}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={
                  !canGoNext || isSaving || (state.currentStep === 'test' && testStatus === 'error')
                }
                variant="primary"
                size="sm"
                fullWidth={false}
                className="gap-2">
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
