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

import { AlertCircle, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { FormatDate } from '~/components/ui/data-display/format-date'
import { Alert } from '~/components/ui/feedback/alert'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { Modal } from '~/components/ui/overlays/modal/modal'
import { ModalCloseButton } from '~/components/ui/overlays/modal/modal-close-button'
import { ModalTitle } from '~/components/ui/overlays/modal/modal-title'
import { ImporterTypeBadge } from '~/features/integrations/components/importer-type-badge'
import { type ImporterType } from '~/lib/utils/tag-helpers'
import {
  type ModelsIssueImporterConfigResponse,
  type ModelsUserStub,
} from '~/services/api/lasius'

type Props = {
  config: ModelsIssueImporterConfigResponse | null
  onClose: () => void
  open: boolean
}

const formatDate = (dateString?: null | string) => {
  if (!dateString) return 'N/A'
  try {
    return new Date(dateString).toLocaleString()
  } catch {
    return dateString
  }
}

const getUserName = (user: ModelsUserStub | string | undefined): string => {
  if (!user) return 'N/A'
  if (typeof user === 'string') return user
  return user.key
}

const getConnectivityIcon = (status: string) => {
  switch (status) {
    case 'degraded':
      return { className: 'text-warning', icon: AlertCircle }
    case 'failed':
      return { className: 'text-error', icon: XCircle }
    case 'healthy':
      return { className: 'text-success', icon: CheckCircle2 }
    default:
      return { className: 'text-base-content/50', icon: Clock }
  }
}

export const ConfigInfoModal = ({ config, onClose, open }: Props) => {
  const { t } = useTranslation('integrations')

  const syncStatus = config?.syncStatus
  const connectivityStatus = syncStatus?.connectivityStatus
  const { className: iconClassName, icon: ConnectivityIcon } =
    getConnectivityIcon(connectivityStatus || '')

  return (
    <Modal onClose={onClose} open={open} size="lg">
      <div className="flex flex-col gap-4">
        <ModalCloseButton onClose={onClose} />
        <ModalTitle>
          {t('issueImporters.info.title', {
            defaultValue: 'Configuration Info',
          })}
        </ModalTitle>

        {!config && (
          <p className="text-base-content/60 text-sm">
            {t('issueImporters.info.noConfig', {
              defaultValue: 'No configuration selected.',
            })}
          </p>
        )}

        {config && (
          <div className="max-h-[70vh] space-y-6 overflow-y-auto">
            {/* Basic Info */}
            <div>
              <h3 className="text-base-content/70 mb-2 text-sm font-semibold tracking-wide uppercase">
                {t('issueImporters.info.basicInfo', {
                  defaultValue: 'Basic Information',
                })}
              </h3>
              <div className="bg-base-200 rounded-lg p-4">
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-base-content/70 text-sm">
                      {t('issueImporters.info.name', {
                        defaultValue: 'Name',
                      })}
                    </dt>
                    <dd className="text-sm font-medium">{config.name}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-base-content/70 text-sm">
                      {t('issueImporters.info.type', {
                        defaultValue: 'Type',
                      })}
                    </dt>
                    <dd>
                      <ImporterTypeBadge
                        type={config.importerType as ImporterType}
                      />
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-base-content/70 text-sm">
                      {t('issueImporters.info.baseUrl', {
                        defaultValue: 'Base URL',
                      })}
                    </dt>
                    <dd className="text-sm font-medium">
                      {String(config.baseUrl)}
                    </dd>
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
                        minutes: Math.floor(
                          (config.checkFrequency || 0) / 60000,
                        ),
                      })}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-base-content/70 text-sm">
                      {t('issueImporters.info.projectCount', {
                        defaultValue: 'Project Mappings',
                      })}
                    </dt>
                    <dd className="text-sm font-medium">
                      {config.projectCount}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Health Status */}
            {syncStatus && (
              <div>
                <h3 className="text-base-content/70 mb-2 text-sm font-semibold tracking-wide uppercase">
                  {t('issueImporters.info.healthStatus', {
                    defaultValue: 'Health Status',
                  })}
                </h3>
                <div className="bg-base-200 rounded-lg p-4">
                  <div className="mb-4 flex items-center gap-3">
                    <LucideIcon
                      className={iconClassName}
                      icon={ConnectivityIcon}
                      size={24}
                    />
                    <div>
                      <p className="font-medium">
                        {String(connectivityStatus || 'unknown')}
                      </p>
                      {syncStatus.lastConnectivityCheck && (
                        <p className="text-base-content/60 text-xs">
                          {t('issueImporters.info.lastChecked', {
                            date: formatDate(syncStatus.lastConnectivityCheck),
                            defaultValue: 'Last checked: {{date}}',
                          })}
                        </p>
                      )}
                    </div>
                  </div>

                  {syncStatus.currentIssue && (
                    <Alert className="mt-3" variant="warning">
                      <div>
                        <p className="text-sm font-medium">
                          {syncStatus.currentIssue.errorCode ||
                            'Issue detected'}
                        </p>
                        {syncStatus.currentIssue.message && (
                          <p className="mt-1 text-xs">
                            {syncStatus.currentIssue.message}
                          </p>
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
                      <dd className="text-sm font-medium">
                        {syncStatus.totalProjectsMapped}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-base-content/70 text-sm">
                        {t('issueImporters.info.totalIssuesSynced', {
                          defaultValue: 'Total Issues Synced',
                        })}
                      </dt>
                      <dd className="text-sm font-medium">
                        {syncStatus.totalIssuesSynced}
                      </dd>
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
                <div className="bg-base-200 overflow-x-auto rounded-lg p-4">
                  <table className="table-sm table">
                    <thead>
                      <tr>
                        <th>
                          {t('issueImporters.info.projectName', {
                            defaultValue: 'Project',
                          })}
                        </th>
                        <th>
                          {t('issueImporters.info.issuesSynced', {
                            defaultValue: 'Issues',
                          })}
                        </th>
                        <th>
                          {t('issueImporters.info.lastSync', {
                            defaultValue: 'Last Sync',
                          })}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {syncStatus.projectStats.map((stat) => (
                        <tr key={stat.projectId}>
                          <td className="text-sm font-medium">
                            {stat.projectName}
                          </td>
                          <td className="text-sm">
                            {stat.totalIssuesSynced || 0}
                          </td>
                          <td className="text-base-content/70 text-sm">
                            {formatDate(stat.lastSyncAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Audit Info */}
            {config.audit && (
              <div>
                <h3 className="text-base-content/70 mb-2 text-sm font-semibold tracking-wide uppercase">
                  {t('issueImporters.info.auditInfo', {
                    defaultValue: 'Audit Information',
                  })}
                </h3>
                <div className="bg-base-200 rounded-lg p-4">
                  <dl className="space-y-2">
                    {config.audit.createdAt && (
                      <div className="flex justify-between">
                        <dt className="text-base-content/70 text-sm">
                          {t('issueImporters.info.createdAt', {
                            defaultValue: 'Created',
                          })}
                        </dt>
                        <dd className="text-sm font-medium">
                          <FormatDate
                            date={config.audit.createdAt}
                            format="fullDateLong"
                          />
                        </dd>
                      </div>
                    )}
                    {config.audit.createdBy && (
                      <div className="flex justify-between">
                        <dt className="text-base-content/70 text-sm">
                          {t('issueImporters.info.createdBy', {
                            defaultValue: 'Created By',
                          })}
                        </dt>
                        <dd className="text-sm font-medium">
                          {getUserName(
                            config.audit.createdBy as ModelsUserStub | string,
                          )}
                        </dd>
                      </div>
                    )}
                    {config.audit.updatedAt && (
                      <div className="flex justify-between">
                        <dt className="text-base-content/70 text-sm">
                          {t('issueImporters.info.updatedAt', {
                            defaultValue: 'Last Updated',
                          })}
                        </dt>
                        <dd className="text-sm font-medium">
                          <FormatDate
                            date={config.audit.updatedAt}
                            format="fullDateLong"
                          />
                        </dd>
                      </div>
                    )}
                    {config.audit.updatedBy && (
                      <div className="flex justify-between">
                        <dt className="text-base-content/70 text-sm">
                          {t('issueImporters.info.updatedBy', {
                            defaultValue: 'Updated By',
                          })}
                        </dt>
                        <dd className="text-sm font-medium">
                          {getUserName(
                            config.audit.updatedBy as ModelsUserStub | string,
                          )}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-2">
          <Button
            className="w-full"
            onClick={onClose}
            type="button"
            variant="secondary"
          >
            {t('actions.close', { defaultValue: 'Close' })}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
