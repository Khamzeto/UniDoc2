'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; // Для маршрутизации
import { ActionIcon, Box, Burger, Button, Drawer, Group, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { ActionToggle } from '../ActionToggle/ActionToggle';
import { NavbarMobile } from '../NavbarSearch/NavbarMobile';
import { NavbarSearch } from '../NavbarSearch/NavbarSearch'; // Импортируем панель навигации
import classes from './HeaderMegaMenu.module.css';

export function HeaderMegaMenu() {
  const router = useRouter(); // Для маршрутизации
  const [drawerOpened, { open, close }] = useDisclosure(false); // Управляем состоянием дравера
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Проверка токена аутентификации

  // Проверка токена при монтировании компонента
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true); // Если токен есть, пользователь аутентифицирован
    }
  }, []);

  // Функции для маршрутизации
  const handleLogin = () => {
    router.push('/auth'); // Перенаправляем на страницу входа
  };

  const handleSignUp = () => {
    router.push('/auth'); // Перенаправляем на страницу регистрации
  };

  return (
    <Box>
      <header className={classes.header}>
        <Group justify="space-between" h="100%">
          <Text>UniDoc</Text>

          <Group visibleFrom="sm">
            <ActionToggle />
            {/* Показываем кнопки "Войти" и "Регистрация", только если пользователь не аутентифицирован */}
            {!isAuthenticated && (
              <>
                <Button variant="default" onClick={handleLogin}>
                  Войти
                </Button>
              </>
            )}
          </Group>

          {/* Иконка бургера для открытия дравера */}
          <Burger opened={drawerOpened} onClick={open} hiddenFrom="sm" />
        </Group>
      </header>

      {/* Дравер с навигацией */}
      <Drawer opened={drawerOpened} onClose={close} padding="md" maw="300px">
        {/* Внутри дравера отображается панель навигации */}
        <NavbarMobile />
      </Drawer>
    </Box>
  );
}
