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

import { getImporterTypeLabel } from 'components/features/issue-importers/shared/types'
import { Button } from 'components/primitives/buttons/Button'
import { ScrollContainer } from 'components/primitives/layout/ScrollContainer'
import { DataList } from 'components/ui/data-display/dataList/dataList'
import { DataListField } from 'components/ui/data-display/dataList/dataListField'
import { DataListHeaderItem } from 'components/ui/data-display/dataList/dataListHeaderItem'
import { DataListRow } from 'components/ui/data-display/dataList/dataListRow'
import { Loading } from 'components/ui/data-display/fetchState/loading'
import { Alert } from 'components/ui/feedback/Alert'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { Modal } from 'components/ui/overlays/modal/Modal'
import { ModalCloseButton } from 'components/ui/overlays/modal/ModalCloseButton'
import { ModalHeader } from 'components/ui/overlays/modal/ModalHeader'
import { useGetConfig } from 'lib/api/lasius/issue-importers/issue-importers'
import { AlertCircle, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React from 'react'

import type { ImporterType } from 'components/features/issue-importers/shared/types'
import type { ModelsIssueImporterConfigId, ModelsUserStub } from 'lib/api/lasius'

type Props = {
  open: boolean
  onClose: () => void
  configId: ModelsIssueImporterConfigId
  orgId: string
  importerType: ImporterType
}

const formatDate = (dateString?: string | null) => {
  if (!dateString) return 'N/A'
  try {
    return new Date(dateString).toLocaleString()
  } catch {
    return dateString
  }
}

const getUserName = (user: string | ModelsUserStub | undefined): string => {
  if (!user) return 'N/A'
  if (typeof user === 'string') return user
  return user.key
}

const getConnectivityIcon = (status: string) => {
  switch (status) {
    case 'healthy':
      return { icon: CheckCircle2, className: 'text-success' }
    case 'degraded':
      return { icon: AlertCircle, className: 'text-warning' }
    case 'unhealthy':
      return { icon: XCircle, className: 'text-error' }
    default:
      return { icon: Clock, className: 'text-base-content/50' }
  }
}

export const ConfigInfoModal: React.FC<Props> = ({
  open,
  onClose,
  configId,
  orgId,
  importerType,
}) => {
  const { t } = useTranslation('integrations')

  const {
    data: config,
    error,
    isLoading,
  } = useGetConfig(orgId, configId, {
    swr: { enabled: open },
  })

  const syncStatus = config?.syncStatus
  const connectivityStatus = syncStatus?.connectivityStatus
  const { icon: ConnectivityIcon, className: iconClassName } = getConnectivityIcon(
    connectivityStatus || '',
  )

  return (
    <Modal open={open} onClose={onClose} size="xl">
      <ModalCloseButton onClose={onClose} />

      <ScrollContainer>
        <div className="flex h-full flex-col">
          <ModalHeader className="mb-4">
            {t('issueImporters.info.title', {
              defaultValue: 'Configuration Info',
            })}
          </ModalHeader>

          {isLoading && (
            <div className="flex h-64 items-center justify-center">
              <Loading />
            </div>
          )}

          {error && (
            <Alert variant="error" className="mt-4">
              <p className="text-sm">
                {t('issueImporters.info.loadError', {
                  defaultValue: 'Failed to load configuration details. Please try again.',
                })}
              </p>
            </Alert>
          )}

          {!isLoading && !error && config && (
            <div className="mt-4 space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-base-content/70 mb-2 text-sm font-semibold tracking-wide uppercase">
                  {t('issueImporters.info.basicInfo', { defaultValue: 'Basic Information' })}
                </h3>
                <div className="bg-base-200 rounded-lg p-4">
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-base-content/70 text-sm">
                        {t('issueImporters.info.name', { defaultValue: 'Name' })}
                      </dt>
                      <dd className="text-sm font-medium">{config.name}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-base-content/70 text-sm">
                        {t('issueImporters.info.type', { defaultValue: 'Type' })}
                      </dt>
                      <dd className="text-sm font-medium">
                        {getImporterTypeLabel(importerType, t)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-base-content/70 text-sm">
                        {t('issueImporters.info.baseUrl', { defaultValue: 'Base URL' })}
                      </dt>
                      <dd className="text-sm font-medium">{String(config.baseUrl)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-base-content/70 text-sm">
                        {t('issueImporters.info.checkFrequency', {
                          defaultValue: 'Check Frequency',
                        })}
                      </dt>
                      <dd className="text-sm font-medium">
                        {t('issueImporters.info.checkFrequencyValue', {
                          defaultValue: '{{minutes}} minutes',
                          minutes: Math.floor((config.checkFrequency || 0) / 60000),
                        })}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Health Status */}
              {syncStatus && (
                <div>
                  <h3 className="text-base-content/70 mb-2 text-sm font-semibold tracking-wide uppercase">
                    {t('issueImporters.info.healthStatus', { defaultValue: 'Health Status' })}
                  </h3>
                  <div className="bg-base-200 rounded-lg p-4">
                    <div className="mb-4 flex items-center gap-3">
                      <LucideIcon icon={ConnectivityIcon} size={24} className={iconClassName} />
                      <div>
                        <p className="font-medium">{String(connectivityStatus || 'unknown')}</p>
                        {syncStatus.lastConnectivityCheck && (
                          <p className="text-base-content/60 text-xs">
                            {t('issueImporters.info.lastChecked', {
                              defaultValue: 'Last checked: {{date}}',
                              date: formatDate(syncStatus.lastConnectivityCheck),
                            })}
                          </p>
                        )}
                      </div>
                    </div>

                    {syncStatus.currentIssue && (
                      <Alert variant="warning" className="mt-3">
                        <div>
                          <p className="text-sm font-medium">
                            {syncStatus.currentIssue.errorCode || 'Issue detected'}
                          </p>
                          {syncStatus.currentIssue.message && (
                            <p className="mt-1 text-xs">{syncStatus.currentIssue.message}</p>
                          )}
                          {syncStatus.currentIssue.httpStatus && (
                            <p className="mt-1 text-xs">
                              HTTP {syncStatus.currentIssue.httpStatus}
                            </p>
                          )}
                        </div>
                      </Alert>
                    )}

                    <dl className="mt-4 space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-base-content/70 text-sm">
                          {t('issueImporters.info.totalProjectsMapped', {
                            defaultValue: 'Projects Mapped',
                          })}
                        </dt>
                        <dd className="text-sm font-medium">{syncStatus.totalProjectsMapped}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-base-content/70 text-sm">
                          {t('issueImporters.info.totalIssuesSynced', {
                            defaultValue: 'Total Issues Synced',
                          })}
                        </dt>
                        <dd className="text-sm font-medium">{syncStatus.totalIssuesSynced}</dd>
                      </div>
                      {syncStatus.lastSuccessfulSync && (
                        <div className="flex justify-between">
                          <dt className="text-base-content/70 text-sm">
                            {t('issueImporters.info.lastSuccessfulSync', {
                              defaultValue: 'Last Successful Sync',
                            })}
                          </dt>
                          <dd className="text-sm font-medium">
                            {formatDate(syncStatus.lastSuccessfulSync)}
                          </dd>
                        </div>
                      )}
                      {syncStatus.nextScheduledSync && (
                        <div className="flex justify-between">
                          <dt className="text-base-content/70 text-sm">
                            {t('issueImporters.info.nextScheduledSync', {
                              defaultValue: 'Next Scheduled Sync',
                            })}
                          </dt>
                          <dd className="text-sm font-medium">
                            {formatDate(syncStatus.nextScheduledSync)}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>
              )}

              {/* Project Statistics */}
              {syncStatus?.projectStats && syncStatus.projectStats.length > 0 && (
                <div>
                  <h3 className="text-base-content/70 mb-2 text-sm font-semibold tracking-wide uppercase">
                    {t('issueImporters.info.projectStats', {
                      defaultValue: 'Project Statistics',
                    })}
                  </h3>
                  <div className="bg-base-200 rounded-lg p-4">
                    <DataList>
                      <DataListRow>
                        <DataListHeaderItem>
                          {t('issueImporters.info.projectName', { defaultValue: 'Project' })}
                        </DataListHeaderItem>
                        <DataListHeaderItem>
                          {t('issueImporters.info.issuesSynced', { defaultValue: 'Issues' })}
                        </DataListHeaderItem>
                        <DataListHeaderItem>
                          {t('issueImporters.info.lastSync', { defaultValue: 'Last Sync' })}
                        </DataListHeaderItem>
                      </DataListRow>
                      {syncStatus.projectStats.map((stat, index) => (
                        <DataListRow key={index}>
                          <DataListField>
                            <span className="text-sm font-medium">
                              {stat.projectName || stat.projectId || 'Unknown'}
                            </span>
                          </DataListField>
                          <DataListField>
                            <span className="text-sm">{stat.totalIssuesSynced || 0}</span>
                          </DataListField>
                          <DataListField>
                            <span className="text-base-content/70 text-sm">
                              {formatDate(stat.lastSyncAt)}
                            </span>
                          </DataListField>
                        </DataListRow>
                      ))}
                    </DataList>
                  </div>
                </div>
              )}

              {/* Audit Info */}
              {config.audit && (
                <div>
                  <h3 className="text-base-content/70 mb-2 text-sm font-semibold tracking-wide uppercase">
                    {t('issueImporters.info.auditInfo', { defaultValue: 'Audit Information' })}
                  </h3>
                  <div className="bg-base-200 rounded-lg p-4">
                    <dl className="space-y-2">
                      {config.audit.createdAt && (
                        <div className="flex justify-between">
                          <dt className="text-base-content/70 text-sm">
                            {t('issueImporters.info.createdAt', { defaultValue: 'Created' })}
                          </dt>
                          <dd className="text-sm font-medium">
                            {formatDate(config.audit.createdAt)}
                          </dd>
                        </div>
                      )}
                      {config.audit.createdBy && (
                        <div className="flex justify-between">
                          <dt className="text-base-content/70 text-sm">
                            {t('issueImporters.info.createdBy', { defaultValue: 'Created By' })}
                          </dt>
                          <dd className="text-sm font-medium">
                            {getUserName(config.audit.createdBy as string | ModelsUserStub)}
                          </dd>
                        </div>
                      )}
                      {config.audit.updatedAt && (
                        <div className="flex justify-between">
                          <dt className="text-base-content/70 text-sm">
                            {t('issueImporters.info.updatedAt', { defaultValue: 'Last Updated' })}
                          </dt>
                          <dd className="text-sm font-medium">
                            {formatDate(config.audit.updatedAt)}
                          </dd>
                        </div>
                      )}
                      {config.audit.updatedBy && (
                        <div className="flex justify-between">
                          <dt className="text-base-content/70 text-sm">
                            {t('issueImporters.info.updatedBy', { defaultValue: 'Updated By' })}
                          </dt>
                          <dd className="text-sm font-medium">
                            {getUserName(config.audit.updatedBy as string | ModelsUserStub)}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollContainer>
      <div className="mt-6">
        <Button type="button" variant="secondary" onClick={onClose} className="w-full">
          {t('actions.close', { defaultValue: 'Close' })}
        </Button>
      </div>
    </Modal>
  )
}
