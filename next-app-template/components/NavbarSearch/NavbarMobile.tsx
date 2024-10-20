'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; // Для перенаправления после выхода
import {
  IconChartBar,
  IconClipboardList,
  IconFileText,
  IconForms,
  IconLogout,
  IconNotification,
  IconPlus,
  IconSearch,
  IconTemplate,
  IconUserPlus,
  IconUsers,
} from '@tabler/icons-react';
import {
  ActionIcon,
  Badge,
  Button,
  Code,
  Group,
  rem,
  Text,
  TextInput,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import $api from '../api/axiosInstance'; // Импортируем API для запросов
import { UserButton } from '../UserButton/UserButton';
import classes from './NavbarSearch.module.css';

export function NavbarMobile() {
  const [role, setRole] = useState(null); // Сохраняем роль пользователя
  const router = useRouter(); // Для перенаправления

  // Получаем пользователя и его роль из localStorage
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser && storedUser.role) {
      setRole(storedUser.role);
    } else {
      handleLogout(); // Если пользователя нет в localStorage, перенаправляем на страницу входа
    }
  }, []);

  // Функция для обработки выхода
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/auth'); // Перенаправляем на страницу входа
  };

  // Определяем ссылки на основе роли пользователя
  const getLinksByRole = (role) => {
    switch (role) {
      case 'student':
      case 'teacher':
        return [
          { icon: IconNotification, label: 'Уведомления', notifications: 4, path: '/notification' },
          { icon: IconFileText, label: 'Запрос документа', path: '/document-request' },
          { icon: IconClipboardList, label: 'Мои заявления', path: '/my-requests' },
        ];
      case 'dean':
        return [
          { icon: IconNotification, label: 'Уведомления', notifications: 4, path: '/notification' },
          { icon: IconTemplate, label: 'Создание шаблона', path: '/create-template' },
          { icon: IconForms, label: 'Заявки', path: '/signature-requests' },
          { icon: IconUserPlus, label: 'Добавление пользователей', path: '/add-user' },
        ];
      case 'prorektor':
        return [
          { icon: IconNotification, label: 'Уведомления', notifications: 4, path: '/notification' },
          { icon: IconTemplate, label: 'Создание шаблона', path: '/create-template' },
          { icon: IconUserPlus, label: 'Добавление пользователей', path: '/add-user' },
        ];
      case 'admin':
        return [
          { icon: IconNotification, label: 'Уведомления', notifications: 4, path: '/notification' },
          { icon: IconFileText, label: 'Запрос документа', path: '/document-request' },
          { icon: IconUsers, label: 'Пользователи', path: '/users' },
          { icon: IconChartBar, label: 'Аналитика', path: '/analytics' },
          { icon: IconUserPlus, label: 'Добавление пользователей', path: '/add-user' },
          { icon: IconTemplate, label: 'Создание шаблона', path: '/create-template' },
        ];
      default:
        return [];
    }
  };

  // Коллекции с эмодзи и описаниями
  const collections = [
    { emoji: '📚', label: 'Курсы' },
    { emoji: '🎓', label: 'Выпуск' },
    { emoji: '📝', label: 'Экзамены' },
    { emoji: '🏆', label: 'Достижения' },
    { emoji: '📅', label: 'Расписание' },
    { emoji: '👩‍🏫', label: 'Преподаватели' },
    { emoji: '🏛️', label: 'Факультеты' },
    { emoji: '🧑‍🎓', label: 'Студенты' },
    { emoji: '🔬', label: 'Исследования' },
    { emoji: '🏫', label: 'Мероприятия' },
    { emoji: '📊', label: 'Отчеты' },
    { emoji: '💻', label: 'Онлайн-обучение' },
  ];

  const collectionLinks = collections.map((collection) => (
    <a
      href="#"
      onClick={(event) => event.preventDefault()}
      key={collection.label}
      className={classes.collectionLink}
    >
      <span style={{ marginRight: rem(9), fontSize: rem(16) }}>{collection.emoji}</span>
      {collection.label}
    </a>
  ));

  // Генерация ссылок на основе роли
  const mainLinks = getLinksByRole(role).map((link) => (
    <UnstyledButton
      key={link.label}
      className={classes.mainLink}
      onClick={() => router.push(link.path)}
    >
      <div className={classes.mainLinkInner}>
        <link.icon size={20} className={classes.mainLinkIcon} stroke={1.5} />
        <span>{link.label}</span>
      </div>
      {link.notifications && (
        <Badge size="sm" variant="filled" className={classes.mainLinkBadge}>
          {link.notifications}
        </Badge>
      )}
    </UnstyledButton>
  ));

  return (
    <nav className={classes.navbarMob}>
      <div className={classes.section}>
        <UserButton />
      </div>

      <TextInput
        placeholder="Search"
        size="xs"
        leftSection={<IconSearch style={{ width: rem(12), height: rem(12) }} stroke={1.5} />}
        rightSectionWidth={70}
        rightSection={<Code className={classes.searchCode}>Ctrl + K</Code>}
        styles={{ section: { pointerEvents: 'none' } }}
        mb="sm"
      />

      <div className={classes.section}>
        <div className={classes.mainLinks}>{mainLinks}</div>
      </div>

      <div className={classes.section}>
        <Group className={classes.collectionsHeader} justify="space-between">
          <Text size="xs" fw={500} c="dimmed">
            Коллекции
          </Text>
          <Tooltip label="Создать коллекцию" withArrow position="right">
            <ActionIcon variant="default" size={18}>
              <IconPlus style={{ width: rem(12), height: rem(12) }} stroke={1.5} />
            </ActionIcon>
          </Tooltip>
        </Group>
        <div className={classes.collections}>{collectionLinks}</div>
      </div>

      {/* Кнопка выхода внизу панели */}
      <div style={{ marginTop: '10px auto 0 auto', width: '100%' }}>
        <Button
          fullWidth
          variant="light"
          color="red"
          leftSection={<IconLogout size={16} />}
          onClick={handleLogout}
        >
          Выйти
        </Button>
      </div>
    </nav>
  );
}
