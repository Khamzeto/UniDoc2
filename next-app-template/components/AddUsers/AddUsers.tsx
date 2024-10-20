'use client';

import { useState } from 'react';
import { saveAs } from 'file-saver';
import {
  CheckCircle,
  FileCsv,
  FileXls,
  FloppyDisk,
  PencilSimple,
  TrashSimple,
  UserCircle,
} from 'phosphor-react';
// Импорт Phosphor Icons

import * as XLSX from 'xlsx';
import {
  ActionIcon,
  Box,
  Button,
  Container,
  Divider,
  FileInput,
  Group,
  Modal,
  Paper,
  ScrollArea,
  Select,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { showNotification } from '@mantine/notifications'; // Для уведомлений
import $api from '../api/axiosInstance'; // Импортируем настроенный $api для отправки запросов
import classes from './AddUsers.module.css';

export function AddUsersPage() {
  const [users, setUsers] = useState([]); // Список пользователей
  const [editingIndex, setEditingIndex] = useState(null); // Индекс редактируемого пользователя
  const [confirmModalOpen, setConfirmModalOpen] = useState(false); // Для подтверждающего модального окна

  // Форма для добавления/редактирования пользователя вручную
  const form = useForm({
    initialValues: {
      firstName: '',
      lastName: '',
      middleName: '',
      role: 'student', // Значение по умолчанию
    },
    validate: {
      firstName: (value) => (value.length > 0 ? null : 'Имя обязательно'),
      lastName: (value) => (value.length > 0 ? null : 'Фамилия обязательна'),
      role: (value) => (value ? null : 'Роль обязательна'),
    },
  });

  // Генерация уникального ID из 8 цифр
  const generateUniqueId = () => {
    return Math.floor(10000000 + Math.random() * 90000000); // Генерация случайного 8-значного числа
  };

  // Генерация уникального пароля
  const generateUniquePassword = () => {
    return Math.random().toString(36).slice(-8); // Случайный пароль из 8 символов
  };

  // Обработчик добавления пользователя вручную
  const handleAddUser = (values) => {
    const password = generateUniquePassword(); // Генерация уникального пароля
    const newUser = {
      ...values,
      password,
      id: generateUniqueId(), // Генерация уникального ID
    };

    if (editingIndex !== null) {
      const updatedUsers = [...users];
      updatedUsers[editingIndex] = { ...newUser, id: users[editingIndex].id }; // Сохраняем ID
      setUsers(updatedUsers);
      setEditingIndex(null);
    } else {
      setUsers((prev) => [...prev, newUser]);
    }

    form.reset();
  };

  // Удаление пользователя
  const handleDeleteUser = (index) => {
    const updatedUsers = users.filter((_, i) => i !== index);
    setUsers(updatedUsers);
  };

  // Обработчик загрузки файла Excel/CSV
  const handleFileUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

      const newUsers = sheet.map((row) => ({
        firstName: row.Имя || '', // Поле "Имя"
        lastName: row.Фамилия || '', // Поле "Фамилия"
        middleName: row.Отчество || '', // Поле "Отчество"
        role: row.Роль || 'student', // Поле "Роль"
        password: generateUniquePassword(), // Генерация пароля
        id: generateUniqueId(), // Генерация уникального ID
      }));

      setUsers((prev) => [...prev, ...newUsers]);
    };
    reader.readAsBinaryString(file);
  };

  // Экспорт в CSV/Excel с нужными полями
  const exportToCSVOrExcel = (format) => {
    const exportData = users.map((user) => ({
      Фамилия: user.lastName,
      Имя: user.firstName,
      Отчество: user.middleName || '',
      ID: user.id,
      Пароль: user.password,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Users');

    const fileType = format === 'csv' ? 'csv' : 'xlsx';
    const excelBuffer = XLSX.write(wb, { bookType: fileType, type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, `users.${fileType}`);
  };

  // Отправка всех пользователей на сервер через $api
  const handleSubmitAllUsers = async () => {
    try {
      const response = await $api.post('/api/auth/registerMany', users);

      if (response.status === 201) {
        showNotification({
          title: 'Успех!',
          message: 'Все пользователи успешно зарегистрированы!',
          color: 'green',
          icon: <CheckCircle size={20} />,
        });
        setUsers([]); // Очищаем список пользователей после успешной регистрации
      } else {
        console.error('Ошибка:', response.data.message);
        showNotification({
          title: 'Ошибка!',
          message: 'Ошибка при регистрации пользователей',
          color: 'red',
        });
      }
    } catch (error) {
      console.error('Ошибка запроса:', error);
      showNotification({
        title: 'Ошибка!',
        message: 'Произошла ошибка при регистрации пользователей',
        color: 'red',
      });
    }
  };

  // Начать редактирование пользователя
  const handleEditUser = (index) => {
    const user = users[index];
    form.setValues(user);
    setEditingIndex(index);
  };

  // Открытие подтверждающего модального окна перед массовой регистрацией
  const openConfirmModal = () => {
    setConfirmModalOpen(true);
  };

  // Подтверждение массовой регистрации
  const handleConfirmSubmit = () => {
    setConfirmModalOpen(false);
    handleSubmitAllUsers();
  };

  return (
    <Container size="lg" my="lg">
      <Modal
        opened={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Подтверждение регистрации"
        radius="14"
      >
        <Text>Вы уверены, что хотите зарегистрировать всех пользователей?</Text>
        <Group position="right" mt="md">
          <Button onClick={() => setConfirmModalOpen(false)}>Отмена</Button>
          <Button onClick={handleConfirmSubmit} color="green">
            Подтвердить
          </Button>
        </Group>
      </Modal>

      <Paper radius="md" p="xl" withBorder style={{ boxShadow: 'none' }}>
        <Title order={3} align="center" mb="sm">
          Добавить пользователей
        </Title>
        <Divider my="20" />

        {/* Форма добавления пользователя вручную */}
        <form onSubmit={form.onSubmit(handleAddUser)}>
          <Group className={classes.formGroup}>
            <TextInput
              className={classes.input}
              label="Фамилия"
              placeholder="Введите фамилию"
              {...form.getInputProps('lastName')}
            />
            <TextInput
              className={classes.input}
              label="Имя"
              placeholder="Введите имя"
              {...form.getInputProps('firstName')}
            />
            <TextInput
              className={classes.input}
              label="Отчество"
              placeholder="Введите отчество"
              {...form.getInputProps('middleName')}
            />
          </Group>

          <Select
            mt="8"
            label="Роль"
            placeholder="Выберите роль"
            data={[
              { value: 'student', label: 'Студент' },
              { value: 'teacher', label: 'Преподаватель' },
              { value: 'dean', label: 'Сотрудник деканата' },
            ]}
            {...form.getInputProps('role')}
          />

          <Group position="center" mt="md">
            <Button type="submit" fullWidth>
              {editingIndex !== null ? 'Обновить пользователя' : 'Добавить пользователя'}
            </Button>
          </Group>
        </form>

        <Divider my="md" />

        {/* Загрузка файла */}
        <FileInput
          label="Загрузить пользователей из Excel/CSV"
          placeholder="Выберите файл"
          onChange={handleFileUpload}
        />

        {/* Экспорт в Excel и CSV */}
        <Group position="center" mt="md">
          <Button
            leftSection={<FileXls size={20} weight="fill" />}
            onClick={() => exportToCSVOrExcel('xlsx')}
            disabled={users.length === 0}
          >
            Экспортировать в Excel
          </Button>
          <Button
            leftSection={<FileCsv size={20} weight="fill" />}
            onClick={() => exportToCSVOrExcel('csv')}
            disabled={users.length === 0}
          >
            Экспортировать в CSV
          </Button>
        </Group>

        <Divider my="md" />

        {/* Кнопка для массовой регистрации */}
        <Group position="center" mt="md">
          <Button
            leftSection={<FloppyDisk size={20} weight="fill" />}
            onClick={openConfirmModal}
            disabled={users.length === 0}
          >
            Зарегистрировать всех
          </Button>
        </Group>

        <Divider my="md" />

        {/* Список добавленных пользователей */}
        <Box>
          <Text align="center" size="lg" mb="sm">
            Добавленные пользователи:
          </Text>
          <ScrollArea>
            <ul style={{ padding: 0, listStyleType: 'none' }}>
              {users.map((user, index) => (
                <li
                  key={user.id}
                  style={{
                    backgroundColor: '#f0fdf4',
                    padding: '20px',
                    marginBottom: '10px',
                    borderRadius: '12px',
                    border: '1px solid #d1e7dd',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <Text fw={600} size="lg" color="#2f855a">
                      {user.lastName} {user.firstName} {user.middleName ? user.middleName : ''}
                    </Text>
                    <Text size="sm" color="dimmed">
                      Роль: {user.role}
                    </Text>
                    <Text size="sm" color="dimmed">
                      ID: {user.id}
                    </Text>
                    <Text size="sm" color="dimmed">
                      Пароль: {user.password}
                    </Text>
                  </div>
                  <Group>
                    <ActionIcon radius="6" color="blue" onClick={() => handleEditUser(index)}>
                      <PencilSimple size={20} />
                    </ActionIcon>
                    <ActionIcon radius="6" color="red" onClick={() => handleDeleteUser(index)}>
                      <TrashSimple size={20} />
                    </ActionIcon>
                  </Group>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </Box>
      </Paper>
    </Container>
  );
}
