'use client';

import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Notification } from '@mantine/core';
import { showNotification } from '@mantine/notifications';

export function NotificationSolo() {
  const [userId, setUserId] = useState(null);
  const [currentNotification, setCurrentNotification] = useState(null); // Для одного активного уведомления
  const [isNotificationVisible, setNotificationVisible] = useState(false); // Видимость уведомления

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

    const connectSocket = () => {
      console.log('Создание нового подключения');
      socketInstance = io('http://localhost:5001', {
        transports: ['websocket'],
        reconnectionAttempts: 5, // Автоматические попытки переподключения
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
        const formattedTime = formatTimestamp(timestamp);

        const newNotification = {
          id: documentId + formattedTime, // Уникальный ключ для уведомления
          message: `Статус вашего заявления "${templateName}" изменился на "${getStatusText(status)}".`,
          status,
          comment,
          timestamp: formattedTime,
        };

        // Проверяем, было ли уведомление уже закрыто и сохранено в localStorage
        const closedNotifications = JSON.parse(localStorage.getItem('closedNotifications')) || [];
        if (closedNotifications.includes(newNotification.id)) {
          return; // Если уведомление уже закрыто, не показываем его
        }

        // Показываем уведомление
        setCurrentNotification(newNotification);
        setNotificationVisible(true);

        // Автоматически убираем уведомление через 5 секунд
        setTimeout(() => {
          removeNotification(newNotification.id);
        }, 6000);
      });
    };

    // Первый раз подключаемся
    connectSocket();

    // Устанавливаем интервал для переподключения каждые 4 секунды
    const intervalId = setInterval(() => {
      if (socketInstance) {
        console.log('Отключаем текущее соединение...');
        socketInstance.disconnect(); // Отключаем текущее соединение
      }
      connectSocket(); // Создаем новое подключение
    }, 4000);

    // Очищаем интервал и закрываем соединение при размонтировании
    return () => {
      clearInterval(intervalId); // Очищаем интервал
      if (socketInstance) {
        socketInstance.disconnect(); // Отключаем текущее соединение при размонтировании
      }
    };
  }, [userId]);

  // Удаление уведомления и сохранение в localStorage
  const removeNotification = (id) => {
    setNotificationVisible(false); // Скрываем уведомление

    // Сохраняем идентификатор уведомления в localStorage
    const closedNotifications = JSON.parse(localStorage.getItem('closedNotifications')) || [];
    if (!closedNotifications.includes(id)) {
      closedNotifications.push(id);
      localStorage.setItem('closedNotifications', JSON.stringify(closedNotifications));
    }
  };

  return (
    <>
      {isNotificationVisible && currentNotification && (
        <div style={{ position: 'fixed', top: 20, right: 20, width: '300px', zIndex: 1000 }}>
          <Notification
            key={currentNotification.id}
            title="Новое уведомление"
            color={getNotificationColor(currentNotification.status)}
            withCloseButton
            onClose={() => removeNotification(currentNotification.id)} // Закрываем вручную
          >
            <div>{currentNotification.message}</div>
            {currentNotification.comment && (
              <div>
                <strong>Комментарий:</strong> {currentNotification.comment}
              </div>
            )}
            <div>
              <strong>Время:</strong> {currentNotification.timestamp}
            </div>
          </Notification>
        </div>
      )}
    </>
  );
}

// Функция для получения цвета уведомления на основе статуса
const getNotificationColor = (status) => {
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
  const statusMap = {
    rejected: 'Отклонено',
    success: 'Успешно завершено',
    awaiting_signature: 'Ожидает подписи',
    processing: 'В обработке',
  };
  return statusMap[status] || 'В обработке';
};

// Функция для форматирования времени
const formatTimestamp = (timestamp) => {
  if (typeof timestamp === 'number') {
    return new Date(timestamp).toLocaleString('ru-RU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return new Date(timestamp).toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
