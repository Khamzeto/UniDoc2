'use client';

import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { CheckCircle, Clock, XCircle } from 'phosphor-react';
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
import SignatureActionModal from '../SignatureAction/SignatureAction';

dayjs.locale('ru');
dayjs.extend(relativeTime);

export default function SignatureRequests() {
  const [documentRequests, setDocumentRequests] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectComment, setRejectComment] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null); // Для хранения текущего заявления
  const [rejectModalOpened, setRejectModalOpened] = useState(false); // Для модального окна
  const [actionModalOpened, setActionModalOpened] = useState(false); // Модальное окно выбора действия
  const [filterStatus, setFilterStatus] = useState('awaiting_signature'); // Для фильтрации по статусу
  const [sortOrder, setSortOrder] = useState('newest'); // Для фильтрации по времени
  const [searchQuery, setSearchQuery] = useState(''); // Для поиска по заявлениям

  const handleActionModalClose = () => {
    setActionModalOpened(false);
    setSelectedRequest(null); // Очищаем выбор после закрытия
  };
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

  useEffect(() => {
    const fetchDocumentRequests = async () => {
      try {
        const response = await $api.get(`/api/document-requests/status/${filterStatus}`);
        setDocumentRequests(response.data);
        setFilteredDocuments(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Ошибка при загрузке заявлений:', error);
        setLoading(false);
      }
    };

    // Периодическое обновление данных каждые 30 секунд
    fetchDocumentRequests();
    const intervalId = setInterval(fetchDocumentRequests, 20000); // 30 секунд

    // Очищаем интервал при размонтировании компонента
    return () => clearInterval(intervalId);
  }, [filterStatus]); // Обновляем данные при изменении фильтра

  // Функция для поиска и фильтрации по тексту
  const handleSearch = (query) => {
    setSearchQuery(query);
    const lowerQuery = query.toLowerCase();
    const filtered = documentRequests.filter(
      (doc) =>
        doc.templateId.name.toLowerCase().includes(lowerQuery) ||
        doc._id.toLowerCase().includes(lowerQuery)
    );
    setFilteredDocuments(filtered);
  };

  // Функция для сортировки заявлений по времени
  const handleSort = (order) => {
    setSortOrder(order);
    const sorted = [...filteredDocuments].sort((a, b) => {
      if (order === 'newest') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
    });
    setFilteredDocuments(sorted);
  };

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
      default:
        return null;
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
      default:
        return null;
    }
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
    setActionModalOpened(true); // Открываем модальное окно для выбора действия
  };

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
        Заявления
      </Title>

      {/* Кнопки фильтрации */}
      <Group position="center" mb="24">
        <SegmentedControl
          value={filterStatus}
          onChange={(value) => {
            setFilterStatus(value);
            setFilteredDocuments([]); // Сбрасываем фильтрованные документы при изменении фильтра
          }}
          data={[
            { label: 'Ожидают подписи', value: 'awaiting_signature' },
            { label: 'Завершенные', value: 'success' },
            { label: 'Отклоненные', value: 'rejected' },
          ]}
        />
        <SegmentedControl
          value={sortOrder}
          onChange={handleSort}
          data={[
            { label: 'Новые', value: 'newest' },
            { label: 'Старые', value: 'oldest' },
          ]}
        />
        <TextInput
          placeholder="Поиск по заявлению"
          value={searchQuery}
          onChange={(event) => handleSearch(event.currentTarget.value)}
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
                      {/* Используем dayjs для отображения времени */}
                    </Text>
                  </Box>
                </Group>
                {getStatusBadge(request.status)}
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

              <Group position="right" mt="md">
                {request.status === 'awaiting_signature' ? (
                  <>
                    <Button
                      variant="light"
                      color="green"
                      size="xs"
                      onClick={() => {
                        handleConfirm(request);
                        setActionModalOpened(true);
                      }}
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
                ) : (
                  <Button variant="light" w="100%" color="red" size="xs">
                    Отклонено
                  </Button>
                )}
              </Group>
            </Card>
          ))
        ) : (
          <Text align="center">Нет заявлений в этой категории.</Text>
        )}
      </div>

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

      <SignatureActionModal
        request={selectedRequest} // Передаем само заявление
        onClose={handleActionModalClose}
        actionModalOpened={actionModalOpened}
      />
    </Container>
  );
}
