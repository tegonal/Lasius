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

import { LasiusBackendStatus } from 'components/features/system/lasiusBackendStatus'
import { Icon } from 'components/ui/icons/Icon'
import { Trans, useTranslation } from 'next-i18next'
import Link from 'next/link'
import React from 'react'

export const TegonalFooter: React.FC = () => {
  const { t } = useTranslation('common')
  return (
    <div className="flex flex-col items-center justify-center gap-2 text-gray-400 [&_a:hover]:text-white">
      <div>
        <Link href="https://tegonal.com" target="_blank">
          <Icon name="tegonal-icon" size={24} />
        </Link>
      </div>
      <div className="text-sm">
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
      </div>
      <LasiusBackendStatus />
    </div>
  )
}
