'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Pencil } from 'phosphor-react'; // Иконки
import {
  Avatar,
  Button,
  Container,
  Group,
  Modal,
  Notification,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import $api from '../api/axiosInstance'; // Импортируем API

export default function UserProfile() {
  const [isEditing, setIsEditing] = useState(false); // Флаг редактирования
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null); // Для уведомлений
  const [modalOpen, setModalOpen] = useState(false); // Для модального окна
  const [profile, setProfile] = useState({
    email: '',
    firstName: '',
    lastName: '',
    middleName: '',
    isVerified: false,
    role: '',
  });
  const [isEmailVerified, setIsEmailVerified] = useState(profile.isVerified);

  // Функция для перевода ролей на русский язык
  const translateRole = (role) => {
    switch (role) {
      case 'admin':
        return 'Администратор';
      case 'teacher':
        return 'Преподаватель';
      case 'dean':
        return 'Сотрудник деканата';
      case 'student':
        return 'Студент';
      default:
        return role;
    }
  };

  // Получение данных профиля из localStorage при монтировании
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser) {
      setProfile({
        ...profile,
        firstName: storedUser.firstName,
        lastName: storedUser.lastName,
        email: storedUser.email,
        middleName: storedUser.middleName || '',
        role: storedUser.role,
        userId: storedUser.userId,
        isVerified: storedUser.isVerified,
      });
      setIsEmailVerified(storedUser.isVerified);
    }
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setProfile({ ...profile, [name]: value });
  };

  // Обработчик для отправки письма подтверждения
  const handleEmailVerification = async () => {
    try {
      setIsLoading(true);
      const response = await $api.post('/api/auth/send-verification', { email: profile.email });
      if (response.status === 200) {
        setModalOpen(true); // Открыть модальное окно
      }
    } catch (error) {
      setNotification({
        message: 'Произошла ошибка при отправке письма для подтверждения.',
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Обработчик отправки данных на сервер
  const handleSaveChanges = async () => {
    setIsLoading(true);

    try {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      const userId = storedUser?.userId;

      // Отправляем запрос на обновление профиля
      const response = await $api.put(`/api/auth/update/${userId}`, profile);

      if (response.status === 200) {
        setNotification({
          message: 'Ваши данные успешно обновлены!',
          color: 'green',
        });

        // После обновления профиля делаем запрос для получения актуальных данных и их сохранения в localStorage
        const fetchUpdatedUserData = async () => {
          try {
            const response = await $api.get(`/api/auth/user/${userId}`);
            if (response.status === 200) {
              const updatedUserData = response.data.user;
              localStorage.setItem('user', JSON.stringify(updatedUserData));

              // Обновляем профиль с новыми данными
              setProfile({
                email: updatedUserData.email,
                firstName: updatedUserData.firstName,
                lastName: updatedUserData.lastName,
                middleName: updatedUserData.middleName || '',
                isVerified: updatedUserData.isVerified,
              });

              // Завершаем режим редактирования
              setIsEditing(false);
            }
          } catch (error) {
            console.error('Ошибка при получении обновленных данных пользователя:', error);
          }
        };

        // Вызываем функцию получения обновленных данных
        await fetchUpdatedUserData();
      }
    } catch (error) {
      setNotification({
        message: 'Произошла ошибка при обновлении профиля.',
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container my="xl">
      {/* Уведомление */}
      {notification && (
        <Notification
          color={notification.color}
          onClose={() => setNotification(null)}
          style={{ marginBottom: -50, marginTop: '80px' }}
        >
          {notification.message}
        </Notification>
      )}

      {/* Модальное окно для отправки письма подтверждения */}
      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Подтверждение email"
        centered
        radius="18"
        withCloseButton={false} // Убираем стандартную кнопку закрытия для чистоты дизайна
      >
        <Group
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}
          spacing="md"
          mt="md"
        >
          {/* Галочка в круге */}
          <div
            style={{
              backgroundColor: '#4caf50', // Зеленый цвет для круга
              borderRadius: '50%',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircle size={60} color="white" weight="fill" /> {/* Большая галочка */}
          </div>

          {/* Текст подтверждения */}
          <Text align="center" mt="20" size="lg" weight={500}>
            Ссылка для подтверждения отправлена на вашу почту
          </Text>
        </Group>
      </Modal>

      {/* Блок профиля */}
      <Paper withBorder radius="14" p="xl" mt="80px">
        <Group style={{ display: 'flex', justifyContent: 'center' }}>
          {/* Круглое фото профиля */}
          <Avatar
            src={profile.photoUrl}
            alt="User photo"
            radius="300px"
            size={150}
            style={{ border: '2px solid #ddd' }}
          />
        </Group>

        {/* Информация о пользователе */}
        {isEditing ? (
          <form>
            <Stack align="center" spacing="xs" mt="md">
              <TextInput
                label="Имя"
                name="firstName"
                placeholder="Ваше имя"
                value={profile.firstName}
                onChange={handleChange}
                required
                mb="md"
                w="100%"
              />
              <TextInput
                label="Фамилия"
                name="lastName"
                placeholder="Ваша фамилия"
                value={profile.lastName}
                onChange={handleChange}
                required
                mb="md"
                w="100%"
              />
              <TextInput
                label="Отчество"
                name="middleName"
                placeholder="Ваше отчество"
                value={profile.middleName}
                onChange={handleChange}
                required
                mb="md"
                w="100%"
              />
              <TextInput
                label="Email"
                name="email"
                placeholder="Ваш email"
                value={profile.email}
                onChange={handleChange}
                required
                mb="md"
                w="100%"
                rightSection={
                  <Button
                    w="200px"
                    right="0"
                    pos="absolute"
                    onClick={handleEmailVerification}
                    disabled={isEmailVerified}
                  >
                    {isEmailVerified ? 'Подтверждено' : 'Подтвердить'}
                  </Button>
                }
              />
              <Group w="100%" grow mt="lg">
                <Button
                  radius="9"
                  type="button"
                  loading={isLoading}
                  onClick={handleSaveChanges}
                  w="50%"
                >
                  Сохранить изменения
                </Button>
                <Button radius="9" w="50%" variant="outline" onClick={() => setIsEditing(false)}>
                  Отмена
                </Button>
              </Group>
            </Stack>
          </form>
        ) : (
          <Stack align="center" spacing="xs" mt="md">
            <Title mb={0} order={2}>{`${profile.firstName} ${profile.lastName}`}</Title>
            <Title mt="-10" mb={2} order={2}>{` ${profile.middleName}`}</Title>
            <Text size="sm" color="dimmed">
              Email: {profile.email}
            </Text>
            <Text size="sm" color="dimmed">
              {translateRole(profile.role)} {/* Отображение переведенной роли */}
            </Text>

            <Text size="sm" color={profile.isVerified ? 'green' : 'red'}>
              {profile.isVerified
                ? 'Профиль подтвержден'
                : 'Почта не подтверждена. Пожалуйста, подтвердите свой email.'}
            </Text>

            {/* Кнопка Настройки */}
            <Group w="100%" position="center" mt="xl">
              <Button
                variant="outline"
                leftSection={<Pencil size={18} />}
                onClick={() => setIsEditing(true)}
                radius="9"
                w="100%"
              >
                Редактировать
              </Button>
            </Group>
          </Stack>
        )}
      </Paper>
    </Container>
  );
}
