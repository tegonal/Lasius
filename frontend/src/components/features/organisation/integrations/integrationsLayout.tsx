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

import { IntegrationsContent } from 'components/features/organisation/integrations/integrationsContent'
import { IntegrationsRightColumn } from 'components/features/organisation/integrations/integrationsRightColumn'
import { IntegrationsStats } from 'components/features/organisation/integrations/integrationsStats'
import { IssueImporterWizard } from 'components/features/organisation/settings/issue-importers/wizard/IssueImporterWizard'
import { ScrollContainer } from 'components/primitives/layout/ScrollContainer'
import { useToast } from 'components/ui/feedback/hooks/useToast'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import React, { useState } from 'react'

export const IntegrationsLayout: React.FC = () => {
  const [showWizard, setShowWizard] = useState(false)
  const { addToast } = useToast()
  const { selectedOrganisationId } = useOrganisation()
  const orgId = selectedOrganisationId || ''

  return (
    <>
      <ScrollContainer className="bg-base-100 flex-1 overflow-y-auto">
        <IntegrationsStats onAdd={() => setShowWizard(true)} />
        <IntegrationsContent />
      </ScrollContainer>
      <ScrollContainer className="bg-base-200 flex-1 overflow-y-auto rounded-tr-lg">
        <IntegrationsRightColumn />
      </ScrollContainer>
      <IssueImporterWizard
        open={showWizard}
        onClose={() => setShowWizard(false)}
        orgId={orgId}
        addToast={addToast}
      />
    </>
  )
}
