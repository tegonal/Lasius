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

import { Copy } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { useToast } from '~/components/ui/feedback/use-toast'
import { ButtonGroup } from '~/components/ui/forms/button-group'
import { FormBody } from '~/components/ui/forms/form-body'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { ModalCloseButton } from '~/components/ui/overlays/modal/modal-close-button'
import { ModalDescription } from '~/components/ui/overlays/modal/modal-description'
import { ModalHeader } from '~/components/ui/overlays/modal/modal-header'

type InviteLinkResultProperties = {
  invitationId: string
  onClose: () => void
}

export const InviteLinkResult = ({ invitationId, onClose }: InviteLinkResultProperties) => {
  const { t } = useTranslation()
  const { addToast } = useToast()

  const url = new URL(location.toString())
  const registrationLink = `${url.protocol}//${url.host}/join/${invitationId}`

  const handleCopy = async () => {
    // Only a rejected write shows the error toast. The call stays outside the
    // try block, so a missing clipboard API does not show the toast.
    const writePromise = navigator.clipboard.writeText(registrationLink)
    try {
      await writePromise
    } catch {
      addToast({
        message: t('invitation:copyFailed', 'Failed to copy link'),
        ttl: 3000,
        type: 'ERROR',
      })
      return
    }
    addToast({
      message: t('invitation:copiedToClipboard', 'Link copied to clipboard'),
      ttl: 3000,
      type: 'SUCCESS',
    })
  }

  return (
    <FormBody>
      <ModalCloseButton onClose={onClose} />

      <ModalHeader>{t('invitation:title.invitationCreated', 'Invitation created')}</ModalHeader>

      <ModalDescription>
        {t(
          'invitation:description.copyLink',
          'Copy the link and send it to your colleague. If they do not have an account yet, one will be created when the invitation is accepted.',
        )}
      </ModalDescription>

      <div className="flex gap-3">
        <code className="bg-base-200 flex-1 rounded px-2 py-1" data-testid="org-invite-link">
          {registrationLink}
        </code>

        <Button
          aria-label={t('invitation:copyToClipboard', 'Copy to clipboard')}
          data-testid="org-invite-copy-btn"
          fullWidth={false}
          onClick={handleCopy}
          shape="circle"
          variant="primary">
          <LucideIcon icon={Copy} size={16} />
        </Button>
      </div>

      <ButtonGroup>
        <Button
          data-testid="org-invite-close-btn"
          onClick={onClose}
          type="button"
          variant="primary">
          {t('actions.close', 'Close')}
        </Button>
      </ButtonGroup>
    </FormBody>
  )
}
