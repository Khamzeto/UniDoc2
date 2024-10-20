'use client';

import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import { CheckCircle, Clock, Download, File, WarningCircle, XCircle } from 'phosphor-react';
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
  TextInput,
  Timeline,
  Title,
} from '@mantine/core';

import '../../app/global.css';
import 'dayjs/locale/ru';

import relativeTime from 'dayjs/plugin/relativeTime';
import $api from '../api/axiosInstance';

dayjs.locale('ru');
dayjs.extend(relativeTime);

// Вспомогательная функция для получения действия
const getAction = (actionItem) => actionItem.action || actionItem.status;

// Маппинг статусов к тексту
const actionStatusMap = {
  rejected: 'Отклонено',
  success: 'Успешно завершено',
  awaiting_signature: 'Ожидание подписи',
  processing: 'В обработке',
};

// Маппинг статусов к иконкам для карточек
const actionIconMap = {
  rejected: (
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
  ),
  success: (
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
  ),
  awaiting_signature: (
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
  ),
  processing: (
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
  ),
};

// Маппинг статусов к иконкам для Timeline
const timelineIconMap = {
  rejected: <XCircle size={20} color="red" />,
  success: <CheckCircle size={20} color="green" />,
  awaiting_signature: <Clock size={20} color="orange" />,
  processing: <WarningCircle size={20} color="blue" />,
};

// Маппинг статусов к бейджам
const statusBadgeMap = {
  success: (
    <Badge color="green" size="md" radius="xl">
      Успех
    </Badge>
  ),
  awaiting_signature: (
    <Badge color="yellow" size="md" radius="xl">
      Ожидает подписи
    </Badge>
  ),
  rejected: (
    <Badge color="red" size="md" radius="xl">
      Отклонено
    </Badge>
  ),
  processing: (
    <Badge color="blue" size="md" radius="xl">
      В обработке
    </Badge>
  ),
};

// Функция для получения текста статуса
const getStatusText = (status) => actionStatusMap[status] || 'В обработке';

// Функция для получения иконки статуса для карточки
const getStatusIcon = (status) => actionIconMap[status] || actionIconMap.processing;

// Функция для получения иконки в Timeline
const getTimelineIcon = (action) => timelineIconMap[action] || timelineIconMap.processing;

