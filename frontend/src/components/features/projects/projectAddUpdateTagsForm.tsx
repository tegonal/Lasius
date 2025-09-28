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

import { Button } from 'components/primitives/buttons/Button'
import { Input } from 'components/primitives/inputs/Input'
import { Label } from 'components/primitives/typography/Label'
import { P } from 'components/primitives/typography/Paragraph'
import { Tag } from 'components/ui/data-display/TagList'
import { Alert } from 'components/ui/feedback/Alert'
import { useToast } from 'components/ui/feedback/hooks/useToast'
import { FormBody } from 'components/ui/forms/formBody'
import { FormElement } from 'components/ui/forms/formElement'
import { FormErrorBadge } from 'components/ui/forms/formErrorBadge'
import { InputTagsAdmin } from 'components/ui/forms/input/inputTagsAdmin'
import { preventEnterOnForm } from 'components/ui/forms/input/shared/preventEnterOnForm'
import { Icon } from 'components/ui/icons/Icon'
import { isEqual, noop, unionWith } from 'es-toolkit/compat'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import { ModelsProject, ModelsSimpleTag, ModelsTagGroup, ModelsUserProject } from 'lib/api/lasius'
import { getGetProjectListKey, updateProject } from 'lib/api/lasius/projects/projects'
import {
  getTagsByProject,
  useGetTagsByProject,
} from 'lib/api/lasius/user-organisations/user-organisations'
import { getGetUserProfileKey } from 'lib/api/lasius/user/user'
import { logger } from 'lib/logger'
import { stringHash } from 'lib/utils/string/stringHash'
import { useTranslation } from 'next-i18next'
import { tagGroupTemplate } from 'projectConfig/tagGroupTemplate'
import React, { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useSWRConfig } from 'swr'

type Props = {
  item?: ModelsProject | ModelsUserProject
  mode: 'add' | 'update'
  onSave: () => void
  onCancel: () => void
}

type FormValues = {
  newTagGroupName: string
  tagGroups: ModelsTagGroup[] | []
  simpleTags: ModelsSimpleTag[] | []
}

