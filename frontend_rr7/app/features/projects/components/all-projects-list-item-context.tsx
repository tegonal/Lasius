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

import { Archive, List, Pencil, PieChart, Tags, Users } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useRevalidator } from 'react-router'

import { Button } from '~/components/primitives/buttons/button'
import { ButtonGroup } from '~/components/ui/forms/button-group'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { Modal } from '~/components/ui/overlays/modal/modal'
import { ModalDescription } from '~/components/ui/overlays/modal/modal-description'
import { ContextButtonClose } from '~/features/context-menu/buttons/context-button-close'
import { ContextButtonOpen } from '~/features/context-menu/buttons/context-button-open'
import { ContextAnimatePresence } from '~/features/context-menu/context-animate-presence'
import { ContextBar } from '~/features/context-menu/context-bar'
import { ContextBarDivider } from '~/features/context-menu/context-bar-divider'
import { ContextBody } from '~/features/context-menu/context-body'
import { ContextButtonWrapper } from '~/features/context-menu/context-button-wrapper'
import { useContextMenu } from '~/features/context-menu/hooks/use-context-menu'
import { ManageProjectMembers } from '~/features/projects/components/manage-members'
import { ProjectAddUpdateForm } from '~/features/projects/components/project-add-update-form'
import { ProjectAddUpdateTagsForm } from '~/features/tag-manager/components/project-add-update-tags-form'
import { useDeactivateProject } from '~/services/api/lasius-hooks/projects/projects'
import { type ModelsProject } from '~/services/api/lasius/modelsProject'

type Props = {
  item: ModelsProject
}

