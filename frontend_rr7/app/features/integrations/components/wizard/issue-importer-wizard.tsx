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
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { Modal } from '~/components/ui/overlays/modal/modal'
import { SelectPlatformStep } from '~/features/integrations/components/wizard/steps/select-platform-step'
import {
  useWizardState,
  type WizardStep,
} from '~/features/integrations/hooks/use-wizard-state'
import { type ImporterType } from '~/lib/utils/tag-helpers'

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
  selectedOrgId: _selectedOrgId,
}: Props) => {
  const { t } = useTranslation('integrations')
  const { resetWizard, setCurrentStep, state, updateFormData } =
    useWizardState()

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

  const canGoPrevious = state.currentStep !== 'platform'

  const modalSize = state.currentStep === 'config' ? 'xl' : 'lg'

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
            <div className="flex h-full items-center justify-center">
              <p className="text-base-content/60">
                {t('issueImporters.wizard.testTodo', {
                  defaultValue: 'Test connection (TODO)',
                })}
              </p>
            </div>
          )}

          {state.currentStep === 'projects' && state.formData.importerType && (
            <div className="flex h-full items-center justify-center">
              <p className="text-base-content/60">
                {t('issueImporters.wizard.projectsTodo', {
                  defaultValue: 'Project mapping (TODO)',
                })}
              </p>
            </div>
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
                fullWidth={false}
                onClick={handleClose}
                size="sm"
                variant="primary"
              >
                {t('actions.finish', { defaultValue: 'Finish' })}
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
