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

import { GetServerSideProps } from 'next';
import { AllProjectsLayout } from 'layout/pages/organisation/projects/allProjectsLayout';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { LayoutDesktop } from 'layout/layoutDesktop';
import { NextPageWithLayout } from 'pages/_app';
import { Error } from 'components/error';
import { isAdminOfCurrentOrg } from 'lib/api/functions/isAdminOfCurrentOrg';
import { ModelsUser } from 'lib/api/lasius';
import { getUserProfile } from 'lib/api/lasius/user/user';
import { getRequestHeaders } from 'lib/api/hooks/useTokensWithAxiosRequests';
import { getServerSession } from 'next-auth';
import { nextAuthOptions } from 'pages/api/auth/[...nextauth]';

const AllProjectsPage: NextPageWithLayout = ({ profile }) => {
  if (isAdminOfCurrentOrg(profile as ModelsUser)) {
    return <AllProjectsLayout />;
  }
  return <Error statusCode={401} />;
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { locale = '' } = context;
  const session = await getServerSession(context.req, context.res, nextAuthOptions);
  const profile = session?.user?.access_token
    ? await getUserProfile(getRequestHeaders(session.user?.access_token))
    : undefined;
  return {
    props: {
      profile,
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
};

AllProjectsPage.getLayout = function getLayout(page) {
  return <LayoutDesktop>{page}</LayoutDesktop>;
};

export default AllProjectsPage;
