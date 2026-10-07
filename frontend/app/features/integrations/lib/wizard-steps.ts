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

import { type WizardStep } from '~/features/integrations/hooks/use-wizard-state'
import {
  type MappingsByExternalProject,
  type MappingWithTagConfig,
} from '~/features/integrations/lib/mapping-helpers'
import { type ImporterType } from '~/lib/utils/tag-helpers'

export const STEP_IDS: WizardStep[] = ['platform', 'config', 'test', 'projects']

export const PLATFORM_BASE_URLS: Record<ImporterType, string> = {
  github: 'https://api.github.com',
  gitlab: 'https://gitlab.com',
  jira: 'https://your-company.atlassian.net',
  plane: 'https://app.plane.so',
}

/** The step that Back opens. A created config skips the test step on the way back. */
export const getPreviousStep = (step: WizardStep, hasCreatedConfig: boolean): null | WizardStep => {
  if (step === 'config' || step === 'test') return step === 'config' ? 'platform' : 'config'
  if (step === 'projects') return hasCreatedConfig ? 'config' : 'test'
  return null
}

export const getStepClassName = (index: number, current: number): string => {
  if (index < current) return 'text-success'
  if (index === current) return 'text-primary font-medium'
  return 'text-base-content/40'
}

export type MappingQueueEntry = { externalProjectId: string; mapping: MappingWithTagConfig }

/** One queue entry for each Lasius project of each external project, in insertion order. */
export const flattenMappings = (mappings: MappingsByExternalProject): MappingQueueEntry[] =>
  Object.entries(mappings).flatMap(([externalProjectId, list]) =>
    list.map((mapping) => ({ externalProjectId, mapping })),
  )
