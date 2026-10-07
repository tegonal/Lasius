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

import { type WizardFormData } from '~/features/integrations/hooks/use-wizard-state'
import { type ModelsCreateIssueImporterConfig } from '~/services/api/lasius'

/**
 * Build the create body from the wizard form. Only the credential fields of the chosen platform go
 * into the body.
 */
export const buildConfigBody = (formData: WizardFormData): ModelsCreateIssueImporterConfig => ({
  accessToken: formData.accessToken,
  baseUrl: formData.baseUrl,
  checkFrequency: formData.checkFrequency,
  importerType: formData.importerType!,
  name: formData.name,
  ...(formData.importerType === 'github' && {
    resourceOwner: formData.resourceOwner,
    resourceOwnerType: formData.resourceOwnerType,
  }),
  ...(formData.importerType === 'jira' && {
    consumerKey: formData.consumerKey,
    privateKey: formData.privateKey,
  }),
  ...(formData.importerType === 'plane' && {
    apiKey: formData.apiKey,
    workspace: formData.workspace,
  }),
})
