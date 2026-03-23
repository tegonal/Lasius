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

import { differenceBy, filter, uniqBy } from 'es-toolkit/compat'
import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { Input } from '~/components/primitives/inputs/input'
import { Label } from '~/components/primitives/typography/label'
import { TagList } from '~/components/ui/data-display/tag-list'
import { ButtonGroup } from '~/components/ui/forms/button-group'
import { FormElement } from '~/components/ui/forms/form-element'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { Modal } from '~/components/ui/overlays/modal'
import { type ModelsSimpleTag } from '~/services/api/lasius/modelsSimpleTag'
import { type ModelsTag } from '~/services/api/lasius/modelsTag'

type Props = {
  hideAddButton?: boolean
  name: 'simpleTags' | 'tagGroups'
  onAddClick?: () => void
  tagGroupIndex?: number
  tags: ModelsTag[]
}

export const InputTagsAdmin = ({
  hideAddButton = false,
  name,
  onAddClick,
  tagGroupIndex = 0,
  tags = [],
}: Props) => {
  const { t } = useTranslation('common')
  const parentFormContext = useFormContext()
  const [inputText, setInputText] = useState<string>('')
  const [showAddModal, setShowAddModal] = useState(false)

  const [selectedTags, setSelectedTags] = useState<ModelsTag[]>(tags)

  useEffect(() => {
    if (!parentFormContext) return () => null
    const subscription = parentFormContext.watch(
      (value, { name: fieldname }) => {
        if (name === fieldname) {
          if (
            fieldname === 'tagGroups' &&
            Array.isArray(value[name]) &&
            value[name][tagGroupIndex]?.relatedTags
          ) {
            setSelectedTags(
              value[name][tagGroupIndex].relatedTags as ModelsTag[],
            )
          } else {
            setSelectedTags(value[name] as ModelsTag[])
          }
        }
      },
    )
    return () => subscription.unsubscribe()
  }, [name, parentFormContext, tagGroupIndex])

  const updateTags = (updatedTags: ModelsTag[]) => {
    if (name === 'tagGroups') {
      const currentTags = parentFormContext.getValues(name) as Array<{
        relatedTags: ModelsTag[]
      }>
      const group = currentTags[tagGroupIndex]
      if (group) {
        group.relatedTags = updatedTags
      }
      parentFormContext.setValue(name, currentTags)
    } else {
      parentFormContext.setValue(name, updatedTags)
    }
    setSelectedTags(updatedTags)
  }

  const removeTag = (tag: ModelsTag) => {
    const toRemove = filter(selectedTags, { id: tag.id })
    const remaining = differenceBy(selectedTags, toRemove, 'id')
    updateTags(remaining)
  }

  const addTag = () => {
    if (inputText.trim()) {
      const newTag: ModelsSimpleTag = {
        id: inputText.trim(),
        type: 'SimpleTag',
      }
      const merged = uniqBy([...selectedTags, newTag], 'id')
      setInputText('')
      updateTags(merged)
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
          <TagList clickHandler={removeTag} items={selectedTags} />
        </div>
      )}

      {!hideAddButton && (
        <Button
          fullWidth={false}
          onClick={handleAddClick}
          shape="circle"
          size="sm"
          type="button"
          variant="secondary"
        >
          <LucideIcon icon={Plus} size={18} />
        </Button>
      )}

      {/* Add Tag Modal */}
      <Modal
        onClose={() => {
          setShowAddModal(false)
          setInputText('')
        }}
        open={showAddModal}
      >
        <FormElement>
          <Label htmlFor="newTag">
            {t('tags.actions.addTag', {
              defaultValue: 'Add a tag',
            })}
          </Label>
          <Input
            autoComplete="off"
            autoFocus
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('tags.enterTagName', {
              defaultValue: 'Enter tag name',
            })}
            value={inputText}
          />
        </FormElement>
        <ButtonGroup>
          <Button onClick={addTag} type="button" variant="primary">
            {t('common.actions.add', { defaultValue: 'Add' })}
          </Button>
          <Button
            onClick={() => {
              setShowAddModal(false)
              setInputText('')
            }}
            type="button"
            variant="secondary"
          >
            {t('common.actions.close', {
              defaultValue: 'Close',
            })}
          </Button>
        </ButtonGroup>
      </Modal>
    </div>
  )
}
