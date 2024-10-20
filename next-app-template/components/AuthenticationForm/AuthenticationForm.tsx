'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; // Используем useRouter для перенаправления
import {
  Anchor,
  Button,
  Divider,
  Group,
  Paper,
  PaperProps,
  PasswordInput,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import $api from '../api/axiosInstance';
import { GoogleButton } from './GoogleButton'; // Кнопка входа через Google

export function AuthenticationForm(props: PaperProps) {
  const router = useRouter(); // Хук для перенаправления
  const [loading, setLoading] = useState(false); // Для отображения статуса загрузки
  const [errorMessage, setErrorMessage] = useState(''); // Для ошибок
  const [successMessage, setSuccessMessage] = useState(''); // Для успешных операций

  const form = useForm({
    initialValues: {
      loginField: '', // Поле для email или userId
      password: '',
    },

    validate: {
      loginField: (val) => (val.trim() ? null : 'Email или ID обязательно'),
      password: (val) =>
        val.length <= 6 ? 'Пароль должен содержать как минимум 6 символов' : null,
    },
  });

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token) {
      // Если токен существует, перенаправляем на страницу профиля
      router.push('/profile');
    }
  }, [router]); // Зависимость на router

  // Функция для обработки входа
  const handleLogin = async (values) => {
    try {
      setLoading(true);
      setErrorMessage('');
      setSuccessMessage('');

      const response = await $api.post('/api/auth/login', {
        loginField: values.loginField, // Поле для email или userId
        password: values.password,
      });

      // Успешный вход
      setSuccessMessage('Вход выполнен успешно!');

      // Сохранение данных в LocalStorage
      localStorage.setItem('token', 'fdsfdsf'); // Сохранение токена
      localStorage.setItem('user', JSON.stringify(response.data.user)); // Сохранение данных пользователя

      // Перенаправление на страницу профиля
      router.push('/profile');
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper
      radius="14"
      maw="460"
      style={{ margin: '100px auto 20px auto' }}
      p="xl"
      withBorder
      {...props}
    >
      <Text size="lg" fw={500}>
        Добро пожаловать в UniDoc, вход через
      </Text>

      <Group grow mb="md" mt="md">
        <GoogleButton radius="xl">Войти через Google</GoogleButton>
      </Group>

      <Divider label="Или продолжите с помощью email или ID" labelPosition="center" my="lg" />

      {errorMessage && (
        <Text color="red" size="sm">
          {errorMessage}
        </Text>
      )}

      {successMessage && (
        <Text color="green" size="sm">
          {successMessage}
        </Text>
      )}

      <form onSubmit={form.onSubmit((values) => handleLogin(values))}>
        <Stack>
          <TextInput
            required
            label="Email или ID"
            placeholder="Введите email или ID"
            value={form.values.loginField}
            onChange={(event) => form.setFieldValue('loginField', event.currentTarget.value)}
            error={form.errors.loginField && 'Email или ID обязательно'}
            radius="md"
          />

          <PasswordInput
            required
            label="Пароль"
            placeholder="Ваш пароль"
            value={form.values.password}
            onChange={(event) => form.setFieldValue('password', event.currentTarget.value)}
            error={form.errors.password && 'Пароль должен содержать как минимум 6 символов'}
            radius="md"
          />
        </Stack>

        <Group style={{ display: 'flex', justifyContent: 'space-between' }} mt="xl">
          <Anchor component="button" type="button" c="dimmed" size="xs">
            Забыли пароль?
          </Anchor>
          <Button
            radius="xl"
            loading={loading}
            onClick={() => handleLogin(form.values)}
            disabled={loading} // Отключаем кнопку, пока идёт загрузка
          >
            {loading ? 'Загрузка...' : 'Войти'}
          </Button>
        </Group>
      </form>
    </Paper>
  );
}
