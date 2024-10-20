'use client';

import React, { useState } from 'react';
import { IconCheck, IconCopy, IconPlus, IconTrash, IconUpload, IconX } from '@tabler/icons-react';
import { slugify } from 'transliteration';
import {
  ActionIcon,
  Button,
  Card,
  Container,
  CopyButton,
  Divider,
  FileInput,
  Group,
  List,
  Notification,
  rem,
  ScrollArea,
  Select,
  Switch,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core';

function TemplateCreator() {
  const [templateName, setTemplateName] = useState('');
  const [fields, setFields] = useState([]);
  const [fieldNameRu, setFieldNameRu] = useState('');
  const [fieldType, setFieldType] = useState('text');
  const [filledBy, setFilledBy] = useState('user');
  const [file, setFile] = useState(null);
  const [notification, setNotification] = useState({ message: '', color: '' });
  const [placeholders, setPlaceholders] = useState([]);
  const [autoFill, setAutoFill] = useState(false);

  const addField = () => {
    if (fieldNameRu) {
      const transliteratedName = slugify(fieldNameRu, { separator: '_', lowercase: false });
      setFields([
        ...fields,
        {
          name: transliteratedName,
          nameRu: fieldNameRu,
          type: fieldType,
          filledBy,
        },
      ]);
      setFieldNameRu('');
      setFieldType('text');
      setFilledBy('user');
    }
  };

  const handleCreateTemplate = async () => {
    if (!templateName || !file || fields.length === 0) {
      setNotification({
        message: 'Пожалуйста, заполните все поля и добавьте хотя бы одно поле.',
        color: 'red',
      });
      return;
    }

    const formData = new FormData();
    formData.append('name', templateName);
    formData.append('fields', JSON.stringify(fields));
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:5001/api/document/templates', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка при загрузке шаблона.');
      }

      const data = await response.json();
      setPlaceholders(fields.map((field) => field.name));
      setNotification({
        message: 'Шаблон успешно загружен.',
        color: 'green',
      });
    } catch (error) {
      console.error(error);
      setNotification({ message: error.message, color: 'red' });
    }
  };

  const handleFieldNameRuChange = (e) => {
    const value = e.currentTarget.value;
    setFieldNameRu(value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addField(); // Add the field when "Enter" is pressed
    }
  };

  const removeField = (index) => {
    const newFields = [...fields];
    newFields.splice(index, 1);
    setFields(newFields);
  };

  const allPlaceholders = fields.map((field) => `{${field.name}}`).join(', ');

  return (
    <Container size="md" padding="md">
      <Title order={2} align="center" mb="md">
        Создание шаблона документа
      </Title>

      {notification.message && (
        <Notification
          color={notification.color}
          onClose={() => setNotification({ message: '', color: '' })}
          mb="md"
          icon={notification.color === 'green' ? <IconCheck size={18} /> : <IconX size={18} />}
        >
          {notification.message}
        </Notification>
      )}

      <Card padding="lg" radius="14" mb="md" withBorder>
        <TextInput
          label="Название документа"
          placeholder="Введите название документа"
          value={templateName}
          onChange={(e) => setTemplateName(e.currentTarget.value)}
          required
          mb="md"
        />

        <Divider my="sm" />

        <Title order={4} mb="sm">
          Добавить поле
        </Title>

        <Group grow mb="md">
          <TextInput
            label="Название поля"
            placeholder="Например: Имя"
            value={fieldNameRu}
            onChange={handleFieldNameRuChange}
            onKeyPress={handleKeyPress} // Trigger "Enter" key event here
            required
          />
        </Group>

        <Group grow mb="md">
          <Select
            label="Тип поля"
            data={[
              { value: 'text', label: 'Текст' },
              { value: 'number', label: 'Число' },
              { value: 'file', label: 'Файл' },
            ]}
            value={fieldType}
            onChange={(value) => setFieldType(value)}
          />
          <Select
            label="Заполняется"
            data={[
              { value: 'user', label: 'Пользователем' },
              { value: 'staff', label: 'Сотрудником' },
            ]}
            value={filledBy}
            onChange={(value) => setFilledBy(value)}
          />
        </Group>

        <Button
          leftIcon={<IconPlus size={18} />}
          onClick={addField}
          variant="light"
          fullWidth
          mb="md"
        >
          Добавить поле
        </Button>

        {fields.length > 0 && (
          <>
            <Divider my="sm" />
            <Title order={4} mb="sm">
              Список полей
            </Title>
            <ScrollArea mb="md">
              <List
                spacing="md"
                listStyleType="none"
                withPadding
                styles={(theme) => ({
                  item: {
                    padding: '10px 15px',
                    borderRadius: theme.radius.md,
                    backgroundColor:
                      theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  },
                })}
              >
                {fields.map((field, index) => (
                  <List.Item key={index}>
                    <Group position="apart" noWrap>
                      <Text>
                        <b>{field.nameRu}</b> ({field.name}) - {field.type} - Заполняется:{' '}
                        {field.filledBy === 'user' ? 'Пользователем' : 'Сотрудником'}
                      </Text>
                      <Group>
                        <CopyButton value={`{${field.name}}`} timeout={2000}>
                          {({ copied, copy }) => (
                            <Tooltip
                              label={copied ? 'Скопировано' : 'Скопировать метку'}
                              withArrow
                              position="right"
                            >
                              <ActionIcon
                                color={copied ? 'teal' : 'gray'}
                                variant="subtle"
                                onClick={copy}
                              >
                                {copied ? (
                                  <IconCheck style={{ width: rem(16) }} />
                                ) : (
                                  <IconCopy style={{ width: rem(16) }} />
                                )}
                              </ActionIcon>
                            </Tooltip>
                          )}
                        </CopyButton>
                        <Button
                          variant="subtle"
                          color="red"
                          onClick={() => removeField(index)}
                          compact
                        >
                          <IconTrash size={16} />
                        </Button>
                      </Group>
                    </Group>
                  </List.Item>
                ))}
              </List>
            </ScrollArea>

            <Group position="center" mt="md" mb="20">
              <CopyButton value={allPlaceholders} timeout={2000}>
                {({ copied, copy }) => (
                  <Button
                    onClick={copy}
                    variant="outline"
                    leftIcon={copied ? <IconCheck size={18} /> : <IconCopy size={18} />}
                  >
                    {copied ? 'Все метки скопированы' : 'Скопировать все метки'}
                  </Button>
                )}
              </CopyButton>
            </Group>
          </>
        )}

        <FileInput
          label="Выберите файл"
          placeholder="Нажмите, чтобы выбрать файл"
          accept=".docx,.pdf"
          value={file}
          onChange={setFile}
          icon={<IconUpload size={18} />}
          required
          mb="md"
        />

        <Switch
          label="Автоматически заполнять данные"
          checked={autoFill}
          mt="10"
          onChange={(event) => {
            setAutoFill(event.currentTarget.checked);
          }}
          mb="md"
        />
        <Text color="dimmed" size="sm" mb="md">
          Вам не нужно самостоятельно редактировать документ. Он будет заполнен автоматически.
        </Text>

        <Button mt="20" radius="14" onClick={handleCreateTemplate} fullWidth size="md">
          Создать
        </Button>
      </Card>
    </Container>
  );
}

export default TemplateCreator;
