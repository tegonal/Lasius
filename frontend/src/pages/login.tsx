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
import { FormBody } from 'components/forms/formBody';
import { FormElement } from 'components/forms/formElement';
import { Logo } from 'components/logo';
import { TegonalFooter } from 'components/shared/tegonalFooter';
import { LoginLayout } from 'layout/pages/login/loginLayout';
import { formatISOLocale } from 'lib/dates';
import { LasiusPlausibleEvents } from 'lib/telemetry/plausibleEvents';
import { GetServerSideProps, NextPage } from 'next';
import { getCsrfToken, signIn } from 'next-auth/react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { usePlausible } from 'next-plausible';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useStore } from 'storeContext/store';
import { Button, Label } from 'theme-ui';

const Login: NextPage<{ csrfToken: string }> = ({ csrfToken }) => {
  const plausible = usePlausible<LasiusPlausibleEvents>();
  const store = useStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation('common');
  const router = useRouter();
  const { invitationId = null } = router.query;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    mode: 'onChange',
    defaultValues: { csrfToken },
  });

  const onSubmit = async () => {
    plausible('login', {
      props: {
        status: 'start',
      },
    });

    setIsSubmitting(true);

    const res = await signIn('lasius-internal', {
      redirect: true,
      callbackUrl: '/user/home',
    });

    if (!res?.error && invitationId) {
      await router.replace(`/join/${invitationId}`);
      return;
    }

    if (!res?.error && res?.url) {
      plausible('login', {
        props: {
          status: 'success',
        },
      });

      store.dispatch({ type: 'calendar.setSelectedDate', payload: formatISOLocale(new Date()) });
      await router.push(res.url);
    }

    setIsSubmitting(false);
  };

  // TODO auto-redirect if there is only one provider available

  return (
    <LoginLayout>
      <Logo />
      <CardContainer>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FormBody>
            <FormElement>
              <input
                {...register('csrfToken', { required: true })}
                type="hidden"
                defaultValue={csrfToken}
              />
              <Label>{t('Please choose a login provider')}</Label>
            </FormElement>
            <FormElement>
              <Button disabled={isSubmitting} type="submit">
                {t('Internal Lasius Sign in')}
              </Button>
            </FormElement>
          </FormBody>
        </form>
      </CardContainer>
      <TegonalFooter />
    </LoginLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { locale = '' } = context;
  return {
    props: {
      csrfToken: await getCsrfToken(context),
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
};

export default Login;
