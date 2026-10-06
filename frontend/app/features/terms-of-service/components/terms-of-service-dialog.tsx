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

import { useTranslation } from 'react-i18next'
import { Form, href } from 'react-router'

import { Button } from '~/components/primitives/buttons/button'
import { Alert } from '~/components/ui/feedback/alert'
import { ButtonGroup } from '~/components/ui/forms/button-group'
import { Modal } from '~/components/ui/overlays/modal/modal'
import { ModalBody } from '~/components/ui/overlays/modal/modal-body'
import { ModalDescription } from '~/components/ui/overlays/modal/modal-description'
import { ModalHeader } from '~/components/ui/overlays/modal/modal-header'
import { useAcceptUserTOS } from '~/services/api/lasius-hooks/user/user'

import { type TermsOfService } from '../types'

interface TermsOfServiceDialogProperties {
  termsOfService: null | TermsOfService
}

const keepOpen = () => {}

/**
 * Asks the user to accept the terms of service of the operator. After the accept request, the
 * app-layout loader runs again and returns no terms, so the dialog closes.
 */
export const TermsOfServiceDialog = ({ termsOfService }: TermsOfServiceDialogProperties) => {
  const { t } = useTranslation('common')
  const { error, isLoading, submit } = useAcceptUserTOS()

  if (!termsOfService) return null

  const { html, isFallback, version } = termsOfService

  return (
    <Modal blockViewport onClose={keepOpen} open size="lg">
      <ModalHeader>
        {t('tos.title', { defaultValue: 'Terms of Service (version {{version}})', version })}
      </ModalHeader>
      <ModalDescription>
        {t('tos.acceptMessage', {
          defaultValue:
            'Please accept the following Terms of Service (version {{version}}), if you want to continue using Lasius:',
          version,
        })}
      </ModalDescription>
      {isFallback && (
        <Alert className="mt-4" variant="warning">
          {t('tos.fallbackNotice', {
            defaultValue:
              'The Terms of Service are not available in your language. The English version is displayed below.',
          })}
        </Alert>
      )}
      <ModalBody className="bg-base-200 my-4 rounded-lg p-4">
        {html === null ? (
          <p>
            {t('tos.notAvailable', {
              defaultValue:
                'The Terms of Service are not available in the current language. Please change to a supported language.',
            })}
          </p>
        ) : (
          // The HTML comes from a file that the operator mounts on the server, never from a user.
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
        )}
      </ModalBody>
      {error && (
        <Alert className="mb-4" variant="error">
          {error.error}
        </Alert>
      )}
      <ButtonGroup>
        <Button
          data-testid="tos-accept-btn"
          loading={isLoading}
          onClick={() => submit({ body: { version } })}
          type="button"
          variant="primary">
          {t('tos.actions.accept', { defaultValue: 'Accept Terms of Service' })}
        </Button>
        <Form action={href('/logout')} className="w-full" method="post">
          <Button
            data-testid="tos-reject-btn"
            disabled={isLoading}
            type="submit"
            variant="secondary">
            {t('tos.actions.reject', { defaultValue: 'Reject and logout' })}
          </Button>
        </Form>
      </ButtonGroup>
    </Modal>
  )
}
