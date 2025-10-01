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

import { CardSmall } from 'components/ui/cards/CardSmall'
import { AvatarUser } from 'components/ui/data-display/avatar/avatarUser'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { ModalConfirm } from 'components/ui/overlays/modal/modalConfirm'
import { m } from 'framer-motion'
import { useProfile } from 'lib/api/hooks/useProfile'
import { ModelsUserStub } from 'lib/api/lasius'
import { Trash2 } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React, { useRef, useState } from 'react'
import { useOnClickOutside } from 'usehooks-ts'

const ContextCard: React.FC<{
  showContext: boolean
  skipRender: boolean
  children: React.ReactNode
}> = ({ showContext, children, skipRender }) => {
  const variants = {
    visible: { y: -48 },
    hidden: { y: 0 },
  }
  if (skipRender) {
    return <>{children}</>
  }
  return (
    <m.div
      initial="hidden"
      animate={showContext ? 'visible' : 'hidden'}
      variants={variants}
      whileHover={showContext ? {} : { y: -4 }}>
      {children}
    </m.div>
  )
}

type Props = {
  user: ModelsUserStub
  onRemove: () => void
  canRemove?: boolean
}

export const UserCard: React.FC<Props> = ({ canRemove = false, onRemove, user }) => {
  const [showContext, setShowContext] = useState<boolean>(false)
  const [showConfirmationDialog, setShowConfirmationDialog] = useState<boolean>(false)
  const ref = useRef(null)
  const { t } = useTranslation('common')
  const { userId } = useProfile()

  // @ts-expect-error React 19 type compatibility, nullable ref can be ignored.
  // see https://github.com/juliencrn/usehooks-ts/issues/602
  useOnClickOutside(ref, () => setShowContext(false))

  const handleConfirm = () => {
    setShowContext(false)
    setShowConfirmationDialog(false)
    onRemove()
  }

  const handleCancel = () => {
    setShowContext(false)
    setShowConfirmationDialog(false)
  }

  const isCurrentUser = () => {
    return user.id === userId
  }

  return (
    <div ref={ref} className="relative overflow-hidden rounded-lg" key={user.id}>
      <ContextCard skipRender={!canRemove} showContext={showContext}>
        <CardSmall onClick={() => setShowContext(!showContext)} className="rounded-none">
          <div className="flex flex-col items-center justify-center pt-2">
            <AvatarUser firstName={user.firstName} lastName={user.lastName} size={64} />
          </div>
          <div className="text-sm">
            {user.firstName} {user.lastName}
          </div>
        </CardSmall>
        {canRemove && (
          <div
            className={`absolute right-0 -bottom-12 left-0 h-12 ${
              isCurrentUser() ? 'bg-primary-gradient' : 'bg-red-gradient'
            }`}>
            <div className="flex h-full w-full flex-col items-center justify-center gap-3">
              {isCurrentUser() ? (
                <>{t('common.you', { defaultValue: 'You' })}</>
              ) : (
                <button
                  className="btn btn-ghost btn-square btn-sm"
                  onClick={() => setShowConfirmationDialog(true)}>
                  <LucideIcon icon={Trash2} size={24} />
                </button>
              )}
            </div>
          </div>
        )}
      </ContextCard>
      {showConfirmationDialog && (
        <ModalConfirm
          text={{
            action: t('members.confirmations.remove', {
              defaultValue: 'Are you sure you want to remove this member?',
            }),
          }}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </div>
  )
}
