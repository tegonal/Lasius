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
  Building2,
  LogOut,
  Menu,
  Play,
  PlusCircle,
  Settings,
  Star,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useFetcher } from 'react-router'

import { Button } from '~/components/primitives/buttons/button'
import {
  type FABAction,
  FloatingActionButton,
} from '~/components/primitives/buttons/floating-action-button'
import { ButtonGroup } from '~/components/ui/forms/button-group'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { Modal } from '~/components/ui/overlays/modal/modal'
import { BookingAddUpdateForm } from '~/features/bookings/components/booking-add-update-form'
import { BookingStart } from '~/features/home/components/booking-start'
import { FavoriteListCompact } from '~/features/home/components/favorite-list-compact'
import { OrgSwitcherModal } from '~/features/organisation/components/org-switcher-modal'
import { useOrganisation } from '~/features/organisation/hooks/use-organisation'
import { AppSettingsForm } from '~/features/settings/components/app-settings-form'
import { useGetFavoriteBookingList } from '~/services/api/lasius-hooks/user-favorites/user-favorites'

/**
 * Mobile Floating Action Button
 *
 * Fixed bottom-right FAB with six actions:
 * 1. Start booking (quick start with project + tags)
 * 2. Add new booking (full form)
 * 3. Favorites (quick start from favorites)
 * 4. Switch organisation
 * 5. Open settings (app settings form)
 * 6. Sign out
 *
 * Only visible on mobile (md:hidden)
 */