export const AllProjectsListItemContext = ({ item }: Props) => {
  const [isUpdateOpen, setIsUpdateOpen] = useState(false)
  const [isManageOpen, setIsManageOpen] = useState(false)
  const [isTagOpen, setIsTagOpen] = useState(false)
  const [isDeactivateConfirmOpen, setIsDeactivateConfirmOpen] = useState(false)
  const { currentOpenContextMenuId, handleCloseAll } = useContextMenu()
  const navigate = useNavigate()
  const revalidator = useRevalidator()
  const { submit: deactivateProject } = useDeactivateProject()

  const { t } = useTranslation()

  const handleUpdateClose = () => setIsUpdateOpen(false)
  const handleManageClose = () => setIsManageOpen(false)
  const handleTagClose = () => setIsTagOpen(false)
  const handleDeactivateConfirmClose = () => setIsDeactivateConfirmOpen(false)

  const showStats = () => {
    void navigate(
      `/organisation/stats?projectId=${item.id}&projectName=${encodeURIComponent(item.key)}`,
    )
    handleCloseAll()
  }

  const showLists = () => {
    void navigate(
      `/organisation/lists?projectId=${item.id}&projectName=${encodeURIComponent(item.key)}`,
    )
    handleCloseAll()
  }

  const showDeactivateConfirm = () => {
    setIsDeactivateConfirmOpen(true)
    handleCloseAll()
  }

  const handleDeactivateProject = async () => {
    await deactivateProject({
      orgId: item.organisationReference.id,
      projectId: item.id,
    })
    void revalidator.revalidate()
    setIsDeactivateConfirmOpen(false)
  }

  const manageMembers = () => {
    setIsManageOpen(true)
    handleCloseAll()
  }

  const manageTags = () => {
    setIsTagOpen(true)
    handleCloseAll()
  }

  const editProject = () => {
    setIsUpdateOpen(true)
    handleCloseAll()
  }

  return (
    <>
      <ContextBody variant="compact">
        <ContextButtonOpen hash={item.id} />
        {currentOpenContextMenuId === item.id && (
          <ContextAnimatePresence variant="compact">
            <ContextBar>
              {item.active && (
                <ContextButtonWrapper variant="compact">
                  <Button
                    aria-label={t(
                      'organisation:members.actions.manage',
                      'Manage members',
                    )}
                    fullWidth={false}
                    onClick={() => manageMembers()}
                    shape="circle"
                    title={t(
                      'organisation:members.actions.manage',
                      'Manage members',
                    )}
                    variant="contextIcon"
                  >
                    <LucideIcon icon={Users} size={24} />
                  </Button>
                </ContextButtonWrapper>
              )}
              <ContextButtonWrapper variant="compact">
                <Button
                  aria-label={t('bookings:showLists', 'Show bookings')}
                  fullWidth={false}
                  onClick={() => showLists()}
                  shape="circle"
                  title={t('bookings:showLists', 'Show bookings')}
                  variant="contextIcon"
                >
                  <LucideIcon icon={List} size={24} />
                </Button>
              </ContextButtonWrapper>
              <ContextButtonWrapper variant="compact">
                <Button
                  aria-label={t('stats:showStatistics', 'Show statistics')}
                  fullWidth={false}
                  onClick={() => showStats()}
                  shape="circle"
                  title={t('stats:showStatistics', 'Show statistics')}
                  variant="contextIcon"
                >
                  <LucideIcon icon={PieChart} size={24} />
                </Button>
              </ContextButtonWrapper>
              <ContextButtonWrapper variant="compact">
                {!item.active && item.deactivatedBy ? (
                  <span
                    title={t('projects:deactivatedBy', 'Archived by {{user}}', {
                      user: item.deactivatedBy.key,
                    })}
                  >
                    <Button
                      aria-label={t('projects:actions.edit', {
                        defaultValue: 'Edit project',
                      })}
                      fullWidth={false}
                      onClick={() => editProject()}
                      shape="circle"
                      title={t('projects:actions.edit', {
                        defaultValue: 'Edit project',
                      })}
                      variant="contextIcon"
                    >
                      <LucideIcon icon={Pencil} size={24} />
                    </Button>
                  </span>
                ) : (
                  <Button
                    aria-label={t('projects:actions.edit', {
                      defaultValue: 'Edit project',
                    })}
                    fullWidth={false}
                    onClick={() => editProject()}
                    shape="circle"
                    title={t('projects:actions.edit', {
                      defaultValue: 'Edit project',
                    })}
                    variant="contextIcon"
                  >
                    <LucideIcon icon={Pencil} size={24} />
                  </Button>
                )}
              </ContextButtonWrapper>
              {item.active && (
                <>
                  <ContextButtonWrapper variant="compact">
                    <Button
                      aria-label={t('tag-manager:actions.edit', {
                        defaultValue: 'Edit tags',
                      })}
                      fullWidth={false}
                      onClick={() => manageTags()}
                      shape="circle"
                      title={t('tag-manager:actions.edit', {
                        defaultValue: 'Edit tags',
                      })}
                      variant="contextIcon"
                    >
                      <LucideIcon icon={Tags} size={24} />
                    </Button>
                  </ContextButtonWrapper>
                  <ContextButtonWrapper variant="compact">
                    <Button
                      aria-label={t('projects:actions.deactivate', {
                        defaultValue: 'Deactivate project',
                      })}
                      fullWidth={false}
                      onClick={() => showDeactivateConfirm()}
                      shape="circle"
                      title={t('projects:actions.deactivate', {
                        defaultValue: 'Deactivate project',
                      })}
                      variant="contextIcon"
                    >
                      <LucideIcon icon={Archive} size={24} />
                    </Button>
                  </ContextButtonWrapper>
                </>
              )}
              <ContextBarDivider />
              <ContextButtonClose variant="compact" />
            </ContextBar>
          </ContextAnimatePresence>
        )}
      </ContextBody>
      <Modal onClose={handleUpdateClose} open={isUpdateOpen}>
        <ProjectAddUpdateForm
          item={item}
          mode="update"
          onCancel={handleUpdateClose}
          onSave={handleUpdateClose}
        />
      </Modal>
      <Modal onClose={handleTagClose} open={isTagOpen} size="lg">
        <ProjectAddUpdateTagsForm
          item={item}
          mode="update"
          onCancel={handleTagClose}
          onSave={handleTagClose}
        />
      </Modal>
      <Modal onClose={handleManageClose} open={isManageOpen} size="xl">
        <ManageProjectMembers
          item={item}
          onCancel={handleManageClose}
          onSave={handleManageClose}
        />
      </Modal>
      <Modal
        onClose={handleDeactivateConfirmClose}
        open={isDeactivateConfirmOpen}
      >
        <ModalDescription>
          {t(
            'projects:actions.deactivateConfirm',
            'Are you sure you want to deactivate the project "{{project}}"?',
            {
              project: item.key,
            },
          )}
        </ModalDescription>
        <ButtonGroup>
          <Button
            onClick={() => void handleDeactivateProject()}
            type="button"
            variant="primary"
          >
            {t('projects:actions.deactivate', 'Deactivate project')}
          </Button>
          <Button
            onClick={handleDeactivateConfirmClose}
            type="button"
            variant="secondary"
          >
            {t('cancel', 'Cancel')}
          </Button>
        </ButtonGroup>
      </Modal>
    </>
  )
}
