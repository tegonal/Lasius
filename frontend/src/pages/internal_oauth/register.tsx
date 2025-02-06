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
import { Box, Button, Input, Label } from 'theme-ui';
import { FormErrorBadge } from 'components/forms/formErrorBadge';
import { useTranslation } from 'next-i18next';
import { CardContainer } from 'components/cardContainer';
import { LoginLayout } from 'layout/pages/login/loginLayout';
import { Logo } from 'components/logo';
import { FormElement } from 'components/forms/formElement';
import { FormBody } from 'components/forms/formBody';
import { BoxWarning } from 'components/shared/notifications/boxWarning';
import { useRouter } from 'next/router';
import { FormErrorsMultiple } from 'components/forms/formErrorsMultiple';
import { Icon } from 'components/shared/icon';
import { BoxInfo } from 'components/shared/notifications/boxInfo';
import { TegonalFooter } from 'components/shared/tegonalFooter';
import { usePlausible } from 'next-plausible';
import { LasiusPlausibleEvents } from 'lib/telemetry/plausibleEvents';
import { registerOAuthUser } from 'lib/api/lasius/oauth2-provider/oauth2-provider';
import { GetServerSideProps, NextPage } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export const OAuthUserRegister: NextPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const [error, setError] = useState('');
  const { t } = useTranslation('common');
  const router = useRouter();
  const { invitation_id = undefined, email = undefined } = router.query;
  const plausible = usePlausible<LasiusPlausibleEvents>();

  const {
    register,
    handleSubmit,
    setFocus,
    getValues,
    formState: { errors },
  } = useForm({
    mode: 'onSubmit',
    criteriaMode: 'all',
    defaultValues: {
      firstName: '',
      lastName: '',
      password: '',
      confirmPassword: '',
      email: email?.toString() || '',
    },
  });

  useEffect(() => {
    if (email) {
      setFocus('firstName');
    } else {
      setFocus('email');
    }
  }, [setFocus, email]);

  const onSubmit = async () => {
    const data = getValues();

    plausible('invitation', {
      props: {
        status: 'registered',
      },
    });

    setIsSubmitting(true);
    const response = await registerOAuthUser({
      firstName: data.firstName,
      lastName: data.lastName,
      password: data.confirmPassword,
      email: data.email,
    });

    if (response) {
      const email = encodeURIComponent(data.email);
      const url =
        '/login?' +
        new URLSearchParams({
          invitation_id: invitation_id?.toString() || '',
          email: email?.toString() || '',
        });
      await router.replace(url);
    } else {
      setError('registerUserFailedUnknown');
    }
    setIsSubmitting(false);
  };

  const handleTogglePasswordsVisible = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setShowPasswords(!showPasswords);
  };

  return (
    <LoginLayout>
      <Logo />
      {error && <BoxWarning>{t(error as any)}</BoxWarning>}
      {invitation_id && (
        <BoxInfo>
          {t(
            'You have been invited to create an account so that you can use Lasius to track your working hours.'
          )}
        </BoxInfo>
      )}
      <CardContainer>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FormBody>
            <FormElement>
              <Label htmlFor="email">{t('E-Mail')}</Label>
              <Input {...register('email', { required: true })} autoComplete="off" autoFocus />
              <FormErrorBadge error={errors.email} />
            </FormElement>
            <FormElement>
              <Label htmlFor="firstName">{t('Firstname')}</Label>
              <Input {...register('firstName', { required: true })} autoComplete="off" autoFocus />
              <FormErrorBadge error={errors.firstName} />
            </FormElement>
            <FormElement>
              <Label htmlFor="lastName">{t('Lastname')}</Label>
              <Input {...register('lastName', { required: true })} autoComplete="off" autoFocus />
              <FormErrorBadge error={errors.lastName} />
            </FormElement>
            <FormElement>
              <Label htmlFor="password">{t('Password')}</Label>
              <Input
                {...register('password', {
                  required: true,
                  validate: {
                    notEnoughCharactersPassword: (value: string) => value.length > 8,
                    noUppercase: (value: string) => /(?=.*[A-Z])/.test(value),
                    noNumber: (value: string) => /\d/.test(value),
                  },
                })}
                autoComplete="off"
                autoFocus
                type={showPasswords ? 'text' : 'password'}
              />
              <FormErrorsMultiple errors={errors.password as any} />
            </FormElement>
            <FormElement>
              <Label htmlFor="email">{t('Confirm password')}</Label>
              <Input
                {...register('confirmPassword', {
                  required: true,
                  validate: {
                    noPasswordConfirmNewEqual: (value: string) => value === getValues('password'),
                  },
                })}
                autoComplete="off"
                autoFocus
                type={showPasswords ? 'text' : 'password'}
              />
              <FormErrorBadge error={errors.confirmPassword} />
            </FormElement>
            <FormElement>
              <Button onClick={handleTogglePasswordsVisible} variant="iconText">
                <Icon
                  name={
                    showPasswords ? 'view-1-interface-essential' : 'view-off-interface-essential'
                  }
                  size={24}
                />
                {showPasswords ? (
                  <Box>{t('Hide passwords')}</Box>
                ) : (
                  <Box>{t('Show passwords')}</Box>
                )}
              </Button>
            </FormElement>
            <FormElement>
              <Button disabled={isSubmitting} type="submit">
                {t('Sign up')}
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
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
};

export default OAuthUserRegister;
