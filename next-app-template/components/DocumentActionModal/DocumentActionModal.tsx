import { useEffect, useState } from 'react';
import mammoth from 'mammoth'; // Подключаем mammoth для работы с .docx
import ReactQuill from 'react-quill'; // Используем ReactQuill для редактирования HTML
import { Button, FileInput, Group, Modal, Radio, RadioGroup, Textarea } from '@mantine/core';
import $api from '../api/axiosInstance';

import 'react-quill/dist/quill.snow.css';

export default function DocumentActionModal({ request, onClose, actionModalOpened }) {
  const [generationType, setGenerationType] = useState('auto');
  const [customFile, setCustomFile] = useState(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [documentContent, setDocumentContent] = useState(''); // Для HTML содержимого документа
  const [isEditable, setIsEditable] = useState(false);
  console.log(actionModalOpened);
  // Преобразуем поля в формат, где берутся только значения 'en'
  const transformFields = (fields) => {
    const transformed = {};
    Object.keys(fields).forEach((key) => {
      transformed[key] = fields[key].en;
    });
    return transformed;
  };

  // Функция для загрузки содержимого документа и конвертации его в HTML
  const fetchDocumentContent = async () => {
    try {
      const response = await $api.get(`/api/document-requests/${request._id}/document`, {
        responseType: 'blob',
      });

      const file = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      // Используем mammoth для конвертации .docx в HTML
      mammoth
        .convertToHtml({ arrayBuffer: await file.arrayBuffer() })
        .then((result) => {
          setDocumentContent(result.value); // сохраняем HTML для отображения
        })
        .catch((error) => {
          console.error('Ошибка при конвертации документа:', error);
        });
    } catch (error) {
      console.error('Ошибка при получении документа:', error);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    window.location.reload();
    try {
      if (generationType === 'auto') {
        const transformedFields = transformFields(request.fields);
        const response = await $api.post(`/api/document/templates/${request.templateId._id}/fill`, {
          documentRequestId: request._id,
          comment,
          userData: transformedFields,
        });

        if (response.status === 200) {
          console.log('Документ успешно сгенерирован');
        } else {
          console.error('Ошибка при генерации документа');
        }
      } else if (generationType === 'manual' && customFile) {
        const formData = new FormData();
        formData.append('file', customFile);
        formData.append('comment', comment);

        const response = await $api.put(
          `/api/document-requests/${request._id}/manual-sign`,
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
          }
        );

        if (response.status === 200) {
          console.log('Документ успешно загружен вручную');
        } else {
          console.error('Ошибка при загрузке документа вручную');
        }
      } else if (generationType === 'edit') {
        // Отправляем отредактированный HTML документ на сервер по маршруту 'manual-sign-html'
        const blob = new Blob([documentContent], { type: 'text/html' });
        const formData = new FormData();
        formData.append('file', blob);
        formData.append('comment', comment);

        const response = await $api.put(
          `/api/document-requests/${request._id}/manual-sign-html`,
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
          }
        );

        if (response.status === 200) {
          console.log('Документ успешно отредактирован и отправлен');
        } else {
          console.error('Ошибка при отправке документа');
        }
      }

      onClose(); // Закрываем модальное окно
    } catch (error) {
      console.error('Ошибка при отправке документа:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await $api.get(`/api/document-requests/${request._id}/document`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `document_${request._id}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Ошибка при скачивании документа:', error);
    }
  };

  return (
    <Modal
      title="Выберите способ отправки документа"
      opened={actionModalOpened}
      onClose={onClose}
      radius={9}
      size="lg"
    >
      <RadioGroup
        value={generationType}
        onChange={(value) => {
          setGenerationType(value);
          if (value === 'edit') {
            fetchDocumentContent(); // Загружаем документ для редактирования при выборе
            setIsEditable(true);
          } else {
            setIsEditable(false);
          }
        }}
        sx={{ marginBottom: 16 }}
      >
        <Radio value="auto" mb="8" label="Автоматически сгенерировать документ" />
        <Radio value="manual" mb="8" label="Загрузить вручную" />
        <Radio value="edit" mb="10" label="Редактировать документ" />
      </RadioGroup>

      {generationType === 'manual' && (
        <FileInput
          label="Загрузите документ"
          placeholder="Выберите файл"
          onChange={setCustomFile}
          radius={9}
          mb="md"
        />
      )}

      {generationType === 'edit' && isEditable && (
        <ReactQuill
          value={documentContent}
          onChange={setDocumentContent}
          theme="snow"
          placeholder="Редактируйте документ здесь"
        />
      )}

      <Textarea
        label="Комментарий (необязательно)"
        placeholder="Укажите комментарий"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        radius={9}
        mb="md"
      />

      <Group position="right" mt="md">
        <Button onClick={handleDownload} radius={9} variant="outline">
          Скачать документ
        </Button>
        <Button onClick={handleConfirm} radius={9} loading={loading}>
          {generationType === 'auto' ? 'Сгенерировать и отправить' : 'Отправить на подпись'}
        </Button>
      </Group>
    </Modal>
  );
}
