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

import { SiGithub, SiGitlab, SiKeycloak } from '@icons-pack/react-simple-icons'

import { LasiusIcon } from '~/components/ui/icons/lasius-icon'

import { type AuthProvider } from './types'

/** Human-readable display name for an auth provider. */
export const getProviderDisplayName = (
  provider: AuthProvider,
  keycloakName?: string,
): string => {
  if (provider === 'keycloak' && keycloakName) {
    return keycloakName
  }
  const names: Record<AuthProvider, string> = {
    github: 'GitHub',
    gitlab: 'GitLab',
    internal: 'Email & Password',
    keycloak: 'Keycloak',
  }
  return names[provider]
}

/** Icon component for an auth provider (24×24). */
export const getProviderIcon = (provider: AuthProvider): React.ReactNode => {
  switch (provider) {
    case 'github': {
      return <SiGithub size={24} />
    }
    case 'gitlab': {
      return <SiGitlab size={24} />
    }
    case 'internal': {
      return <LasiusIcon size={24} />
    }
    case 'keycloak': {
      return <SiKeycloak size={24} />
    }
    default: {
      return null
    }
  }
}
