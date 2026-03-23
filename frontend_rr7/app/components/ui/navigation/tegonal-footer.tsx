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
import { cva, type VariantProps } from 'class-variance-authority'
import { Trans, useTranslation } from 'react-i18next'

import { TegonalIcon } from '~/components/ui/icons/tegonal-icon'
import { BackendStatus } from '~/features/system/components/backend-status'
import { WebsocketStatus } from '~/features/system/components/websocket-status'

const footerVariants = cva(
  'text-base-content/50 [&_a:hover]:text-base-content flex',
  {
    defaultVariants: {
      variant: 'default',
    },
    variants: {
      variant: {
        compact: 'w-full flex-row items-center justify-between gap-2',
        default: 'flex-col items-center justify-center gap-2',
      },
    },
  },
)

type TegonalFooterProps = VariantProps<typeof footerVariants>

export const TegonalFooter = ({ variant }: TegonalFooterProps) => {
  const { t } = useTranslation('common')
  const isCompact = variant === 'compact'

  return (
    <div className={footerVariants({ variant })}>
      <div>
        <a
          href="https://tegonal.com"
          rel="noopener noreferrer"
          target="_blank"
          title={t('footer.tegonal.title', {
            defaultValue:
              'Lasius is developed and maintained by Tegonal Cooperative and released under AGPL 3.0',
          })}
        >
          <TegonalIcon size={isCompact ? 16 : 24} />
        </a>
      </div>
      <div className={isCompact ? 'text-xs' : 'text-sm'}>
        {isCompact ? (
          <div className="flex flex-row items-center gap-4">
            <a
              href="https://github.com/tegonal/lasius"
              rel="noopener noreferrer"
              target="_blank"
            >
              <SiGithub
                size={16}
                title={t('footer.github.title', {
                  defaultValue:
                    'Find issues, post feedback and get the source code on GitHub',
                })}
              />
            </a>
            <BackendStatus />
            <WebsocketStatus />
          </div>
        ) : (
          <Trans
            components={[
              <a
                href="https://tegonal.com"
                key="tegonalLink"
                rel="noopener noreferrer"
                target="_blank"
              />,
              <a
                href="https://github.com/tegonal/lasius"
                key="gitHubLink"
                rel="noopener noreferrer"
                target="_blank"
              />,
              <a
                href="https://www.gnu.org/licenses/agpl-3.0.en.html"
                key="agplLink"
                rel="noopener noreferrer"
                target="_blank"
              />,
            ]}
            defaults="Developed by <0>Tegonal</0>, available on <1>GitHub</1>, released under <2>AGPL 3.0</2>"
            i18nKey="footer.developedBy"
            t={t}
          />
        )}
      </div>
    </div>
  )
}
