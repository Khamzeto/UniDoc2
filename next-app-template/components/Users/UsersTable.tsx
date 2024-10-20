'use client';

import React, { useEffect, useState } from 'react';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import cx from 'clsx';
import { PencilSimple, TrashSimple } from 'phosphor-react'; // Используем Phosphor Icons
import {
  ActionIcon,
  Avatar,
  Button,
  Checkbox,
  Group,
  Modal,
  rem,
  ScrollArea,
  Table,
  Text,
  TextInput,
} from '@mantine/core';
import $api from '../api/axiosInstance'; // Используем ваш $api для запросов
import classes from './TableSelection.module.css';

export function UsersTable() {
  const [selection, setSelection] = useState([]);
  const [users, setUsers] = useState([]);
  const [editUser, setEditUser] = useState(null);
  const [opened, setOpened] = useState(false);
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });

  // Получаем всех пользователей при загрузке компонента
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await $api.get('/api/users');
        setUsers(response.data); // Предполагается, что response.data возвращает массив пользователей
      } catch (error) {
        console.error('Ошибка при получении пользователей:', error);
      }
    };

    fetchUsers();
  }, []);

  const toggleRow = (id) => {
    setSelection((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const toggleAll = () => {
    setSelection((current) =>
      current.length === users.length ? [] : users.map((user) => user._id)
    );
  };

  // Открытие модального окна для редактирования
  const openEditModal = (user) => {
    setEditUser(user);
    setUserData({ firstName: user.firstName, lastName: user.lastName, email: user.email });
    setOpened(true);
  };

  // Закрытие модального окна
  const closeEditModal = () => {
    setOpened(false);
    setEditUser(null);
  };

  // Обновление данных пользователя
  const handleUpdate = async () => {
    try {
      const response = await $api.put(`/api/users/${editUser._id}`, userData);
      setUsers((prev) => prev.map((user) => (user._id === editUser._id ? response.data : user)));
      closeEditModal();
    } catch (error) {
      console.error('Ошибка при обновлении пользователя:', error);
    }
  };

  // Удаление пользователя
  const handleDelete = async (id) => {
    try {
      await $api.delete(`/api/users/${id}`);
      setUsers((prev) => prev.filter((user) => user._id !== id));
    } catch (error) {
      console.error('Ошибка при удалении пользователя:', error);
    }
  };

  const rows = users.map((user) => {
    const selected = selection.includes(user._id);
    return (
      <Table.Tr key={user._id} className={cx({ [classes.rowSelected]: selected })}>
        <Table.Td>
          <Checkbox checked={selected} onChange={() => toggleRow(user._id)} />
        </Table.Td>
        <Table.Td>
          <Group gap="sm">
            <Avatar
              size={26}
              radius={26}
              src={`https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}`}
            />
            <Text size="sm" fw={500}>
              {user.firstName} {user.lastName}
            </Text>
          </Group>
        </Table.Td>
        <Table.Td>{user.email}</Table.Td>
        <Table.Td>{user.role}</Table.Td>
        <Table.Td>
          <Group spacing="xs">
            <ActionIcon color="blue" variant="subtle" onClick={() => openEditModal(user)}>
              <IconPencil size={20} />
            </ActionIcon>
            <ActionIcon color="red" variant="subtle" onClick={() => handleDelete(user._id)}>
              <IconTrash size={20} />
            </ActionIcon>
          </Group>
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <>
      <ScrollArea w="88%">
        <Table verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={{ width: rem(40) }}>
                <Checkbox
                  onChange={toggleAll}
                  checked={selection.length === users.length}
                  indeterminate={selection.length > 0 && selection.length !== users.length}
                />
              </Table.Th>
              <Table.Th>Пользователь</Table.Th>
              <Table.Th>Email</Table.Th>
              <Table.Th>Роль</Table.Th>
              <Table.Th>Действия</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      </ScrollArea>

      {/* Модальное окно для редактирования */}
      <Modal opened={opened} onClose={closeEditModal} title="Редактировать пользователя" centered>
        <TextInput
          label="Имя"
          placeholder="Имя"
          value={userData.firstName}
          onChange={(e) => setUserData({ ...userData, firstName: e.target.value })}
          mb="sm"
        />
        <TextInput
          label="Фамилия"
          placeholder="Фамилия"
          value={userData.lastName}
          onChange={(e) => setUserData({ ...userData, lastName: e.target.value })}
          mb="sm"
        />
        <TextInput
          label="Email"
          placeholder="Email"
          value={userData.email}
          onChange={(e) => setUserData({ ...userData, email: e.target.value })}
          mb="sm"
        />
        <Group position="right" mt="md">
          <Button variant="outline" onClick={handleUpdate}>
            Сохранить изменения
          </Button>
        </Group>
      </Modal>
    </>
  );
}
