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
import { StatsLayout } from 'layout/pages/organisation/stats/statsLayout';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { LayoutDesktop } from 'layout/layoutDesktop';
import { NextPageWithLayout } from 'pages/_app';
import { Error } from 'components/error';
import { getUserProfile } from 'lib/api/lasius/user/user';
import { isAdminOfCurrentOrg } from 'lib/api/functions/isAdminOfCurrentOrg';
import { ModelsUser } from 'lib/api/lasius';
import { getRequestHeaders } from 'lib/api/hooks/useTokensWithAxiosRequests';
import { getServerSession } from 'next-auth';
import { nextAuthOptions } from 'pages/api/auth/[...nextauth]';

const StatsPage: NextPageWithLayout = ({ profile }) => {
  if (isAdminOfCurrentOrg(profile as ModelsUser)) {
    return <StatsLayout />;
  }
  return <Error statusCode={401} />;
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { locale = '' } = context;
  const session = await getServerSession(context.req, context.res, nextAuthOptions);
  const profile = session?.access_token
    ? await getUserProfile(getRequestHeaders(session.access_token, session.access_token_issuer)
  )
    : undefined;
  return {
    props: {
      profile,
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
};

StatsPage.getLayout = function getLayout(page) {
  return <LayoutDesktop>{page}</LayoutDesktop>;
};

export default StatsPage;
