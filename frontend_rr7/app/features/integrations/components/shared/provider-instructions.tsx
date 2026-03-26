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

import { Trans, useTranslation } from 'react-i18next'

import { Alert } from '~/components/ui/feedback/alert'
import { type ImporterType } from '~/lib/utils/tag-helpers'

type Props = {
  importerType: ImporterType
}

export const ProviderInstructions = ({ importerType }: Props) => {
  const { t } = useTranslation('integrations')

  let title: string
  let Content: React.ReactNode

  switch (importerType) {
    case 'github': {
      title = t('issueImporters.github.instructions.title', {
        defaultValue: 'How to create GitHub credentials:',
      })
      Content = (
        <Trans
          i18nKey="issueImporters.github.instructions.content"
          ns="integrations"
        >
          <ol className="list-decimal space-y-1 pl-4">
            <li>Verify your email address on GitHub</li>
            <li>
              Go to Settings &rarr; Developer settings &rarr; Personal access
              tokens &rarr; Fine-grained tokens
            </li>
            <li>Click &quot;Generate new token&quot;</li>
            <li>Enter a token name and select an expiration date</li>
            <li>
              Choose a resource owner (your user account or an organization you
              have access to)
            </li>
            <li>
              Select repository access (all repositories or only select
              repositories)
            </li>
            <li>
              Under Repository permissions, set{' '}
              <code className="bg-base-300 rounded px-1 text-xs">Issues</code>{' '}
              to &quot;Read-only&quot; and{' '}
              <code className="bg-base-300 rounded px-1 text-xs">Metadata</code>{' '}
              to &quot;Read-only&quot;
            </li>
            <li>Click &quot;Generate token&quot; and copy it immediately</li>
          </ol>
          <p className="mt-2">
            Important: Fine-grained tokens are required (not classic tokens).
            The resource owner you select determines which repositories you can
            access. For organization repositories, you may need organization
            owner approval. Make sure to select the same resource owner in the
            configuration form above.
          </p>
        </Trans>
      )
      break
    }
    case 'gitlab': {
      title = t('issueImporters.gitlab.instructions.title', {
        defaultValue: 'How to create GitLab credentials:',
      })
      Content = (
        <Trans
          i18nKey="issueImporters.gitlab.instructions.content"
          ns="integrations"
        >
          <ol className="list-decimal space-y-1 pl-4">
            <li>On the left sidebar, select your avatar</li>
            <li>Select &quot;Edit profile&quot;</li>
            <li>Select &quot;Personal access tokens&quot;</li>
            <li>Select &quot;Add new token&quot;</li>
            <li>Enter a token name and optional description</li>
            <li>Set an expiration date</li>
            <li>
              Select the{' '}
              <code className="bg-base-300 rounded px-1 text-xs">read_api</code>{' '}
              scope (grants read access to the API, including all groups and
              projects)
            </li>
            <li>Click &quot;Create personal access token&quot;</li>
            <li>Copy the token immediately and store it securely</li>
          </ol>
          <p className="mt-2">
            Note: The token will only be shown once. Use{' '}
            <code className="bg-base-300 rounded px-1 text-xs">read_api</code>{' '}
            for read-only access, or{' '}
            <code className="bg-base-300 rounded px-1 text-xs">api</code> for
            full read/write access if needed.
          </p>
        </Trans>
      )
      break
    }
    case 'jira': {
      title = t('issueImporters.jira.instructions.title', {
        defaultValue: 'How to create Jira credentials:',
      })
      Content = (
        <Trans
          i18nKey="issueImporters.jira.instructions.content"
          ns="integrations"
        >
          <ol className="list-decimal space-y-1 pl-4">
            <li>
              Generate RSA key pair using OpenSSL:{' '}
              <code className="bg-base-300 rounded px-1 text-xs">
                openssl genrsa -out jira_privatekey.pem 1024
              </code>
            </li>
            <li>
              Extract public key:{' '}
              <code className="bg-base-300 rounded px-1 text-xs">
                openssl rsa -in jira_privatekey.pem -pubout -out
                jira_publickey.pem
              </code>
            </li>
            <li>
              In Jira: Click Settings (cog icon) &rarr; Applications &rarr;
              Application links
            </li>
            <li>
              Enter any URL (e.g.,{' '}
              <code className="bg-base-300 rounded px-1 text-xs">
                http://localhost
              </code>
              ) and click &quot;Create new link&quot;
            </li>
            <li>
              Ignore the &quot;No response was received&quot; warning and click
              &quot;Continue&quot;
            </li>
            <li>
              Enter your Application Name and select &quot;Create incoming
              link&quot;
            </li>
            <li>
              In the incoming authentication form, enter your Consumer Key,
              paste the public key content from{' '}
              <code className="bg-base-300 rounded px-1 text-xs">
                jira_publickey.pem
              </code>
            </li>
            <li>
              Complete the OAuth 1.0a authorization flow using your consumer key
              and private key to obtain the access token
            </li>
          </ol>
          <p className="mt-2">
            Note: This uses OAuth 1.0a with RSA-SHA1 signing. Primarily for Jira
            Server/Data Center. For Jira Cloud, consider using API tokens or
            OAuth 2.0 for new integrations.
          </p>
        </Trans>
      )
      break
    }
    case 'plane': {
      title = t('issueImporters.plane.instructions.title', {
        defaultValue: 'How to create Plane credentials:',
      })
      Content = (
        <Trans
          i18nKey="issueImporters.plane.instructions.content"
          ns="integrations"
        >
          <ol className="list-decimal space-y-1 pl-4">
            <li>Log into your Plane account or self-hosted instance</li>
            <li>Go to Profile Settings</li>
            <li>
              Select &quot;Personal Access Tokens&quot; from the list of tabs
            </li>
            <li>Click &quot;Add personal access token&quot;</li>
            <li>Enter a token name and optional description</li>
            <li>Click &quot;Generate&quot; or &quot;Create&quot;</li>
            <li>Copy the generated token immediately and store it securely</li>
          </ol>
          <p className="mt-2">
            Note: The token will only be shown once. The token is passed as the
            value of the{' '}
            <code className="bg-base-300 rounded px-1 text-xs">X-API-Key</code>{' '}
            header in API requests.
          </p>
          <p className="mt-2">
            Workspace: You need to specify your workspace slug, which can be
            found in your Plane URL. For example, if your Plane URL is{' '}
            <code className="bg-base-300 rounded px-1 text-xs">
              https://app.plane.so/my-company
            </code>
            , then your workspace slug is{' '}
            <code className="bg-base-300 rounded px-1 text-xs">my-company</code>
            . This is required to access projects and issues in your workspace.
          </p>
        </Trans>
      )
      break
    }
  }

  return (
    <Alert variant="info">
      <div className="text-sm">
        <p className="font-semibold">{title}</p>
        {Content}
      </div>
    </Alert>
  )
}
