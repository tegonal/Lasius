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

import { Badge } from '@theme-ui/components';
import { useTranslation } from 'next-i18next';
import React from 'react';
import { Box, Flex } from 'theme-ui';
import { flexRowJustifyEndAlignCenter } from 'styles/shortcuts';
import { ErrorSign } from 'components/shared/errorSign';
import { FieldError, FieldErrors, Merge } from 'react-hook-form';
import { FormError } from 'dynamicTranslationStrings';
import { logger } from 'lib/logger';

type Props = { errors?: FieldError | Merge<FieldError, FieldErrors<any>> };

export const FormErrorsMultiple: React.FC<Props> = ({ errors = null }) => {
  const { t } = useTranslation('common');
  if (!errors) return null;
  const { types = {} } = errors;
  logger.warn('[form][FormErrorsMultiple]', errors);
  return (
    <Box sx={{ top: 0, pb: 2, position: 'relative', right: 0 }}>
      <Flex
        sx={{
          ...flexRowJustifyEndAlignCenter(2),
          flexWrap: 'wrap',
          maxWidth: '100%',
        }}
      >
        {Object.keys(types).map((key) => (
          <Badge key={key} sx={{ transform: 'translate(6px, -50%)' }} variant="warning">
            <ErrorSign />
            {/*
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore */}
            {t(FormError[key])}
          </Badge>
        ))}
      </Flex>
    </Box>
  );
};
