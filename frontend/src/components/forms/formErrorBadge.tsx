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

import { Badge, Box } from '@theme-ui/components';
import React from 'react';
import { FieldError, FieldErrors, Merge } from 'react-hook-form';
import { ErrorSign } from 'components/shared/errorSign';
import { FormError } from 'dynamicTranslationStrings';
import { logger } from 'lib/logger';

type Props = { error?: FieldError | Merge<FieldError, FieldErrors<any>> };

export const FormErrorBadge: React.FC<Props> = ({ error }) => {
  if (!error) return null;
  logger.info('[form][FormErrorBadge]', error.type);

  return (
    <Box sx={{ bottom: 0, position: 'absolute', right: 0, transform: 'translate(6px, 50%)' }}>
      <Badge variant="warning">
        <ErrorSign />
        {
          // @ts-expect-error - error.type is a string
          FormError[error.type]
        }
      </Badge>
    </Box>
  );
};
