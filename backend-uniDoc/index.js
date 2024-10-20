const express = require('express');
const mongoose = require('mongoose');
const http = require('http'); // Для работы с Socket.io
const socketIO = require('socket.io'); // Socket.io
const cors = require('cors'); // Импортируем CORS
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

const templateRoutes = require('./routes/templateRoutes');
const documentRequestRoutes = require('./routes/documentRequest');
const bodyParser = require('body-parser');
const DocumentRequest = require('./models/DocumentRequest'); // Импорт модели DocumentRequest

const app = express();
const server = http.createServer(app); // Создаём HTTP сервер
const io = socketIO(server, {
  cors: {
    origin: '*', // Разрешаем любые источники для WebSocket
    methods: ['GET', 'POST'],
  },
});

const PORT = 5001; // Порт для запуска сервера
const MONGO_URI = 'mongodb://localhost:27017/unidoc'; // Адрес MongoDB

// Увеличение лимита для JSON
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Добавляем CORS middleware для Express
app.use(cors()); // Разрешаем CORS для всех источников

// Middleware для работы с JSON
app.use(express.json());

// Роуты для аутентификации и документов
app.use('/api/auth', authRoutes);
app.use('/api/document', templateRoutes);
app.use('/api/document-requests', documentRequestRoutes);
app.use('/api/users', userRoutes);
// Подключение к MongoDB
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Подключено к MongoDB'))
  .catch(err => console.error('Ошибка подключения к MongoDB:', err));

// Функция для получения текста статуса
const getStatusText = status => {
  const statusMap = {
    rejected: 'Отклонено',
    success: 'Успешно завершено',
    awaiting_signature: 'Ожидает подписи',
    processing: 'В обработке',
  };
  return statusMap[status] || 'В обработке';
};

// Обработка подключений Socket.IO
io.on('connection', socket => {
  console.log('Новый клиент подключен:', socket.id);

  socket.on('registerUser', async userId => {
    console.log(`Пользователь ${userId} присоединился к комнате.`);
    socket.join(userId);

    try {
      const userDocumentRequests = await DocumentRequest.find({ userId })
        .populate('templateId', 'name')
        .exec();

      userDocumentRequests.forEach(request => {
        request.history.forEach(historyItem => {
          console.log(`Отправляем историю для пользователя ${userId}`);
          socket.emit('historyNotification', {
            documentId: request._id,
            templateName: request.templateId.name,
            status: historyItem.status,
            timestamp: historyItem.timestamp,
            comment: historyItem.comment,
          });
        });
      });
    } catch (error) {
      console.error('Ошибка при отправке истории:', error);
    }
  });

  socket.on('updateDocumentStatus', async ({ documentId, status, comment }) => {
    try {
      const documentRequest = await DocumentRequest.findById(documentId);
      if (documentRequest) {
        documentRequest.history.push({
          status,
          comment,
          timestamp: new Date(),
        });
        await documentRequest.save();

        console.log(`Уведомление отправляется пользователю ${documentRequest.userId}`);
        io.to(documentRequest.userId).emit('historyNotification', {
          documentId: documentRequest._id,
          templateName: documentRequest.templateId.name,
          status,
          timestamp: new Date(),
          comment,
        });
      }
    } catch (error) {
      console.error('Ошибка обновления статуса документа:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('Клиент отключен:', socket.id);
  });
});

// Экспортируем io, чтобы использовать его в других модулях, если нужно
app.set('io', io);

// Запуск сервера
server.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
