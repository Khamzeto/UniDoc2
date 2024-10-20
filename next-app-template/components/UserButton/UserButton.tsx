'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; // Импортируем useRouter для перенаправления
import { IconChevronRight } from '@tabler/icons-react';
import { Avatar, Group, rem, Text, UnstyledButton } from '@mantine/core';
import classes from './UserButton.module.css';

export function UserButton() {
  const [userData, setUserData] = useState({ firstName: '', lastName: '', email: '' });
  const router = useRouter(); // Используем useRouter для навигации

  // Извлекаем данные из localStorage при монтировании компонента
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUserData({
        firstName: parsedUser.firstName || '',
        lastName: parsedUser.lastName || '',
        email: parsedUser.email || '',
      });
    }
  }, []);

  // Функция для обработки клика и перенаправления
  const handleProfileClick = () => {
    router.push('/profile'); // Переход на страницу профиля
  };

  return (
    <UnstyledButton className={classes.user}>
      <Group onClick={handleProfileClick} style={{ cursor: 'pointer' }}>
        {' '}
        {/* Добавляем обработчик клика */}
        <Avatar
          src="https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-8.png"
          radius="xl"
        />
        <div style={{ flex: 1 }}>
          <Text size="sm" fw={500}>
            {userData.firstName} {userData.lastName}
          </Text>

          <Text c="dimmed" size="xs">
            {userData.email}
          </Text>
        </div>
        <IconChevronRight style={{ width: rem(14), height: rem(14) }} stroke={1.5} />
      </Group>
    </UnstyledButton>
  );
}
