import { useEffect, useState } from 'react';
import mammoth from 'mammoth'; // Подключаем mammoth для работы с .docx
import ReactQuill from 'react-quill'; // Используем ReactQuill для редактирования HTML
import {
  Button,
  FileInput,
  Group,
  Modal,
  NumberInput,
  Radio,
  RadioGroup,
  Textarea,
} from '@mantine/core';
import $api from '../api/axiosInstance';

import 'react-quill/dist/quill.snow.css';

export default function DocumentActionModal({ request, onClose, actionModalOpened }) {
  const [generationType, setGenerationType] = useState('manual'); // Устанавливаем по умолчанию 'manual'
  const [customFile, setCustomFile] = useState(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [documentContent, setDocumentContent] = useState(''); // Для HTML содержимого документа
  const [isEditable, setIsEditable] = useState(false);
  const [signatureImage, setSignatureImage] = useState(null); // Для хранения изображения подписи
  const [signatureWidth, setSignatureWidth] = useState(150); // Размер изображения по умолчанию

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
      if (generationType === 'manual' && customFile) {
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
          console.log('Документ успешно отредактирован и отправлен');
          // Обновляем статус на "success" после успешной отправки
          await $api.put(`/api/document-requests/${request._id}/status`, {
            status: 'success',
          });
        } else {
          console.error('Ошибка при отправке документа');
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
          // Обновляем статус на "success" после успешной отправки
          await $api.put(`/api/document-requests/${request._id}/status`, {
            status: 'success',
          });
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

  // Функция для вставки изображения подписи в редактор с возможностью изменения размера
  const handleInsertSignature = (file) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const imageUrl = reader.result;
        setDocumentContent(
          (prevContent) =>
            `${prevContent}<img src="${imageUrl}" width="${signatureWidth}" alt="Подпись" />`
        );
      };
      reader.readAsDataURL(file);
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
        <Radio value="manual" mb="8" label="Загрузить вручную" />
        <Radio value="edit" mb="20" label="Редактировать документ" />
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
        <>
          <ReactQuill
            value={documentContent}
            onChange={setDocumentContent}
            theme="snow"
            placeholder="Редактируйте документ здесь"
          />
          <FileInput
            label="Добавить подпись (изображение)"
            placeholder="Загрузите изображение"
            onChange={(file) => handleInsertSignature(file)}
            radius={9}
            mb="md"
            mt="6"
          />
          <NumberInput
            label="Ширина изображения подписи (в пикселях)"
            value={signatureWidth}
            onChange={(value) => setSignatureWidth(value)}
            radius={9}
            min={50}
            max={1000}
            mb="md"
          />
        </>
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
          {generationType === 'manual' ? 'Отправить' : 'Редактировать и отправить'}
        </Button>
      </Group>
    </Modal>
  );
}
