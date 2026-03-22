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

import { CheckCircleIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { CardSmall } from '~/components/ui/cards/card-small'
import { AvatarOrganisation } from '~/components/ui/data-display/avatar/avatar-organisation'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { useOrganisation } from '~/features/organisation/hooks/use-organisation'
import { type ModelsEntityReference } from '~/services/api/lasius/modelsEntityReference'
import { type ModelsUserOrganisation } from '~/services/api/lasius/modelsUserOrganisation'

const noop = () => {}

interface Props {
	onClose?: () => void
	onSelect?: (organisation: ModelsEntityReference) => void
	selected?: ModelsEntityReference
}

export const OrgSwitcherModal = ({
	onClose = noop,
	onSelect = noop,
	selected,
}: Props) => {
	const { t } = useTranslation('common')
	const { organisations, selectedOrganisationId, setSelectedOrganisation } =
		useOrganisation()

	const selectOrganisation = (orgReference: ModelsEntityReference) => {
		setSelectedOrganisation(orgReference)
		onSelect(orgReference)
		onClose()
	}

	const isCurrent = (item: ModelsUserOrganisation) => {
		if (selected) {
			return selected.id === item.organisationReference.id
		}
		return item.organisationReference.id === selectedOrganisationId
	}

	return (
		<div data-testid="org-switcher-modal">
			<h1 className="mb-4 text-2xl font-bold">
				{t('organisations.selectOrganisation', {
					defaultValue: 'Select organisation',
				})}
			</h1>
			<div className="grid grid-cols-3 gap-3">
				{organisations.map((item) => (
					<CardSmall
						data-testid="org-card"
						key={item.organisationReference.id}
						onClick={() => selectOrganisation(item.organisationReference)}
					>
						<div className="flex flex-col items-center justify-center pt-2">
							<AvatarOrganisation
								name={item.organisationReference.key}
								size={64}
							/>
						</div>
						<div className="leading-normal">
							{item.private
								? t('organisations.myPersonalOrganisation', {
										defaultValue: 'My personal organisation',
									})
								: item.organisationReference.key}
						</div>
						{isCurrent(item) && (
							<div
								className="absolute top-2 right-2"
								title={t('common.selected', {
									defaultValue: 'Selected',
								})}
							>
								<LucideIcon icon={CheckCircleIcon} size={18} />
							</div>
						)}
					</CardSmall>
				))}
			</div>
		</div>
	)
}
