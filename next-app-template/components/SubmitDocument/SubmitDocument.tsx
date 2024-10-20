'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Divider,
  FileInput,
  Group,
  NumberInput,
  Paper,
  Select,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import $api from '../api/axiosInstance'; // Импортируем API для запросов

export function SubmitDocumentForm() {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [fields, setFields] = useState([]);
  const [formData, setFormData] = useState({});
  const [userId, setUserId] = useState(null);

  // Создаем форму с помощью useForm
  const form = useForm({
    initialValues: {},
    validate: {},
  });

  // Получаем userId из localStorage при загрузке компонента
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUserId(parsedUser._id);
    }
  }, []);

  // Загружаем шаблоны при загрузке компонента
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await $api.get('/api/document/templates/names');
        setTemplates(response.data);
      } catch (error) {
        console.error('Ошибка при загрузке шаблонов:', error);
      }
    };

    fetchTemplates();
  }, []);

  // Обработчик выбора шаблона
  const handleTemplateChange = async (value) => {
    setSelectedTemplate(value);

    try {
      const response = await $api.get(`/api/document/templates/${value}`);
      const formFields = response.data.fields.map((field) => ({
        name: field.name,
        nameRu: field.nameRu,
        type: field.type,
        filledBy: field.filledBy,
      }));
      setFields(formFields);

      // Инициализируем форму для новых полей
      const initialFormValues = {};
      formFields.forEach((field) => {
        initialFormValues[field.name] = '';
      });
      form.setValues(initialFormValues);
    } catch (error) {
      console.error('Ошибка при загрузке полей шаблона:', error);
    }
  };

  // Обработчик изменения файла
  const handleFileChange = (name, file) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, [name]: reader.result }));
      form.setFieldValue(name, reader.result); // Сохраняем в форме в формате base64
    };
    reader.readAsDataURL(file);
  };

  // Обработчик отправки формы
  const handleSubmit = async (values) => {
    const finalFields = {};

    // Собираем как русские, так и английские названия полей
    fields.forEach((field) => {
      finalFields[field.name] = {
        en: values[field.name],
        ru: field.nameRu,
      };
    });

    if (!userId) {
      alert('Ошибка: пользователь не авторизован.');
      return;
    }

    try {
      const response = await $api.post(`/api/document-requests`, {
        templateId: selectedTemplate,
        fields: finalFields, // Передаем и английское, и русское значение поля
        userId,
      });

      if (response.status === 201) {
        form.reset(); // Сброс формы
        setSelectedTemplate(null);
        setFields([]);
        setFormData({});
      }
    } catch (error) {
      console.error('Ошибка при подаче заявления:', error);
      alert('Произошла ошибка при подаче заявления.');
    }
  };

  return (
    <Paper
      radius="14"
      w="100%"
      maw="800px"
      p="lg"
      withBorder
      style={{ border: '1px solid #eaeaea', margin: '120px auto 0 auto' }}
    >
      <Title order={3} align="center" mb="sm" style={{ fontWeight: 500 }}>
        Подать заявление
      </Title>
      <Text align="center" mb="lg" color="dimmed" size="sm">
        Заполните форму для подачи заявления
      </Text>

      <Divider my="lg" />

      <Box>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Select
            label="Тип документа"
            placeholder="Выберите тип"
            data={templates.map((template) => ({ value: template._id, label: template.name }))}
            value={selectedTemplate}
            onChange={handleTemplateChange}
            required
            mb="sm"
          />

          {/* Отображение полей для выбранного шаблона */}
          {fields.map((field, index) => {
            const inputProps = form.getInputProps(field.name);
            const label = field.nameRu.charAt(0).toUpperCase() + field.nameRu.slice(1);

            return field.type === 'text' ? (
              <TextInput
                key={index}
                label={label}
                placeholder={`Введите ${field.nameRu}`}
                {...inputProps}
                required={field.filledBy === 'user'}
                mb="sm"
              />
            ) : field.type === 'number' ? (
              <NumberInput
                key={index}
                label={label}
                placeholder={`Введите ${field.nameRu}`}
                {...inputProps}
                required={field.filledBy === 'user'}
                mb="sm"
              />
            ) : field.type === 'file' ? (
              <FileInput
                key={index}
                label={label}
                placeholder="Загрузите файл"
                accept="image/*"
                onChange={(file) => handleFileChange(field.name, file)}
                required={field.filledBy === 'user'}
                mb="sm"
              />
            ) : null;
          })}

          <Group mt="lg">
            <Button type="submit" fullWidth variant="outline">
              Подать заявление
            </Button>
          </Group>
        </form>
      </Box>
    </Paper>
  );
}