export const MobileFloatingActionButton = () => {
  const [isStartBookingOpen, setIsStartBookingOpen] = useState(false)
  const [isAddBookingOpen, setIsAddBookingOpen] = useState(false)
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false)
  const [isOrgSelectOpen, setIsOrgSelectOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const { t } = useTranslation('common')
  const fetcher = useFetcher()
  const { selectedOrganisationId } = useOrganisation()
  const favoritesApi = useGetFavoriteBookingList({
    fetcherKey: selectedOrganisationId
      ? `favorites:${selectedOrganisationId}`
      : undefined,
  })

  const handleStartBookingClose = () => setIsStartBookingOpen(false)
  const handleAddBookingClose = () => setIsAddBookingOpen(false)
  const handleFavoritesClose = () => setIsFavoritesOpen(false)
  const handleOrgSelectClose = () => setIsOrgSelectOpen(false)
  const handleSettingsClose = () => setIsSettingsOpen(false)

  const handleFavoritesOpen = () => {
    setIsFavoritesOpen(true)
    favoritesApi.submit({ orgId: selectedOrganisationId })
  }

  const handleSignOut = () => {
    void fetcher.submit(null, { action: '/logout', method: 'post' })
  }

  // Refetch favorites when org changes while modal is open
  const favoritesSubmit = favoritesApi.submit
  useEffect(() => {
    if (isFavoritesOpen && selectedOrganisationId) {
      favoritesSubmit({ orgId: selectedOrganisationId })
    }
  }, [selectedOrganisationId, isFavoritesOpen, favoritesSubmit])

  const actions: FABAction[] = [
    {
      ariaLabel: t('bookings:actions.start', { defaultValue: 'Start booking' }),
      icon: <LucideIcon icon={Play} size={24} />,
      id: 'start-booking',
      label: t('bookings:actions.start', { defaultValue: 'Start booking' }),
      onClick: () => setIsStartBookingOpen(true),
      variant: 'primary',
    },
    {
      ariaLabel: t('bookings:actions.add', { defaultValue: 'Add booking' }),
      icon: <LucideIcon icon={PlusCircle} size={24} />,
      id: 'add-booking',
      label: t('bookings:actions.add', { defaultValue: 'Add booking' }),
      onClick: () => setIsAddBookingOpen(true),
      variant: 'secondary',
    },
    {
      ariaLabel: t('bookings:favorites.title', { defaultValue: 'Favorites' }),
      icon: <LucideIcon icon={Star} size={24} />,
      id: 'favorites',
      label: t('bookings:favorites.title', { defaultValue: 'Favorites' }),
      onClick: handleFavoritesOpen,
      variant: 'secondary',
    },
    {
      ariaLabel: t('organisation:actions.switch', {
        defaultValue: 'Switch organisation',
      }),
      icon: <LucideIcon icon={Building2} size={24} />,
      id: 'switch-organisation',
      label: t('organisation:actions.switch', {
        defaultValue: 'Switch organisation',
      }),
      onClick: () => setIsOrgSelectOpen(true),
      variant: 'secondary',
    },
    {
      ariaLabel: t('navigation.settings', { defaultValue: 'Settings' }),
      icon: <LucideIcon icon={Settings} size={24} />,
      id: 'settings',
      label: t('navigation.settings', { defaultValue: 'Settings' }),
      onClick: () => setIsSettingsOpen(true),
      variant: 'secondary',
    },
    {
      ariaLabel: t('auth.actions.signOut', { defaultValue: 'Sign out' }),
      icon: <LucideIcon icon={LogOut} size={24} />,
      id: 'sign-out',
      label: t('auth.actions.signOut', { defaultValue: 'Sign out' }),
      onClick: handleSignOut,
      variant: 'secondary',
    },
  ]

  return (
    <>
      <div className="md:hidden">
        <FloatingActionButton
          actions={actions}
          ariaLabel={t('navigation.openMenu', { defaultValue: 'Open menu' })}
          closeIcon={<LucideIcon icon={X} size={24} />}
          icon={<LucideIcon icon={Menu} size={24} />}
          layout="vertical"
          position="bottomRight"
          size="lg"
          zIndex={10}
        />
      </div>

      {/* Start Booking Modal - Quick start with project + tags */}
      <Modal onClose={handleStartBookingClose} open={isStartBookingOpen}>
        <BookingStart
          onSuccess={handleStartBookingClose}
          selectedOrgId={selectedOrganisationId}
        />
        <ButtonGroup>
          <Button onClick={handleStartBookingClose} variant="secondary">
            {t('common.actions.close', { defaultValue: 'Close' })}
          </Button>
        </ButtonGroup>
      </Modal>

      {/* Add Booking Modal - Full form */}
      <Modal onClose={handleAddBookingClose} open={isAddBookingOpen}>
        <BookingAddUpdateForm
          mode="add"
          onClose={handleAddBookingClose}
          selectedOrgId={selectedOrganisationId}
        />
        <ButtonGroup>
          <Button onClick={handleAddBookingClose} variant="secondary">
            {t('common.actions.close', { defaultValue: 'Close' })}
          </Button>
        </ButtonGroup>
      </Modal>

      {/* Favorites Modal */}
      <Modal onClose={handleFavoritesClose} open={isFavoritesOpen}>
        <FavoriteListCompact
          favorites={favoritesApi.data?.favorites ?? []}
          selectedOrgId={selectedOrganisationId}
        />
        <ButtonGroup>
          <Button onClick={handleFavoritesClose} variant="secondary">
            {t('common.actions.close', { defaultValue: 'Close' })}
          </Button>
        </ButtonGroup>
      </Modal>

      {/* Organisation Select Modal */}
      <Modal onClose={handleOrgSelectClose} open={isOrgSelectOpen}>
        <OrgSwitcherModal onClose={handleOrgSelectClose} />
        <ButtonGroup>
          <Button onClick={handleOrgSelectClose} variant="secondary">
            {t('common.actions.close', { defaultValue: 'Close' })}
          </Button>
        </ButtonGroup>
      </Modal>

      {/* Settings Modal with App Settings Form */}
      <Modal onClose={handleSettingsClose} open={isSettingsOpen} size="lg">
        <AppSettingsForm />
        <ButtonGroup>
          <Button onClick={handleSettingsClose} variant="secondary">
            {t('common.actions.close', { defaultValue: 'Close' })}
          </Button>
        </ButtonGroup>
      </Modal>
    </>
  )
}
