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

import React, { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import { ModalConfirm } from 'components/modal/modalConfirm';
import { useTranslation } from 'next-i18next';
import { useProfile } from 'lib/api/hooks/useProfile';
import { Container } from 'theme-ui';
import { LASIUS_TERMSOFSERVICE_VERSION } from 'projectConfig/constants';

import termsofservice from '../../../public/locales/termsofservice.json';

export const LasiusTOSCheck: React.FC = () => {
  const [showAcceptTOSDialog, setShowAcceptTOSDialog] = useState<boolean>(false);
  const { i18n, t } = useTranslation('common');
  const { acceptedTOSVersion, acceptTOS, lasiusIsLoggedIn } = useProfile();

  const currentTOSVersion = LASIUS_TERMSOFSERVICE_VERSION;

  const TOSi18nNamespace = 'termsofservice';
  const TOSi18nKey = 'text';
  if ('addResourceBundle' in i18n) {
    for (const lang in termsofservice) {
      const key = lang as keyof typeof termsofservice;
      i18n.addResourceBundle(lang, TOSi18nNamespace, {
        [TOSi18nKey]: termsofservice[key],
      });
    }
  }

  const handleConfirm = () => {
    acceptTOS(currentTOSVersion);
    setShowAcceptTOSDialog(false);
  };

  const handleCancel = () => {
    signOut();
    setShowAcceptTOSDialog(false);
  };

  useEffect(() => {
    if (lasiusIsLoggedIn && currentTOSVersion && acceptedTOSVersion != currentTOSVersion) {
      setShowAcceptTOSDialog(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acceptedTOSVersion, lasiusIsLoggedIn]);

  return (
    showAcceptTOSDialog && (
      <ModalConfirm
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        text={{
          action: t(
            'Please accept the following Terms of Service (version {{version}}), if you want to continue using Lasius:',
            { version: currentTOSVersion }
          ),
          confirm: t('Accept Terms of Service'),
          cancel: t('Reject and logout'),
        }}
        autoSize={true}
      >
        <Container
          p={3}
          bg="muted"
          sx={{ maxHeight: '400px', overflow: 'scroll' }}
          dangerouslySetInnerHTML={{ __html: t(TOSi18nKey, { ns: TOSi18nNamespace }) }}
        />
      </ModalConfirm>
    )
  );
};
