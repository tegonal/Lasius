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

import { ModelsEntityReference } from 'lib/api/lasius';
import { ROLES } from 'projectConfig/constants';
import { useProfile } from 'lib/api/hooks/useProfile';
import { useCallback, useEffect } from 'react';

export const useOrganisation = () => {
  const { profile: data, updateSettings } = useProfile();

  const lastSelectedOrganisationId = data?.settings.lastSelectedOrganisation?.id;

  const selectedOrganisation = data?.organisations.find(
    (org) => org.organisationReference.id === lastSelectedOrganisationId
  );

  const setSelectedOrganisation = useCallback(
    async (organisationReference: ModelsEntityReference) => {
      if (organisationReference) {
        await updateSettings({ lastSelectedOrganisation: organisationReference });
      }
    },
    [updateSettings]
  );

  useEffect(() => {
    if (!data?.settings.lastSelectedOrganisation?.id) {
      const myPrivateOrg = data?.organisations.filter((item) => item.private)[0]
        .organisationReference;
      if (myPrivateOrg) {
        setSelectedOrganisation(myPrivateOrg);
      }
    }
  }, [data, setSelectedOrganisation]);

  return {
    selectedOrganisationId: selectedOrganisation?.organisationReference?.id || '',
    selectedOrganisationKey: selectedOrganisation?.organisationReference?.key || '',
    selectedOrganisation,
    organisations: data?.organisations || [],
    setSelectedOrganisation,
    isAdministrator: selectedOrganisation?.role === ROLES.ORGANISATION_ADMIN,
  };
};
