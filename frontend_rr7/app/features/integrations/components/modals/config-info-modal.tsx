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
import { ModalBody } from '~/components/ui/overlays/modal/modal-body'
import { ModalCloseButton } from '~/components/ui/overlays/modal/modal-close-button'
import { ModalHeader } from '~/components/ui/overlays/modal/modal-header'
import { ModalHelpButton } from '~/features/help/components/help-button'
import { ImporterTypeBadge } from '~/features/integrations/components/importer-type-badge'
import {
  buildMappingStatsGroups,
  type ProjectMapping,
} from '~/features/integrations/lib/mapping-helpers'
import { useProjects } from '~/features/projects/hooks/use-projects'
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

const FormattedDateOrNA = ({ date }: { date?: null | string }) => {
  if (!date) return <>N/A</>
  return <FormatDate date={date} format="fullDateLong" />
}

const getUserName = (user: ModelsUserStub | string | undefined): string => {
  if (!user) return 'N/A'
  if (typeof user === 'string') return user
  const name = `${user.firstName} ${user.lastName}`.trim()
  return name || user.email || user.key
}

const getConnectivityIcon = (status: string) => {
  switch (status) {
    case 'degraded': {
      return { className: 'text-warning', icon: AlertCircle }
    }
    case 'failed': {
      return { className: 'text-error', icon: XCircle }
    }
    case 'healthy': {
      return { className: 'text-success', icon: CheckCircle2 }
    }
    default: {
      return { className: 'text-base-content/50', icon: Clock }
    }
  }
}

export const ConfigInfoModal = ({ config, onClose, open }: Props) => {
  const { t } = useTranslation('integrations')
  const { findProjectById } = useProjects()

  const syncStatus = config?.syncStatus
  const connectivityStatus = syncStatus?.connectivityStatus
  const { className: iconClassName, icon: ConnectivityIcon } =
    getConnectivityIcon(connectivityStatus || '')

  return (
    <Modal onClose={onClose} open={open} size="lg">
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <ModalCloseButton onClose={onClose} />
        <ModalHeader
          actionSlot={<ModalHelpButton helpKey="modal-config-info" />}
          className="mb-0"
        >
          {t('issueImporters.info.title', {
            defaultValue: 'Configuration Info',
          })}
        </ModalHeader>

        {!config && (
          <p className="text-base-content/60 text-sm">
            {t('issueImporters.info.noConfig', {
              defaultValue: 'No configuration selected.',
            })}
          </p>
        )}

        {config && (
          <ModalBody className="space-y-6">
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
                        minutes: Math.round(
                          (config.checkFrequency || 0) / 60_000,
                        ),
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
                        {t(
                          `issueImporters.healthStatus.${connectivityStatus || 'unknown'}`,
                          { defaultValue: connectivityStatus || 'unknown' },
                        )}
                      </p>
                      {syncStatus.lastConnectivityCheck && (
                        <p className="text-base-content/60 text-xs">
                          {t('issueImporters.info.lastChecked', {
                            defaultValue: 'Last checked:',
                          })}{' '}
                          <FormatDate
                            date={syncStatus.lastConnectivityCheck}
                            format="fullDateLong"
                          />
                        </p>
                      )}
                    </div>
                  </div>

                  {syncStatus.currentIssue && (
                    <Alert className="mt-3" variant="warning">
                      <div>
                        <p className="text-sm font-medium">
                          {syncStatus.currentIssue.errorCode ||
                            t('issueImporters.info.issueDetected', {
                              defaultValue: 'Issue detected',
                            })}
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
                          <FormattedDateOrNA
                            date={syncStatus.lastSuccessfulSync}
                          />
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
                          <FormattedDateOrNA
                            date={syncStatus.nextScheduledSync}
                          />
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            )}

            {/* Project Mappings & Sync Statistics */}
            {config.projects && config.projects.length > 0 && (
              <div>
                <h3 className="text-base-content/70 mb-2 text-sm font-semibold tracking-wide uppercase">
                  {t('issueImporters.info.projectStats', {
                    defaultValue: 'Project Statistics',
                  })}
                </h3>
                <div className="space-y-3">
                  {Object.entries(
                    buildMappingStatsGroups(
                      config.importerType as ImporterType,
                      config.projects as ProjectMapping[],
                      syncStatus?.projectStats ?? [],
                    ),
                  ).map(([externalName, entries]) => (
                    <div
                      className="bg-base-200 rounded-lg p-4"
                      key={externalName}
                    >
                      <p className="mb-2 text-sm font-medium">{externalName}</p>
                      <table className="table-sm table">
                        <thead>
                          <tr>
                            <th>
                              {t('issueImporters.info.lasiusProject', {
                                defaultValue: 'Lasius Project',
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
                          {entries.map((entry) => (
                            <tr key={entry.projectId}>
                              <td className="text-sm">
                                {findProjectById(entry.projectId)?.key ??
                                  entry.projectId}
                              </td>
                              <td className="text-sm">
                                {entry.stat
                                  ? entry.stat.totalIssuesSynced || 0
                                  : '—'}
                              </td>
                              <td className="text-base-content/70 text-sm">
                                {entry.stat ? (
                                  <FormattedDateOrNA
                                    date={entry.stat.lastSyncAt}
                                  />
                                ) : (
                                  <span className="text-base-content/40 italic">
                                    {t('issueImporters.info.pendingFirstSync', {
                                      defaultValue: 'Pending first sync',
                                    })}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
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
                          {getUserName(config.audit.createdBy)}
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
                          {getUserName(config.audit.updatedBy)}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            )}
          </ModalBody>
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
