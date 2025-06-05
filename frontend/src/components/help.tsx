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
import { Button } from '@theme-ui/components';
import { Icon } from 'components/shared/icon';
import { usePlausible } from 'next-plausible';
import { LasiusPlausibleEvents } from 'lib/telemetry/plausibleEvents';
import { useTranslation } from 'next-i18next';

export const HelpButton: React.FC = () => {
  const plausible = usePlausible<LasiusPlausibleEvents>();
  const { i18n } = useTranslation();

  const openDocumentation = () => {
    plausible('uiAction', {
      props: {
        name: 'helpButton',
      },
    });

    const prefix = i18n.language === 'de' ? 'DE%3A' : '';

    window.open('https://github.com/tegonal/Lasius/wiki/' + prefix + 'Home', '_blank');
  };

  return (
    <Button
      variant="iconMuted"
      sx={{ label: 'HelpButton', width: 'auto' }}
      onClick={openDocumentation}
    >
      <Icon name="question-circle" size={24} />
    </Button>
  );
};
