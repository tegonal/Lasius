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

import { Code } from 'components/primitives/typography/Code'
import { Li } from 'components/primitives/typography/Li'
import { Ol } from 'components/primitives/typography/OrderedList'
import { P } from 'components/primitives/typography/Paragraph'
import { Alert } from 'components/ui/feedback/Alert'
import { Trans, useTranslation } from 'next-i18next'
import React from 'react'

import type { ImporterType } from './types'

type Props = {
  importerType: ImporterType
}

export const ProviderInstructions: React.FC<Props> = ({ importerType }) => {
  const { t } = useTranslation('integrations')

  // Extract translation keys and values using switch statements - no dynamic keys
  let title: string
  let Content: React.ReactNode

  switch (importerType) {
    case 'github':
      title = t('issueImporters.github.instructions.title', {
        defaultValue: 'How to create GitHub credentials:',
      })
      Content = (
        <Trans i18nKey="issueImporters.github.instructions.content" ns="integrations">
          <Ol>
            <Li>Verify your email address on GitHub</Li>
            <Li>
              Go to Settings → Developer settings → Personal access tokens → Fine-grained tokens
            </Li>
            <Li>Click &quot;Generate new token&quot;</Li>
            <Li>Enter a token name and select an expiration date</Li>
            <Li>
              Choose a resource owner (your user account or an organization you have access to)
            </Li>
            <Li>Select repository access (all repositories or only select repositories)</Li>
            <Li>
              Under Repository permissions, set <Code>Issues</Code> to &quot;Read-only&quot; and{' '}
              <Code>Metadata</Code> to &quot;Read-only&quot;
            </Li>
            <Li>Click &quot;Generate token&quot; and copy it immediately</Li>
          </Ol>
          <P>
            Important: Fine-grained tokens are required (not classic tokens). The resource owner you
            select determines which repositories you can access. For organization repositories, you
            may need organization owner approval. Make sure to select the same resource owner in the
            configuration form above.
          </P>
        </Trans>
      )
      break
    case 'gitlab':
      title = t('issueImporters.gitlab.instructions.title', {
        defaultValue: 'How to create GitLab credentials:',
      })
      Content = (
        <Trans i18nKey="issueImporters.gitlab.instructions.content" ns="integrations">
          <Ol>
            <Li>On the left sidebar, select your avatar</Li>
            <Li>Select &quot;Edit profile&quot;</Li>
            <Li>Select &quot;Personal access tokens&quot;</Li>
            <Li>Select &quot;Add new token&quot;</Li>
            <Li>Enter a token name and optional description</Li>
            <Li>Set an expiration date</Li>
            <Li>
              Select the <Code>read_api</Code> scope (grants read access to the API, including all
              groups and projects)
            </Li>
            <Li>Click &quot;Create personal access token&quot;</Li>
            <Li>Copy the token immediately and store it securely</Li>
          </Ol>
          <P>
            Note: The token will only be shown once. Use <Code>read_api</Code> for read-only access,
            or <Code>api</Code> for full read/write access if needed.
          </P>
        </Trans>
      )
      break
    case 'jira':
      title = t('issueImporters.jira.instructions.title', {
        defaultValue: 'How to create Jira credentials:',
      })
      Content = (
        <Trans i18nKey="issueImporters.jira.instructions.content" ns="integrations">
          <Ol>
            <Li>
              Generate RSA key pair using OpenSSL:{' '}
              <Code>openssl genrsa -out jira_privatekey.pem 1024</Code>
            </Li>
            <Li>
              Extract public key:{' '}
              <Code>openssl rsa -in jira_privatekey.pem -pubout -out jira_publickey.pem</Code>
            </Li>
            <Li>In Jira: Click Settings (cog icon) → Applications → Application links</Li>
            <Li>
              Enter any URL (e.g., <Code>http://localhost</Code>) and click &quot;Create new
              link&quot;
            </Li>
            <Li>
              Ignore the &quot;No response was received&quot; warning and click &quot;Continue&quot;
            </Li>
            <Li>Enter your Application Name and select &quot;Create incoming link&quot;</Li>
            <Li>
              In the incoming authentication form, enter your Consumer Key, paste the public key
              content from <Code>jira_publickey.pem</Code>
            </Li>
            <Li>
              Complete the OAuth 1.0a authorization flow using your consumer key and private key to
              obtain the access token
            </Li>
          </Ol>
          <P>
            Note: This uses OAuth 1.0a with RSA-SHA1 signing. Primarily for Jira Server/Data Center.
            For Jira Cloud, consider using API tokens or OAuth 2.0 for new integrations.
          </P>
        </Trans>
      )
      break
    case 'plane':
      title = t('issueImporters.plane.instructions.title', {
        defaultValue: 'How to create Plane credentials:',
      })
      Content = (
        <Trans i18nKey="issueImporters.plane.instructions.content" ns="integrations">
          <Ol>
            <Li>Log into your Plane account or self-hosted instance</Li>
            <Li>Go to Profile Settings</Li>
            <Li>Select &quot;Personal Access Tokens&quot; from the list of tabs</Li>
            <Li>Click &quot;Add personal access token&quot;</Li>
            <Li>Enter a token name and optional description</Li>
            <Li>Click &quot;Generate&quot; or &quot;Create&quot;</Li>
            <Li>Copy the generated token immediately and store it securely</Li>
          </Ol>
          <P>
            Note: The token will only be shown once. The token is passed as the value of the{' '}
            <Code>X-API-Key</Code> header in API requests.
          </P>
        </Trans>
      )
      break
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
