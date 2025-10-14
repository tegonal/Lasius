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

import { SiGithub } from '@icons-pack/react-simple-icons'
import { cva, VariantProps } from 'class-variance-authority'
import { LasiusBackendStatus } from 'components/features/system/lasiusBackendStatus'
import { LasiusBackendWebsocketStatus } from 'components/features/system/lasiusBackendWebsocketStatus'
import { ToolTip } from 'components/ui/feedback/Tooltip'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { TegonalIcon } from 'components/ui/icons/TegonalIcon'
import { ActivityIcon } from 'lucide-react'
import { Trans, useTranslation } from 'next-i18next'
import Link from 'next/link'
import React from 'react'

const footerVariants = cva('text-base-content/50 [&_a:hover]:text-base-content flex', {
  variants: {
    variant: {
      default: 'flex-col items-center justify-center gap-2',
      compact: 'w-full flex-row items-center justify-between gap-2',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

type TegonalFooterProps = VariantProps<typeof footerVariants>

export const TegonalFooter: React.FC<TegonalFooterProps> = ({ variant }) => {
  const { t } = useTranslation('common')
  const isCompact = variant === 'compact'

  return (
    <div className={footerVariants({ variant })}>
      <div>
        <Link
          href="https://tegonal.com"
          target="_blank"
          title={t('footer.tegonal.title', {
            defaultValue:
              'Lasius is developed and maintained by Tegonal Cooperative and released under AGPL 3.0',
          })}>
          <TegonalIcon size={isCompact ? 16 : 24} />
        </Link>
      </div>
      <div className={isCompact ? 'text-xs' : 'text-sm'}>
        {isCompact ? (
          <div className="flex flex-row items-center gap-4">
            <Link key="gitHubLink" target="_blank" href="https://github.com/tegonal/lasius">
              <SiGithub
                size={16}
                title={t('footer.github.title', {
                  defaultValue: 'Find issues, post feedback and get the source code on GitHub',
                })}
              />
            </Link>
            <div>
              <ToolTip
                toolTipContent={
                  <div className="space-y-2 py-2">
                    <div className="text-sm font-semibold">
                      {t('system.connectionStatus', { defaultValue: 'Connection status' })}
                    </div>
                    <dl className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <dd>
                          <LasiusBackendStatus />
                        </dd>
                        <dt className="text-base-content/70">
                          {t('system.backend', { defaultValue: 'Backend' })}
                        </dt>
                      </div>
                      <div className="flex items-center gap-2">
                        <dd>
                          <LasiusBackendWebsocketStatus />
                        </dd>
                        <dt className="text-base-content/70">
                          {t('system.websocket', { defaultValue: 'WebSocket' })}
                        </dt>
                      </div>
                    </dl>
                  </div>
                }>
                <LucideIcon icon={ActivityIcon} size={16} />
              </ToolTip>
            </div>
          </div>
        ) : (
          <Trans
            t={t}
            i18nKey="footer.developedBy"
            defaults="Developed by <0>Tegonal</0>, available on <1>GitHub</1>, released under <2>AGPL 3.0</2>"
            components={[
              <Link key="tegonalLink" target="_blank" href="https://tegonal.com" />,
              <Link key="gitHubLink" target="_blank" href="https://github.com/tegonal/lasius" />,
              <Link
                key="agplLink"
                target="_blank"
                href="https://www.gnu.org/licenses/agpl-3.0.en.html"
              />,
            ]}
          />
        )}
      </div>
      {!isCompact && <LasiusBackendStatus />}
    </div>
  )
}
