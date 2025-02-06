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

import { CardContainer } from 'components/cardContainer';
import { Logo } from 'components/logo';
import { BoxInfo } from 'components/shared/notifications/boxInfo';
import { TegonalFooter } from 'components/shared/tegonalFooter';
import { LoginLayout } from 'layout/pages/login/loginLayout';
import { getConfiguration } from 'lib/api/lasius/general/general';
import { formatISOLocale } from 'lib/dates';
import { LasiusPlausibleEvents } from 'lib/telemetry/plausibleEvents';
import { GetServerSideProps, NextPage } from 'next';
import {
  getProviders,
  getCsrfToken,
  signIn,
  ClientSafeProvider,
  useSession,
} from 'next-auth/react';
import { Trans, useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { usePlausible } from 'next-plausible';
import { useRouter } from 'next/router';
import { AUTH_PROVIDER_INTERNAL_LASIUS } from 'projectConfig/constants';
import { useEffect, useState } from 'react';
import { useStore } from 'storeContext/store';
import { Button } from 'theme-ui';

const Login: NextPage<{ csrfToken: string; providers: ClientSafeProvider[] }> = ({
  csrfToken,
  providers,
}) => {
  const plausible = usePlausible<LasiusPlausibleEvents>();
  const store = useStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation('common');
  const router = useRouter();
  const { update } = useSession();
  const { invitation_id = null, email = null } = router.query;

  const signInToProvider = async (provider: string) => {
    plausible('login', {
      props: {
        status: 'start',
        provider: provider,
      },
    });

    setIsSubmitting(true);

    const callbackUrl = invitation_id ? '/join/' + invitation_id : '/user/home';
    const res = await signIn(
      provider,
      {
        csrfToken: csrfToken,
        redirect: false,
        callbackUrl: callbackUrl,
      },
      new URLSearchParams({
        email: email?.toString() || '',
        invitation_id: invitation_id?.toString() || '',
      })
    );

    if (!res?.error && res?.url) {
      plausible('login', {
        props: {
          status: 'success',
          provider: provider,
        },
      });

      // update session manually
      update();

      store.dispatch({ type: 'calendar.setSelectedDate', payload: formatISOLocale(new Date()) });
      await router.push(res.url);
    }

    setIsSubmitting(false);
  };

  useEffect(() => {
    if (providers.length === 1) {
      // why does this trigger an endless loop?
      //signInToProvider(providers[0].id)
    }
  }, [providers.length]);

  //if (providers.length === 1) {
  if (providers.length === 0) {
    return (
      <LoginLayout>
        <Logo />
        <BoxInfo>{t('Prepare login...')}</BoxInfo>
      </LoginLayout>
    );
  } else {
    return (
      <LoginLayout>
        <Logo />
        <BoxInfo>{t('Please choose a login provider')}</BoxInfo>
        <CardContainer>
          {providers.map((provider) => (
            <Button
              key={provider.name}
              disabled={isSubmitting}
              onClick={() => signInToProvider(provider.id)}
            >
              <Trans t={t}>{provider.name}</Trans>
            </Button>
          ))}
        </CardContainer>
        <TegonalFooter />
      </LoginLayout>
    );
  }
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { locale = '' } = context;
  const providers = Object.values((await getProviders()) || []);
  const config = await getConfiguration();
  const availableProviders = providers.filter(
    (p) => p.id !== AUTH_PROVIDER_INTERNAL_LASIUS || config.lasiusOAuthProviderEnabled
  );

  return {
    props: {
      csrfToken: await getCsrfToken(context),
      providers: availableProviders,
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
};

export default Login;
