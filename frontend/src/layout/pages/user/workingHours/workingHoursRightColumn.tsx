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

import React from 'react';
import { Box, Heading, Paragraph } from 'theme-ui';
import { useTranslation } from 'next-i18next';

export const WorkingHoursRightColumn: React.FC = () => {
  const { t } = useTranslation('common');
  return (
    <Box sx={{ width: '100%', px: 4, pt: 3 }}>
      <Heading as="h2" variant="heading">
        {t('Working hours')}
      </Heading>
      <Paragraph variant="infoText">
        {t(
          'The amount of time per day you expect to book, by organization, during a typical work week. This data is used to calculate your daily and weekly progress.'
        )}
      </Paragraph>
    </Box>
  );
};
