'use client';

import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import { CheckCircle, Clock, Eye, WarningCircle, XCircle } from 'phosphor-react';
import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Group,
  Modal,
  ScrollArea,
  SegmentedControl,
  Skeleton,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';

import 'dayjs/locale/ru';

import relativeTime from 'dayjs/plugin/relativeTime';
import $api from '../api/axiosInstance';
import DocumentActionModal from '../DocumentActionModal/DocumentActionModal';

dayjs.locale('ru');
dayjs.extend(relativeTime);

export default function SignatureRequests() {
  const [documentRequests, setDocumentRequests] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectComment, setRejectComment] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectModalOpened, setRejectModalOpened] = useState(false);
  const [actionModalOpened, setActionModalOpened] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [imageModalOpened, setImageModalOpened] = useState(false); // Модал для просмотра фото
  const [base64Images, setBase64Images] = useState([]); // Список изображений Base64

  const isFirstLoad = useRef(true);

  const handleActionModalClose = () => {
    setActionModalOpened(false);
    setSelectedRequest(null);
  };

  useEffect(() => {
    const fetchDocumentRequests = async () => {
      try {
        if (isFirstLoad.current) {
          setLoading(true);
        }
        const response = await $api.get('/api/document-requests');
        setDocumentRequests(response.data);
        setLoading(false);
        isFirstLoad.current = false;
      } catch (error) {
        console.error('Ошибка при загрузке заявлений:', error);
        setLoading(false);
        isFirstLoad.current = false;
      }
    };

    // Первоначальная загрузка данных
    fetchDocumentRequests();

    // Обновление данных каждые 20 секунд
    const intervalId = setInterval(fetchDocumentRequests, 20000);

    return () => clearInterval(intervalId);
  }, []);

  // Фильтрация и сортировка заявлений
  useEffect(() => {
    let filtered = documentRequests;

    if (filterStatus !== 'all') {
      filtered = filtered.filter((request) => request.status === filterStatus);
    }

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.templateId.name.toLowerCase().includes(lowerQuery) ||
          doc._id.toLowerCase().includes(lowerQuery)
      );
    }

    // Сортировка по времени
    filtered = filtered.sort((a, b) => {
      if (sortOrder === 'newest') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
    });

    setFilteredDocuments(filtered);
  }, [documentRequests, filterStatus, searchQuery, sortOrder]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return (
          <Box
            sx={{
              backgroundColor: '#e0f7e0',
              borderRadius: '50%',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircle size={24} color="green" weight="bold" />
          </Box>
        );
      case 'awaiting_signature':
        return (
          <Box
            sx={{
              backgroundColor: '#fff4e0',
              borderRadius: '50%',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Clock size={24} color="orange" weight="bold" />
          </Box>
        );
      case 'rejected':
        return (
          <Box
            sx={{
              backgroundColor: '#ffe0e0',
              borderRadius: '50%',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <XCircle size={24} color="red" weight="bold" />
          </Box>
        );
      case 'in_progress':
      default:
        return (
          <Box
            sx={{
              backgroundColor: '#e0f0ff',
              borderRadius: '50%',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <WarningCircle size={24} color="blue" weight="bold" />
          </Box>
        );
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'success':
        return (
          <Badge color="green" size="md" radius="xl">
            Успех
          </Badge>
        );
      case 'awaiting_signature':
        return (
          <Badge color="yellow" size="md" radius="xl">
            Ожидает подписи
          </Badge>
        );
      case 'rejected':
        return (
          <Badge color="red" size="md" radius="xl">
            Отклонено
          </Badge>
        );
      case 'in_progress':
        return null;
    }
  };

  const handleImageModalOpen = (images) => {
    setBase64Images(images);
    setImageModalOpened(true);
  };

  const handleReject = async () => {
    try {
      await $api.put(`/api/document-requests/${selectedRequest._id}/reject`, {
        status: 'rejected',
        comment: rejectComment || 'Без комментария',
      });
      setDocumentRequests((prev) =>
        prev.map((request) =>
          request._id === selectedRequest._id ? { ...request, status: 'rejected' } : request
        )
      );
      setRejectModalOpened(false);
      setRejectComment('');
      setSelectedRequest(null);
    } catch (error) {
      console.error('Ошибка при отклонении заявления:', error);
    }
  };

  const handleConfirm = (request) => {
    setSelectedRequest(request);
    setActionModalOpened(true);
  };

  return (
    <Container w="100%">
      <Title order={2} align="center" mb="24">
        Заявления
      </Title>

      {/* SegmentedControl для фильтрации статусов */}
      <Group mb="lg">
        <SegmentedControl
          value={filterStatus}
          onChange={setFilterStatus}
          data={[
            { label: 'Все', value: 'all' },
            { label: 'В обработке', value: 'in_progress' },
            { label: 'Ожидает подписи', value: 'awaiting_signature' },
            { label: 'Завершенные', value: 'success' },
            { label: 'Отклоненные', value: 'rejected' },
          ]}
        />
      </Group>

      {/* Сегментированный контрол для сортировки и поиск */}
      <Group position="center" mb="24">
        <SegmentedControl
          value={sortOrder}
          onChange={setSortOrder}
          data={[
            { label: 'Новые', value: 'newest' },
            { label: 'Старые', value: 'oldest' },
          ]}
        />
        <TextInput
          placeholder="Поиск по заявлению"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.currentTarget.value)}
          style={{ minWidth: '200px' }}
        />
      </Group>

      {/* Отображение заявлений */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-start',
          width: '100%',
          gap: '8px',
          flexWrap: 'wrap',
        }}
      >
        {filteredDocuments.length > 0 ? (
          filteredDocuments.map((request) => (
            <Card key={request._id} w="31%" padding="md" radius="14" mb="4" withBorder>
              <Group position="apart" mb="xs">
                <Group>
                  {getStatusIcon(request.status)}
                  <Box>
                    <Text weight={500} size="sm">
                      {request.templateId.name}
                    </Text>
                    <Text color="dimmed" size="xs">
                      ID Заявления: {request._id}
                    </Text>
                    <Text color="dimmed" size="xs">
                      {dayjs(request.createdAt).fromNow()}{' '}
                    </Text>
                  </Box>
                </Group>
                {getStatusBadge(request.status)}
              </Group>

              <Text size="xs" color="dimmed" mb="xs">
                Поля заполнены:
              </Text>

              {/* Отображаем список полей */}
              <ul style={{ paddingLeft: 16, marginBottom: 8 }}>
                {Object.entries(request.fields).map(([key, value]) => (
                  <li key={key} style={{ listStyleType: 'none' }}>
                    <Text size="xs">
                      <b>{value.ru}:</b>{' '}
                      {typeof value.en === 'string' && value.en.startsWith('data:image')
                        ? 'Файл'
                        : value.en}
                    </Text>
                  </li>
                ))}
              </ul>

              {/* Проверяем наличие Base64 изображений */}
              {/* Проверяем наличие Base64 изображений */}
              {Object.values(request.fields).some(
                (field) => typeof field.en === 'string' && field.en.startsWith('data:image')
              ) && (
                <Group position="right" mt="md">
                  <Button
                    variant="light"
                    color="blue"
                    size="xs"
                    leftIcon={<Eye />}
                    onClick={() =>
                      handleImageModalOpen(
                        Object.values(request.fields)
                          .filter(
                            (field) =>
                              typeof field.en === 'string' && field.en.startsWith('data:image')
                          )
                          .map((field) => field.en)
                      )
                    }
                  >
                    Посмотреть файлы
                  </Button>
                </Group>
              )}

              <Group position="right" mt="md">
                {request.status === 'processing' ? (
                  <>
                    <Button
                      variant="light"
                      color="green"
                      size="xs"
                      onClick={() => handleConfirm(request)}
                    >
                      Подтвердить
                    </Button>
                    <Button
                      variant="light"
                      color="red"
                      size="xs"
                      onClick={() => {
                        setSelectedRequest(request);
                        setRejectModalOpened(true);
                      }}
                    >
                      Отклонить
                    </Button>
                  </>
                ) : request.status === 'success' ? (
                  <Button variant="light" w="100%" color="green" size="xs">
                    Успешно
                  </Button>
                ) : request.status === 'rejected' ? (
                  <Button variant="light" w="100%" color="red" size="xs">
                    Отклонено
                  </Button>
                ) : (
                  <Button variant="light" w="100%" color="blue" size="xs">
                    В обработке
                  </Button>
                )}
              </Group>
            </Card>
          ))
        ) : (
          <Text align="center">Заявления отсутствуют.</Text>
        )}
      </div>

      {/* Модальное окно для просмотра изображений */}
      <Modal
        opened={imageModalOpened}
        onClose={() => setImageModalOpened(false)}
        title="Просмотр файлов"
        size="lg"
        padding="lg"
      >
        <ScrollArea style={{ maxHeight: '400px' }}>
          {base64Images.map((image, index) => (
            <img
              key={index}
              src={image}
              alt={`File-${index}`}
              style={{ width: '100%', marginBottom: '16px', borderRadius: '8px' }}
            />
          ))}
        </ScrollArea>
      </Modal>

      {/* Модальное окно для отклонения заявления */}
      <Modal
        opened={rejectModalOpened}
        onClose={() => setRejectModalOpened(false)}
        title="Отклонение заявления"
        radius="14"
      >
        <Textarea
          label="Комментарий (необязательно)"
          placeholder="Укажите причину отклонения"
          value={rejectComment}
          onChange={(e) => setRejectComment(e.target.value)}
        />
        <Group position="right" mt="md">
          <Button variant="light" color="red" size="xs" onClick={handleReject}>
            Отклонить
          </Button>
        </Group>
      </Modal>

      {/* Модальное окно для подтверждения заявления */}
      <DocumentActionModal
        request={selectedRequest}
        onClose={handleActionModalClose}
        actionModalOpened={actionModalOpened}
      />
    </Container>
  );
}
