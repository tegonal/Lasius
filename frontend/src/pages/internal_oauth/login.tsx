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
import { useForm } from 'react-hook-form';
import { Button, Input, Label } from 'theme-ui';
import { isEmailAddress } from 'lib/validators';
import { GetServerSideProps, NextPage } from 'next';
import { FormErrorBadge } from 'components/forms/formErrorBadge';
import { CardContainer } from 'components/cardContainer';
import { LoginLayout } from 'layout/pages/login/loginLayout';
import { Logo } from 'components/logo';
import { FormElement } from 'components/forms/formElement';
import { FormBody } from 'components/forms/formBody';
import { BoxWarning } from 'components/shared/notifications/boxWarning';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Trans, useTranslation } from 'next-i18next';
import { LoginError } from 'dynamicTranslationStrings';
import { logger } from 'lib/logger';
import { TegonalFooter } from 'components/shared/tegonalFooter';
import { BoxInfo } from 'components/shared/notifications/boxInfo';
import { P } from 'components/tags/p';
import { Link } from '@theme-ui/components';
import { LASIUS_DEMO_MODE } from 'projectConfig/constants';
import { usePlausible } from 'next-plausible';
import { LasiusPlausibleEvents } from 'lib/telemetry/plausibleEvents';
import { useStore } from 'storeContext/store';
import { formatISOLocale } from 'lib/dates';
import { LASIUS_API_URL } from 'projectConfig/constants';
import { getConfiguration } from 'lib/api/lasius/general/general';
import { ModelsApplicationConfig } from 'lib/api/lasius';
import { getLoginMutationKey } from 'lib/api/lasius/oauth2-provider/oauth2-provider';

const InternalOAuthLogin: NextPage<{ config: ModelsApplicationConfig }> = ({ config }) => {
  const plausible = usePlausible<LasiusPlausibleEvents>();
  const store = useStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<keyof typeof LoginError>();
  const { t } = useTranslation('common');
  const router = useRouter();
  const {
    email = undefined,
    invitation_id = undefined,
    registered = null,
    redirect_uri = '',
    client_id = '',
    scope = '',
    code_challenge = undefined,
    code_challenge_method = undefined,
    state = undefined,
  } = router.query;

  const {
    register,
    handleSubmit,
    setFocus,
    getValues,
    setValue,
    formState: { errors },
  } = useForm({
    mode: 'onChange',
    defaultValues: { email: email || '', password: '' },
  });

  useEffect(() => {
    setFocus('email');
  }, [setFocus]);

  const onSubmit = async () => {
    plausible('internalOAuthLogin', {
      props: {
        status: 'start',
      },
    });

    const data = getValues();
    setIsSubmitting(true);
    setError(undefined);

    // We need to use fetch here as on client side the
    // browser will automatically follow the redirect when resolving the
    // XHTMLRequest and return this result instead
    const res = await fetch(LASIUS_API_URL + getLoginMutationKey()[0], {
      method: 'POST',
      redirect: 'follow',
      body: JSON.stringify({
        clientId: client_id.toString(),
        email: data.email.toString(),
        password: data.password.toString(),
        redirectUri: redirect_uri.toString(),
        scope: scope.toString(),
        codeChallenge: code_challenge?.toString(),
        codeChallengeMethod: code_challenge_method?.toString(),
        state: state?.toString(),
      }),
      headers: {
        'Content-type': 'application/json; charset=UTF-8',
      },
    });

    setIsSubmitting(false);
    if (res?.status === 401) {
      setError('usernameOrPasswordWrong');
      setValue('password', '');
      setFocus('email');
      plausible('internalOAuthLogin', {
        props: {
          status: 'failed',
        },
      });
      logger.info(res);
    } else if (res?.ok && res?.url) {
      plausible('internalOAuthLogin', {
        props: {
          status: 'success',
        },
      });

      store.dispatch({ type: 'calendar.setSelectedDate', payload: formatISOLocale(new Date()) });

      await router.push(res.url);
    }
  };

  const onRegister = async () => {
    // login user and handle invitation logic again
    const url =
      '/internal_oauth/register?' +
      new URLSearchParams({
        invitation_id: invitation_id?.toString() || '',
        email: email?.toString() || '',
      });
    router.replace(url);
  };

  return (
    <LoginLayout>
      <Logo />
      {error && <BoxWarning>{LoginError[error]}</BoxWarning>}
      {registered && (
        <BoxInfo>
          {t(
            'Thank you for registering. You can now log in using your email address and password. Welcome to Lasius!'
          )}
        </BoxInfo>
      )}
      {LASIUS_DEMO_MODE === 'true' && (
        <BoxInfo>
          <P>
            {t(
              'Welcome to the Lasius demo instance. Use "demo1@lasius.ch" and password "demo" to log in and have a look around. The demo instance is reset once a day.'
            )}
          </P>
          <P>
            <Trans
              t={t}
              i18nKey="We appreciate your feedback. Please leave a comment on <0>GitHub</0>"
              components={[
                <Link key="gitHubLink" target="_blank" href="https://github.com/tegonal/lasius" />,
              ]}
            />
          </P>
        </BoxInfo>
      )}
      <CardContainer>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FormBody>
            <FormElement>
              <Label htmlFor="email">{t('E-Mail')}</Label>
              <Input
                {...register('email', {
                  required: true,
                  validate: { isEmailAddress: (v) => isEmailAddress(v.toString()) },
                })}
                autoComplete="off"
                autoFocus
                type="email"
              />
              <FormErrorBadge error={errors.email} />
            </FormElement>
            <FormElement>
              <Label htmlFor="password">{t('Password')}</Label>
              <Input
                {...register('password', { required: true })}
                type="password"
                autoComplete="off"
              />
              <FormErrorBadge error={errors.password} />
            </FormElement>
            <FormElement>
              <Button disabled={isSubmitting} type="submit">
                {t('Sign in')}
              </Button>
            </FormElement>
          </FormBody>
        </form>
        {config.lasiusOAuthProviderAllowUserRegistration && (
          <FormElement>
            <Button variant="secondary" disabled={isSubmitting} onClick={() => onRegister()}>
              {t('Sign up')}
            </Button>
          </FormElement>
        )}
      </CardContainer>
      <TegonalFooter />
    </LoginLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { locale = '' } = context;
  const config = await getConfiguration();
  return {
    props: {
      config: config,
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
};

export default InternalOAuthLogin;
