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

'use server';
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
import { ColorModeToggle } from 'components/colorModeToggle';
import { HelpButton } from 'components/help';
import { Logo } from 'components/logo';
import { Icon } from 'components/shared/icon';
import { BoxInfo } from 'components/shared/notifications/boxInfo';
import { BoxWarning } from 'components/shared/notifications/boxWarning';
import { TegonalFooter } from 'components/shared/tegonalFooter';
import { t } from 'i18next';
import { LoginLayout } from 'layout/pages/login/loginLayout';
import { getConfiguration } from 'lib/api/lasius/general/general';
import { formatISOLocale } from 'lib/dates';
import { LasiusPlausibleEvents } from 'lib/telemetry/plausibleEvents';
import { GetServerSidePropsContext, NextPage } from 'next';
import { getProviders, getCsrfToken, signIn, ClientSafeProvider } from 'next-auth/react';
import { Trans, useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { usePlausible } from 'next-plausible';
import Image from 'next/image';
import { useRouter } from 'next/router';
import {
  AUTH_PROVIDER_CUSTOMER_KEYCLOAK,
  AUTH_PROVIDER_INTERNAL_LASIUS,
} from 'projectConfig/constants';
import { useCallback, useEffect, useState } from 'react';
import { useStore } from 'storeContext/store';
import { Button, Flex } from 'theme-ui';

type CustomizedClientSafeProvider = ClientSafeProvider & {
  custom_logo: string | null;
};

// list of known error response codes, used tp provide translations only
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const loginErrorTranslations = [t('fetchProfileFailed'), t('OAuthCallbackError')];

const Login: NextPage<{
  csrfToken: string;
  providers: CustomizedClientSafeProvider[];
  locale?: string;
  defaultLocale?: string;
}> = ({ csrfToken, providers, locale, defaultLocale }) => {
  const plausible = usePlausible<LasiusPlausibleEvents>();
  const store = useStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation('common');
  const router = useRouter();
  const { invitation_id = null, email = null, error = null, callbackUrl = null } = router.query;

  const signInToProvider = useCallback(
    async (provider: string) => {
      plausible('login', {
        props: {
          status: 'start',
          provider: provider,
        },
      });

      setIsSubmitting(true);

      const localePath = `${locale ? '/' + locale : ''}`;
      const resolvedCallbackUrl = invitation_id
        ? `${localePath}/join/${invitation_id}`
        : callbackUrl?.toString() || `${localePath}/user/home`;
      const res = await signIn(
        provider,
        {
          csrfToken: csrfToken,
          redirect: false,
          callbackUrl: resolvedCallbackUrl,
        },
        new URLSearchParams({
          email: email?.toString() || '',
          invitation_id: invitation_id?.toString() || '',
          locale: locale || defaultLocale || '',
          // so far we need to add the keycloak specific query parameter here as there is no other possiblity to map the locale somewhere else
          kc_locale: locale || defaultLocale || '',
        })
      );

      setIsSubmitting(false);

      if (!res?.error && res?.url) {
        plausible('login', {
          props: {
            status: 'success',
            provider: provider,
          },
        });

        store.dispatch({ type: 'calendar.setSelectedDate', payload: formatISOLocale(new Date()) });
        await router.push(res.url);
      }
    },
    [csrfToken, email, invitation_id, plausible, router, store, locale, defaultLocale, callbackUrl]
  );

  useEffect(() => {
    if (providers.length === 1 && !error) {
      signInToProvider(providers[0].id);
    }
  }, [providers, signInToProvider, error]);

  if (providers.length === 1 && !error) {
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
        {error && (
          <BoxWarning>
            <Trans>{error}</Trans>
          </BoxWarning>
        )}
        {providers.length === 0 && (
          <BoxWarning>{t('No authentication provider available')}</BoxWarning>
        )}
        {providers.length > 0 && (
          <CardContainer
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              background: 'containerBackgroundDarker',
            }}
          >
            <Flex sx={{ alignItems: 'center', gap: 2, justifyContent: 'flex-end' }}>
              <ColorModeToggle />
              <HelpButton />
            </Flex>
            {providers.length > 1 && <BoxInfo>{t('Please choose a login provider')}</BoxInfo>}
            {providers.map((provider) => {
              let icon = undefined;
              const size = 40;
              if (provider.custom_logo) {
                icon = (
                  <Image
                    alt={provider.name}
                    src={provider.custom_logo}
                    width={size}
                    height={size}
                  />
                );
              } else {
                switch (provider.id) {
                  case AUTH_PROVIDER_INTERNAL_LASIUS:
                    icon = <Icon name="lasius" size={size} />;
                    break;
                  case 'gitlab':
                    icon = <Icon name="gitlab" size={size} color="none" />;
                    break;
                  case 'github':
                    icon = <Icon name="github" size={size} color="black" />;
                    break;
                  case AUTH_PROVIDER_CUSTOMER_KEYCLOAK:
                    icon = <Icon name="keycloak" size={size} />;
                    break;
                }
              }

              return (
                <Button
                  key={provider.id}
                  disabled={isSubmitting}
                  onClick={() => signInToProvider(provider.id)}
                  variant="secondary"
                  style={{ padding: 25 }}
                >
                  {icon}
                  {t('Sign in with ')}
                  <Trans t={t}>{provider.name}</Trans>
                </Button>
              );
            })}
          </CardContainer>
        )}
        <TegonalFooter />
      </LoginLayout>
    );
  }
};

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { locale, query, defaultLocale } = context;
  const resolvedLocale = query.locale?.toString() || locale;
  const providers = Object.values((await getProviders()) || []);
  const config = await getConfiguration();
  const availableProviders = providers
    .filter((p) => p.id !== AUTH_PROVIDER_INTERNAL_LASIUS || config.lasiusOAuthProviderEnabled)
    .map((p) => {
      if (p.id === AUTH_PROVIDER_CUSTOMER_KEYCLOAK) {
        (p as CustomizedClientSafeProvider).custom_logo =
          process.env.KEYCLOAK_OAUTH_PROVIDER_ICON || null;
      } else {
        (p as CustomizedClientSafeProvider).custom_logo = null;
      }
      return p;
    });

  return {
    props: {
      csrfToken: await getCsrfToken(context),
      providers: availableProviders,
      ...(await serverSideTranslations(resolvedLocale || '', ['common'])),
      locale: resolvedLocale,
      defaultLocale,
    },
  };
}

export default Login;
