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

import type { ImporterType } from 'components/features/issue-importers/shared/types'
import type {
  ModelsCreateIssueImporterConfigResourceOwnerType,
  ModelsExternalProject,
  ModelsIssueImporterConfigResponse,
} from 'lib/api/lasius'

export type WizardStep = 'platform' | 'config' | 'test' | 'projects' | 'mapping'

export interface WizardFormData {
  // Platform selection
  importerType?: ImporterType

  // Common config fields
  name: string
  baseUrl: string
  checkFrequency: number

  // GitHub/GitLab
  accessToken?: string

  // GitHub only
  resourceOwner?: string
  resourceOwnerType?: ModelsCreateIssueImporterConfigResourceOwnerType

  // Jira
  consumerKey?: string
  privateKey?: string

  // Plane
  apiKey?: string
}

export interface WizardState {
  currentStep: WizardStep
  formData: WizardFormData
  createdConfig?: ModelsIssueImporterConfigResponse
  availableProjects?: ModelsExternalProject[]
}

export const useWizardState = () => {
  const [state, setState] = useState<WizardState>({
    currentStep: 'platform',
    formData: {
      name: '',
      baseUrl: '',
      checkFrequency: 300000, // 5 minutes default
    },
  })

  const updateFormData = (data: Partial<WizardFormData>) => {
    setState((prev) => ({
      ...prev,
      formData: { ...prev.formData, ...data },
    }))
  }

  const setCurrentStep = (step: WizardStep) => {
    setState((prev) => ({ ...prev, currentStep: step }))
  }

  const setCreatedConfig = (config: ModelsIssueImporterConfigResponse) => {
    setState((prev) => ({ ...prev, createdConfig: config }))
  }

  const setAvailableProjects = (projects: ModelsExternalProject[]) => {
    setState((prev) => ({ ...prev, availableProjects: projects }))
  }

  const resetWizard = () => {
    setState({
      currentStep: 'platform',
      formData: {
        name: '',
        baseUrl: '',
        checkFrequency: 300000,
      },
    })
  }

  return {
    state,
    updateFormData,
    setCurrentStep,
    setCreatedConfig,
    setAvailableProjects,
    resetWizard,
  }
}