export const ProjectAddUpdateTagsForm: React.FC<Props> = ({ item, onSave, onCancel, mode }) => {
  const { t } = useTranslation('common')

  const hookForm = useForm<FormValues>({
    defaultValues: {
      newTagGroupName: '',
      tagGroups: [],
      simpleTags: [],
    },
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const { selectedOrganisationId } = useOrganisation()
  const { addToast } = useToast()

  const { mutate } = useSWRConfig()

  const projectId = (item && 'id' in item ? item.id : item?.projectReference.id) || ''
  const projectKey = (item && 'key' in item ? item.key : item?.projectReference.key) || ''
  const projectOrganisationId =
    (item && 'organisationReference' in item
      ? item.organisationReference.id
      : selectedOrganisationId) || selectedOrganisationId

  const bookingCategories = useGetTagsByProject(selectedOrganisationId, projectId)

  useEffect(() => {
    if (item && bookingCategories.data) {
      // filter taggroups and simpletags into separate arrays for editing, we are merging them back together on submit
      const tagGroups = bookingCategories.data.filter((tag) => tag.type === 'TagGroup') as
        | ModelsTagGroup[]
        | []

      const simpleTags = bookingCategories.data.filter((tag) => tag.type === 'SimpleTag') as
        | ModelsSimpleTag[]
        | []

      hookForm.setValue('tagGroups', tagGroups)
      hookForm.setValue('simpleTags', simpleTags)
    }
  }, [bookingCategories.data, hookForm, item, projectKey])

  const onSubmit = async () => {
    setIsSubmitting(true)
    const { simpleTags, tagGroups } = hookForm.getValues()
    const bookingCategories = [...simpleTags, ...tagGroups]
    logger.info('submit', bookingCategories)
    if (mode === 'update' && item) {
      await updateProject(projectOrganisationId, projectId, {
        ...item,
        bookingCategories,
      })
    }
    addToast({
      message: t('projects.status.updated', { defaultValue: 'Project updated' }),
      type: 'SUCCESS',
    })
    await mutate(getGetProjectListKey(projectOrganisationId))
    await mutate(getGetUserProfileKey())
    await mutate(getTagsByProject(selectedOrganisationId, projectId))
    setIsSubmitting(false)
    onSave()
  }

  // useEffect(() => {
  //   const subscription = hookForm.watch((value, { name }) => {
  //     switch (name) {
  //       case 'simpleTags':
  //         if (value.simpleTags) {
  //           logger.info('bookingCategories', value.simpleTags);
  //         }
  //         break;
  //       case 'tagGroups':
  //         if (value.tagGroups) {
  //           logger.info('bookingCategories', value.tagGroups);
  //         }
  //         break;
  //       default:
  //         break;
  //     }
  //   });
  //   return () => subscription.unsubscribe();
  // }, [hookForm]);

  const addTemplate = () => {
    const tagGroups = hookForm.getValues('tagGroups')
    const simpleTags = hookForm.getValues('simpleTags')

    const newTagGroups = tagGroupTemplate.filter((tag) => tag.type === 'TagGroup') as
      | ModelsTagGroup[]
      | []

    const newSimpleTags = tagGroupTemplate.filter((tag) => tag.type === 'SimpleTag') as
      | ModelsSimpleTag[]
      | []

    hookForm.setValue('tagGroups', unionWith(tagGroups, newTagGroups, isEqual))
    hookForm.setValue('simpleTags', unionWith(simpleTags, newSimpleTags, isEqual))

    hookForm.trigger('tagGroups')
    hookForm.trigger('simpleTags')
  }

  const removeTagGroup = (index: number) => {
    const tagGroups = hookForm.getValues('tagGroups')
    tagGroups.splice(index, 1)
    logger.info('tagGroups', tagGroups)
    hookForm.setValue('tagGroups', tagGroups)
    hookForm.trigger('tagGroups')
  }

  const createTagGroup = () => {
    const newTagGroupName = hookForm.getValues('newTagGroupName')
    const tagGroups: ModelsTagGroup[] = hookForm.getValues('tagGroups')
    if (!newTagGroupName) {
      addToast({
        message: t('tags.validation.nameRequired', { defaultValue: 'Tag group name is required' }),
        type: 'ERROR',
      })
      return
    }

    if (tagGroups.find((tagGroup) => tagGroup.id === newTagGroupName)) {
      addToast({
        message: t('tags.validation.tagGroupExists', { defaultValue: 'Tag group already exists' }),
        type: 'ERROR',
      })
      return
    }

    const newTagGroup: ModelsTagGroup = {
      id: newTagGroupName,
      type: 'TagGroup',
      relatedTags: [
        {
          id: 'Billable',
          type: 'SimpleTag',
        },
      ],
    }
    tagGroups.push(newTagGroup)
    hookForm.setValue('tagGroups', tagGroups)
    hookForm.setValue('newTagGroupName', '')
    hookForm.trigger('tagGroups')
  }

  return (
    <FormProvider {...hookForm}>
      <div className="relative w-auto">
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
        <form onSubmit={hookForm.handleSubmit(onSubmit)} onKeyDown={(e) => preventEnterOnForm(e)}>
          <div className="grid w-full grid-cols-[auto_240px] gap-4">
            <div>
              <FormBody>
                <FormElement>
                  <Label htmlFor="simpleTags">
                    {t('tags.tagGroups', { defaultValue: 'Tag groups' })}
                  </Label>
                  {hookForm.getValues('tagGroups').length === 0 && (
                    <div className="flex">
                      <Alert variant="info" className="my-3 max-w-[500px]">
                        {t('tags.description.tagGroups', {
                          defaultValue:
                            'Tag groups allow easy filtering of a large number of bookings without users having to think too much about tagging rules. While adding a booking, a user can choose the tag group and essentially add multiple tags at the same time.',
                        })}
                      </Alert>
                    </div>
                  )}
                  <div className="mt-1 grid w-full grid-cols-3 gap-3">
                    {hookForm.getValues('tagGroups').map((tagGroup: ModelsTagGroup, index) => (
                      <div
                        className="bg-base-200 flex gap-3 rounded-md p-3"
                        key={stringHash({ tagGroup, index })}>
                        <div className="flex-grow">
                          <div className="mb-2 inline-block">
                            <Tag
                              key={tagGroup.id}
                              item={tagGroup}
                              clickHandler={noop}
                              hideRemoveIcon
                            />
                          </div>
                          <InputTagsAdmin
                            tags={tagGroup.relatedTags}
                            name="tagGroups"
                            tagGroupIndex={index}
                          />
                        </div>
                        <div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTagGroup(index)}>
                            <Icon name="bin-2-alternate-interface-essential" size={18} />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <div className="bg-base-200 rounded-md p-3">
                      <FormElement>
                        <P>
                          {t('tags.actions.addTagGroup', { defaultValue: 'Add a new tag group' })}
                        </P>
                      </FormElement>
                      <FormElement>
                        <Label htmlFor="simpleTags">
                          {t('common.forms.name', { defaultValue: 'Name' })}
                        </Label>
                        <Input {...hookForm.register('newTagGroupName')} autoComplete="off" />
                        <FormErrorBadge error={hookForm.formState.errors.newTagGroupName} />
                      </FormElement>
                      <FormElement>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => createTagGroup()}>
                          {t('tags.actions.createTagGroup', { defaultValue: 'Create tag group' })}
                        </Button>
                      </FormElement>
                    </div>
                  </div>
                </FormElement>
                <FormElement>
                  <Label htmlFor="simpleTags">
                    {t('tags.simpleTags', { defaultValue: 'Simple tags' })}
                  </Label>
                  <InputTagsAdmin tags={hookForm.getValues('simpleTags')} name="simpleTags" />
                </FormElement>
              </FormBody>
            </div>
            <div>
              <FormElement>
                <Button type="button" variant="secondary" onClick={() => addTemplate()}>
                  {t('tags.actions.addDefaultTagGroups', {
                    defaultValue: 'Add default tag groups',
                  })}
                </Button>
              </FormElement>
              <div className="h-5" />
              <FormElement>
                <Button type="submit" disabled={isSubmitting} className="relative z-0">
                  {t('common.actions.save', { defaultValue: 'Save' })}
                </Button>
                <Button type="button" variant="secondary" onClick={onCancel}>
                  {t('common.actions.cancel', { defaultValue: 'Cancel' })}
                </Button>
              </FormElement>
            </div>
          </div>
        </form>
      </div>
    </FormProvider>
  )
}
