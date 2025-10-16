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

import { AppSettingsForm } from 'components/features/settings/app/AppSettingsForm'
import { useSignOut } from 'components/features/system/hooks/useSignOut'
import { BookingAddUpdateForm } from 'components/features/user/index/bookingAddUpdateForm'
import { SelectUserOrganisationModal } from 'components/features/user/selectUserOrganisationModal'
import { Button } from 'components/primitives/buttons/Button'
import { FloatingActionButton } from 'components/primitives/buttons/FloatingActionButton'
import { ButtonGroup } from 'components/ui/forms/ButtonGroup'
import { FormElementSpacer } from 'components/ui/forms/formElementSpacer'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { Modal } from 'components/ui/overlays/modal/Modal'
import { Building2, LogOut, Menu, PlusCircle, Settings, X } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React, { useState } from 'react'

/**
 * Mobile Floating Action Button
 *
 * Fixed bottom-right FAB with four actions:
 * 1. Add new booking
 * 2. Switch organisation
 * 3. Open settings (app settings form)
 * 4. Sign out
 *
 * Only visible on mobile (md:hidden)
 */
export const MobileFloatingActionButton: React.FC = () => {
  const [isAddBookingOpen, setIsAddBookingOpen] = useState(false)
  const [isOrgSelectOpen, setIsOrgSelectOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const { t } = useTranslation('common')
  const { signOut } = useSignOut()

  const handleAddBookingClose = () => setIsAddBookingOpen(false)
  const handleOrgSelectClose = () => setIsOrgSelectOpen(false)
  const handleSettingsClose = () => setIsSettingsOpen(false)

  const actions = [
    {
      id: 'add-booking',
      label: t('bookings.actions.add', { defaultValue: 'Add booking' }),
      icon: <LucideIcon icon={PlusCircle} size={24} />,
      onClick: () => setIsAddBookingOpen(true),
      ariaLabel: t('bookings.actions.add', { defaultValue: 'Add booking' }),
      variant: 'primary' as const,
    },
    {
      id: 'switch-organisation',
      label: t('organisations.actions.switch', { defaultValue: 'Switch organisation' }),
      icon: <LucideIcon icon={Building2} size={24} />,
      onClick: () => setIsOrgSelectOpen(true),
      ariaLabel: t('organisations.actions.switch', { defaultValue: 'Switch organisation' }),
      variant: 'secondary' as const,
    },
    {
      id: 'settings',
      label: t('navigation.settings', { defaultValue: 'Settings' }),
      icon: <LucideIcon icon={Settings} size={24} />,
      onClick: () => setIsSettingsOpen(true),
      ariaLabel: t('navigation.settings', { defaultValue: 'Settings' }),
      variant: 'secondary' as const,
    },
    {
      id: 'sign-out',
      label: t('auth.actions.signOut', { defaultValue: 'Sign out' }),
      icon: <LucideIcon icon={LogOut} size={24} />,
      onClick: signOut,
      ariaLabel: t('auth.actions.signOut', { defaultValue: 'Sign out' }),
      variant: 'secondary' as const,
    },
  ]

  return (
    <>
      <div className="md:hidden">
        <FloatingActionButton
          icon={<LucideIcon icon={Menu} size={24} />}
          closeIcon={<LucideIcon icon={X} size={24} />}
          actions={actions}
          ariaLabel={t('navigation.openMenu', { defaultValue: 'Open menu' })}
          layout="vertical"
          position="bottomRight"
          size="lg"
          zIndex={10}
        />
      </div>

      {/* Add Booking Modal */}
      <Modal open={isAddBookingOpen} onClose={handleAddBookingClose}>
        <BookingAddUpdateForm
          mode="add"
          onSave={handleAddBookingClose}
          onCancel={handleAddBookingClose}
        />
      </Modal>

      {/* Organisation Select Modal */}
      <Modal open={isOrgSelectOpen} onClose={handleOrgSelectClose}>
        <SelectUserOrganisationModal onClose={handleOrgSelectClose} />
        <ButtonGroup>
          <Button variant="secondary" onClick={handleOrgSelectClose}>
            {t('common.actions.close', { defaultValue: 'Close' })}
          </Button>
        </ButtonGroup>
      </Modal>

      {/* Settings Modal with App Settings Form */}
      <Modal open={isSettingsOpen} onClose={handleSettingsClose} size="lg">
        <AppSettingsForm />
        <FormElementSpacer />
        <ButtonGroup>
          <Button
            type="button"
            variant="secondary"
            onClick={handleSettingsClose}
            aria-label={t('common.actions.close', { defaultValue: 'Close' })}>
            {t('common.actions.close', { defaultValue: 'Close' })}
          </Button>
        </ButtonGroup>
      </Modal>
    </>
  )
}
