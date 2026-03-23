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

import {
  type ModelsCreateIssueImporterConfigResourceOwnerType,
  type ModelsExternalProject,
  type ModelsImporterType,
  type ModelsIssueImporterConfigResponse,
} from '~/services/api/lasius'

export type WizardFormData = {
  // GitHub/GitLab
  accessToken?: string

  // Plane
  apiKey?: string
  baseUrl: string
  checkFrequency: number

  // Jira
  consumerKey?: string

  // Platform selection
  importerType?: ModelsImporterType
  // Common config fields
  name: string

  privateKey?: string
  // GitHub only
  resourceOwner?: string

  resourceOwnerType?: ModelsCreateIssueImporterConfigResourceOwnerType
  workspace?: string
}

export type WizardState = {
  availableProjects?: ModelsExternalProject[]
  createdConfig?: ModelsIssueImporterConfigResponse
  currentStep: WizardStep
  formData: WizardFormData
}

export type WizardStep = 'config' | 'mapping' | 'platform' | 'projects' | 'test'

const initialFormData: WizardFormData = {
  baseUrl: '',
  checkFrequency: 300000, // 5 minutes default
  name: '',
}

const initialState: WizardState = {
  currentStep: 'platform',
  formData: initialFormData,
}

export const useWizardState = () => {
  const [state, setState] = useState<WizardState>(initialState)

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
    setState(initialState)
  }

  return {
    resetWizard,
    setAvailableProjects,
    setCreatedConfig,
    setCurrentStep,
    state,
    updateFormData,
  }
}
