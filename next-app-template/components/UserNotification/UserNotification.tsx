'use client';

import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Container, Notification, Stack } from '@mantine/core';
import { showNotification } from '@mantine/notifications';

export function UserNotification() {
  const [userId, setUserId] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Получаем userId из localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUserId(parsedUser._id);
      } catch (error) {
        console.error('Ошибка при парсинге user из localStorage:', error);
      }
    }
  }, []);

  useEffect(() => {
    let socketInstance;
    let intervalId;

    const connectSocket = () => {
      console.log('Создание нового подключения');
      socketInstance = io('http://localhost:5001', {
        transports: ['websocket'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketInstance.on('connect', () => {
        console.log('Соединение установлено:', socketInstance.id);
        if (userId) {
          socketInstance.emit('registerUser', userId);
        }
      });

      socketInstance.on('disconnect', () => {
        console.log('Соединение разорвано');
      });

      socketInstance.on('historyNotification', (data) => {
        console.log('Получено уведомление:', data);
        const { templateName, status, comment, timestamp, documentId } = data;
        const formattedTime = new Date(timestamp).toISOString(); // Используем ISO-формат для гарантии точности

        console.log('Статус уведомления:', status); // Логируем статус

        const newNotification = {
          message: `Статус вашего заявления "${templateName}" изменился на "${getStatusText(status)}".`,
          status,
          comment,
          timestamp: formattedTime,
          documentId,
        };

        setNotifications((prev) => {
          const isDuplicate = prev.some(
            (notif) => notif.documentId === documentId && notif.timestamp === formattedTime
          );

          if (isDuplicate) {
            return prev; // Если уведомление уже существует, не добавляем его
          }

          const updatedNotifications = [newNotification, ...prev];
          return updatedNotifications.slice(0, 10); // Ограничиваем до 10 уведомлений
        });

        // Отображаем всплывающее уведомление
        showNotification({
          title: 'Новое уведомление',
          message: `${newNotification.message} ${comment ? `Комментарий: ${comment}` : ''}`,
          color: getNotificationColor(status),
        });
      });
    };

    if (userId) {
      connectSocket();

      // Устанавливаем интервал для переподключения каждые 5 секунд
      intervalId = setInterval(() => {
        if (socketInstance) {
          console.log('Отключаем текущее соединение...');
          socketInstance.disconnect(); // Отключаем текущее соединение
        }
        connectSocket(); // Создаем новое подключение
      }, 5000);
    }

    return () => {
      clearInterval(intervalId); // Очищаем интервал при размонтировании компонента
      if (socketInstance) {
        socketInstance.disconnect(); // Отключаем текущее соединение при размонтировании
      }
    };
  }, [userId]); // Теперь сокет подключается только при наличии userId

  // Функция для удаления уведомления
  const removeNotification = (documentId, timestamp) => {
    setNotifications((prev) =>
      prev.filter((notif) => !(notif.documentId === documentId && notif.timestamp === timestamp))
    );
  };

  return (
    <Container my="20">
      <h3>Уведомления:</h3>
      <Stack spacing="sm">
        {notifications
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) // Сортируем по убыванию времени
          .map((notification) => (
            <Notification
              key={`${notification.documentId}-${notification.timestamp}`}
              title="Новое уведомление"
              color={getNotificationColor(notification.status)}
              withCloseButton
              onClose={() => removeNotification(notification.documentId, notification.timestamp)}
            >
              <div>{notification.message}</div>
              {notification.comment && (
                <div>
                  <strong>Комментарий:</strong> {notification.comment}
                </div>
              )}
              <div>
                <strong>Время:</strong> {formatTimestamp(notification.timestamp)}
              </div>
            </Notification>
          ))}
      </Stack>
    </Container>
  );
}

// Функция для получения цвета уведомления на основе статуса
const getNotificationColor = (status) => {
  console.log('Проверяем статус для цвета:', status); // Логируем статус для проверки
  switch (status) {
    case 'success':
      return 'green';
    case 'rejected':
      return 'red';
    case 'awaiting_signature':
      return 'yellow';
    case 'processing':
      return 'blue';
    default:
      return 'gray';
  }
};

// Функция для получения текста статуса
const getStatusText = (status) => {
  console.log('Получаем текст для статуса:', status); // Логирование статуса
  const statusMap = {
    rejected: 'Отклонено',
    success: 'Ваше заявление успешно обработано и одобрено.', // Изменено сообщение для success
    awaiting_signature: 'Ожидает подписи',
    processing: 'В обработке',
  };
  return statusMap[status] || 'В обработке';
};

// Функция для форматирования времени
const formatTimestamp = (timestamp) => {
  if (typeof timestamp === 'string') {
    return new Date(timestamp).toLocaleString('ru-RU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return timestamp;
};
