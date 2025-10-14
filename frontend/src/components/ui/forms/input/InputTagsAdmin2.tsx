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
import { TagList } from 'components/ui/data-display/TagList'
import { ButtonGroup } from 'components/ui/forms/ButtonGroup'
import { FormElement } from 'components/ui/forms/FormElement'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { Modal } from 'components/ui/overlays/modal/Modal'
import { differenceBy, filter, uniqBy } from 'es-toolkit/compat'
import { ModelsSimpleTag } from 'lib/api/lasius'
import { Plus } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React, { useEffect, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { ModelsTags } from 'types/common'

type Props = {
  name: 'tagGroups' | 'simpleTags'
  tags: ModelsTags[] | []
  tagGroupIndex?: number
  hideAddButton?: boolean
  onAddClick?: () => void
}

export const InputTagsAdmin2: React.FC<Props> = ({
  name,
  tags = [],
  tagGroupIndex = 0,
  hideAddButton = false,
  onAddClick,
}) => {
  const { t } = useTranslation('common')
  const parentFormContext = useFormContext()
  const [inputText, setInputText] = useState<string>('')
  const [showAddModal, setShowAddModal] = useState(false)

  const [selectedTags, setSelectedTags] = useState<ModelsTags[]>(tags)

  useEffect(() => {
    if (!parentFormContext) return () => null
    const subscription = parentFormContext.watch((value, { name: fieldname }) => {
      if (name === fieldname) {
        if (
          fieldname === 'tagGroups' &&
          Array.isArray(value[name]) &&
          value[name][tagGroupIndex]?.relatedTags
        ) {
          setSelectedTags(value[name][tagGroupIndex].relatedTags)
        } else {
          setSelectedTags(value[name])
        }
      }
    })
    return () => subscription.unsubscribe()
  }, [name, parentFormContext, tagGroupIndex])

  const updateTags = (tags: ModelsTags[]) => {
    if (name === 'tagGroups') {
      const currentTags = parentFormContext.getValues(name)
      currentTags[tagGroupIndex].relatedTags = tags
      parentFormContext.setValue(name, currentTags)
    } else {
      parentFormContext.setValue(name, tags)
    }
    setSelectedTags(tags)
  }

  const removeTag = (tag: ModelsTags) => {
    const toRemove = filter(selectedTags, { id: tag.id })
    const tags = differenceBy(selectedTags, toRemove, 'id')

    updateTags(tags)
  }

  const addTag = () => {
    if (inputText.trim()) {
      const newTag: ModelsSimpleTag = { id: inputText.trim(), type: 'SimpleTag' }
      const tags = uniqBy([...selectedTags, newTag], 'id')
      setInputText('')
      updateTags(tags)
      setShowAddModal(false)
    }
  }

  if (!parentFormContext) return null

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  const handleAddClick = () => {
    if (onAddClick) {
      onAddClick()
    } else {
      setShowAddModal(true)
    }
  }

  return (
    <div>
      {Array.isArray(selectedTags) && selectedTags.length > 0 && (
        <div className="mb-2">
          <TagList items={selectedTags} clickHandler={removeTag} />
        </div>
      )}

      {!hideAddButton && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleAddClick}
          shape="circle"
          fullWidth={false}>
          <LucideIcon icon={Plus} size={18} />
        </Button>
      )}

      {/* Add Tag Modal */}
      <Modal
        open={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setInputText('')
        }}>
        <FormElement>
          <Label htmlFor="newTag">{t('tags.actions.addTag', { defaultValue: 'Add a tag' })}</Label>
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            placeholder={t('tags.enterTagName', { defaultValue: 'Enter tag name' })}
            autoFocus
          />
        </FormElement>
        <ButtonGroup>
          <Button type="button" variant="primary" onClick={addTag}>
            {t('common.actions.add', { defaultValue: 'Add' })}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setShowAddModal(false)
              setInputText('')
            }}>
            {t('common.actions.close', { defaultValue: 'Close' })}
          </Button>
        </ButtonGroup>
      </Modal>
    </div>
  )
}