export default function DocumentRequestsPage() {
  const [documentRequests, setDocumentRequests] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [filteredStatus, setFilteredStatus] = useState('all'); // Текущий фильтр
  const [sortOrder, setSortOrder] = useState('newest'); // Порядок сортировки
  const [searchQuery, setSearchQuery] = useState(''); // Поисковый запрос
  const [selectedRequest, setSelectedRequest] = useState(null); // Выбранное заявление
  const [detailsModalOpened, setDetailsModalOpened] = useState(false); // Открытие модального окна

  const isFirstLoad = useRef(true);

  useEffect(() => {
    // Получаем userId из localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUserId(parsedUser._id); // Предполагаем, что userId хранится в объекте user
      } catch (error) {
        console.error('Ошибка при парсинге user из localStorage:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (userId) {
      const fetchDocumentRequests = async () => {
        try {
          if (isFirstLoad.current) {
            setLoading(true);
          }
          const response = await $api.get(`/api/document-requests/user/${userId}`);
          setDocumentRequests(response.data);
          setLoading(false);
          isFirstLoad.current = false;
        } catch (error) {
          console.error('Ошибка при загрузке заявлений:', error);
          setLoading(false);
          isFirstLoad.current = false;
        }
      };

      fetchDocumentRequests();

      // Обновление данных каждые 10 секунд
      const intervalId = setInterval(fetchDocumentRequests, 10000);

      return () => clearInterval(intervalId);
    }
  }, [userId]);

  // Фильтрация, поиск и сортировка заявлений
  useEffect(() => {
    let filtered = [...documentRequests];

    if (filteredStatus !== 'all') {
      filtered = filtered.filter((request) => request.status === filteredStatus);
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
    filtered.sort((a, b) => {
      if (sortOrder === 'newest') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
    });

    setFilteredDocuments(filtered);
  }, [documentRequests, filteredStatus, searchQuery, sortOrder]);

  const openDetailsModal = (request) => {
    setSelectedRequest(request);
    setDetailsModalOpened(true);
  };

  // Функция для скачивания документа
  const handleDownload = async (requestId) => {
    try {
      const response = await $api.get(`/api/document-requests/${requestId}/document`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `document_${requestId}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Ошибка при скачивании документа:', error);
      // Можно добавить уведомление для пользователя о сбое
    }
  };

  // Сохранение позиции скролла
  useEffect(() => {
    const savedScrollPosition = sessionStorage.getItem('scrollPosition');
    if (savedScrollPosition) {
      window.scrollTo(0, parseInt(savedScrollPosition, 10));
    }

    const handleScroll = () => {
      sessionStorage.setItem('scrollPosition', window.scrollY.toString());
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  if (loading) {
    return (
      <Container size="md" w="100%">
        <ScrollArea style={{ maxHeight: 400 }} type="auto">
          {[...Array(5)].map((_, index) => (
            <Card key={index} shadow="sm" padding="lg" radius="md" mb="md" withBorder>
              <Group position="apart" mb="xs">
                <Skeleton height={30} width="70%" />
                <Skeleton height={25} width={50} />
              </Group>
              <Skeleton height={20} width="90%" mb="xs" />
              <Skeleton height={20} width="80%" mb="xs" />
              <Skeleton height={20} width="95%" />
              <Group position="right" mt="md">
                <Skeleton height={30} width={100} />
              </Group>
            </Card>
          ))}
        </ScrollArea>
      </Container>
    );
  }

  return (
    <Container w="100%">
      <Title order={2} align="center" mb="24">
        Мои заявления
      </Title>

      {/* SegmentedControl для фильтрации статусов */}
      <Group mb="lg">
        <SegmentedControl
          value={filteredStatus}
          onChange={setFilteredStatus}
          data={[
            { label: 'Все', value: 'all' },
            { label: 'В обработке', value: 'processing' },
            { label: 'Ожидает подписи', value: 'awaiting_signature' },
            { label: 'Завершенные', value: 'success' },
            { label: 'Отклонённые', value: 'rejected' },
          ]}
        />
      </Group>

      {/* Сегментированный контрол для сортировки и поиска */}
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

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-start',
          width: '100%',
          gap: '8px',
          flexWrap: 'wrap',
        }}
        className="flex-cards"
      >
        {filteredDocuments.length > 0 ? (
          filteredDocuments.map((request) => (
            <Card key={request._id} w="30%" miw="280px" padding="md" radius="14" mb="md" withBorder>
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
                      {dayjs(request.createdAt).fromNow()}
                    </Text>
                  </Box>
                </Group>
                {statusBadgeMap[request.status] || statusBadgeMap.processing}
              </Group>

              <Text size="xs" color="dimmed" mb="xs">
                Поля заполнены:
              </Text>

              <ul style={{ paddingLeft: 16, marginBottom: 8 }}>
                {Object.entries(request.fields).map(([key, value]) => (
                  <li key={key} style={{ listStyleType: 'none' }}>
                    <Text size="xs">
                      <b>{value.ru}:</b> {value.en}
                    </Text>
                  </li>
                ))}
              </ul>

              <Group position="right" grow mt="md">
                <Button
                  variant="light"
                  color="blue"
                  size="xs"
                  onClick={() => openDetailsModal(request)}
                >
                  Подробнее
                </Button>
                {request.status === 'success' && (
                  <Button
                    variant="light"
                    color="green"
                    size="xs"
                    leftSection={<Download size={16} />}
                    onClick={() => handleDownload(request._id)}
                  >
                    Скачать
                  </Button>
                )}
              </Group>
            </Card>
          ))
        ) : (
          <Text align="center">Заявления отсутствуют.</Text>
        )}
      </div>

      {/* Модальное окно для показа деталей */}
      <Modal
        opened={detailsModalOpened}
        onClose={() => setDetailsModalOpened(false)}
        title="Детали заявления"
        radius="9"
        size="lg"
      >
        {selectedRequest && (
          <>
            <Text size="sm" weight={500} mb="sm">
              <Text span color="dimmed">
                Шаблон:
              </Text>{' '}
              {selectedRequest.templateId.name}
            </Text>
            <Text size="sm" weight={500} mb="sm">
              <Text span color="dimmed">
                Статус:
              </Text>{' '}
              {getStatusText(getAction(selectedRequest))}
            </Text>
            {selectedRequest.comment && (
              <Text size="sm" weight={500} mb="sm">
                <Text span color="dimmed">
                  Комментарий:
                </Text>{' '}
                {selectedRequest.comment || 'Комментарий отсутствует'}
              </Text>
            )}
            <Text size="sm" weight={500} mb="sm">
              <Text span color="dimmed">
                Создано:
              </Text>{' '}
              {dayjs(selectedRequest.createdAt).format('DD MMMM YYYY, HH:mm')}
            </Text>
            <Text size="sm" weight={500} mb="sm">
              <Text span color="dimmed">
                Обновлено:
              </Text>{' '}
              {dayjs(selectedRequest.updatedAt).fromNow()}
            </Text>

            {/* История действий */}
            {selectedRequest.history && selectedRequest.history.length > 0 && (
              <>
                <Title order={4} mt="lg" mb="sm" weight={600}>
                  История действий
                </Title>
                <Timeline
                  mt="20"
                  color="transparent"
                  active={selectedRequest.history.length - 1}
                  bulletSize={24}
                  lineWidth={2}
                >
                  {selectedRequest.history.map((actionItem, index) => {
                    const action = getAction(actionItem); // Получаем action или status
                    const uniqueKey = `${action}-${actionItem.timestamp}-${index}`; // Уникальный ключ

                    return (
                      <Timeline.Item
                        key={uniqueKey}
                        title={getStatusText(action)}
                        bullet={getTimelineIcon(action)}
                      >
                        <Text size="xs" color="dimmed">
                          {dayjs(actionItem.timestamp).format('DD MMMM YYYY, HH:mm')}
                        </Text>
                        <Text size="xs" color="dimmed">
                          Комментарий: {actionItem.comment || 'Без комментария'}
                        </Text>
                      </Timeline.Item>
                    );
                  })}
                </Timeline>
              </>
            )}
          </>
        )}
      </Modal>
    </Container>
  );
}
