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

import { useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useToast } from '~/components/ui/feedback/use-toast'
import { getQueueStep, type MappingQueueEntry } from '~/features/integrations/lib/wizard-steps'
import { logger } from '~/lib/logger'
import { type ImporterType } from '~/lib/utils/tag-helpers'
import { type ModelsExternalProject } from '~/services/api/lasius'
import { useAddProjectMapping } from '~/services/api/lasius-hooks/issue-importers/issue-importers'

type UseMappingSaveQueueOptions = {
  availableProjects: ModelsExternalProject[] | undefined
  configId: string | undefined
  importerType: ImporterType | undefined
  /** Runs once after the last entry. `isLastSaved` is true when the last request succeeded. */
  onDone: (isLastSaved: boolean) => void
  selectedOrgId: string
}

/**
 * Saves the mappings of a new config one request at a time. A failed or invalid entry is skipped,
 * and the queue continues with the next one.
 */
export const useMappingSaveQueue = ({
  availableProjects,
  configId,
  importerType,
  onDone,
  selectedOrgId,
}: UseMappingSaveQueueOptions) => {
  const { t } = useTranslation('integrations')
  const { addToast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const queueReference = useRef<MappingQueueEntry[]>([])
  const indexReference = useRef(0)
  const submitNextReference = useRef<() => void>(() => {})

  const advance = (isLastSaved: boolean) => {
    indexReference.current += 1
    if (indexReference.current < queueReference.current.length) {
      submitNextReference.current()
      return
    }
    setIsSaving(false)
    onDone(isLastSaved)
  }

  const { submit: submitAddMapping } = useAddProjectMapping({
    onError: () => {
      logger.error('[IssueImporterWizard] Failed to save project mapping')
      addToast({
        message: t('issueImporters.errors.mappingSaveFailed', {
          defaultValue: 'Failed to save project mapping',
        }),
        type: 'ERROR',
      })
      advance(false)
    },
    onSuccess: () => advance(true),
  })

  const submitNext = () => {
    const step = getQueueStep(
      queueReference.current[indexReference.current],
      configId,
      importerType,
      availableProjects,
    )
    if (step.kind === 'stop') return
    if (step.kind === 'invalid') {
      logger.error('[IssueImporterWizard] Mapping payload build failed:', step.error)
      advance(false)
      return
    }
    submitAddMapping({ body: step.payload, configId: step.configId, orgId: selectedOrgId })
  }

  // A layout effect runs before the passive callback effect of useAddProjectMapping.
  // onSuccess and onError therefore call the submitNext of the current render.
  useLayoutEffect(() => {
    submitNextReference.current = submitNext
  })

  const saveAll = (entries: MappingQueueEntry[]) => {
    setIsSaving(true)
    queueReference.current = entries
    indexReference.current = 0
    submitNext()
  }

  return { isSaving, saveAll }
}
