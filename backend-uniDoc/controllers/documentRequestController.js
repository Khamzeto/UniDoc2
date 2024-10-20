const DocumentRequest = require('../models/DocumentRequest');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const Template = require('../models/Template');
const htmlDocx = require('html-docx-js');
const { JSDOM } = require('jsdom');
const { v4: uuidv4 } = require('uuid'); // Используем uuid для генерации уникальных имен файлов

const { Document, Packer, Paragraph, TextRun, ImageRun } = require('docx');
const nodemailer = require('nodemailer'); // Импорт nodemailer для отправки почты
const User = require('../models/User');

// Настройка почтового клиента
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'iimya266@gmail.com',
    pass: 'ksnz zdqp uuyv dxmw',
  },
});

// Функция для отправки email
const sendNotificationEmail = async (to, subject, text) => {
  try {
    await transporter.sendMail({
      from: '"Document System" <iimya266@gmail.com>', // Замените на ваш email
      to, // Адрес получателя
      subject, // Тема письма
      text, // Текст письма
    });
    console.log('Email отправлен:', to);
  } catch (error) {
    console.error('Ошибка отправки email:', error);
  }
};
exports.createDocumentRequest = async (req, res) => {
  try {
    const { templateId, userId, fields } = req.body;

    // Находим шаблон по его ID, чтобы получить путь к файлу
    const template = await Template.findById(templateId);

    if (!template) {
      return res.status(404).json({ message: 'Шаблон не найден.' });
    }

    // Создаем новое заявление
    const newDocumentRequest = new DocumentRequest({
      templateId,
      userId,
      fields,
      documentPath: template.filePath, // Присваиваем путь шаблона в поле documentPath
      history: [
        {
          status: 'processing',
          timestamp: Date.now(),
        },
      ],
    });

    await newDocumentRequest.save();

    // Отправляем уведомление по email пользователю
    const user = await User.findById(userId); // Предполагается, что у вас есть модель User для поиска по userId
    if (user && user.email) {
      await sendNotificationEmail(
        user.email,
        'Новое заявление создано',
        `Ваше заявление "${template.name}" было успешно создано и сейчас находится в обработке.`
      );
    }

    res.status(201).json({
      message: 'Заявление успешно создано.',
      documentRequest: newDocumentRequest,
    });
  } catch (error) {
    console.error('Ошибка при создании заявления:', error);
    res.status(500).json({ message: 'Ошибка сервера.' });
  }
};

// Обновление статуса заявления
// Обновление статуса заявления
exports.updateDocumentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comment } = req.body;

    // Находим заявление по ID
    const documentRequest = await DocumentRequest.findById(id).populate('templateId');

    if (!documentRequest) {
      return res.status(404).json({ message: 'Заявление не найдено.' });
    }

    // Обновляем статус
    documentRequest.status = status;
    documentRequest.updatedAt = Date.now();

    // Добавляем новое изменение в историю
    documentRequest.history.push({
      status,
      timestamp: Date.now(),
      comment: comment || '', // Добавляем комментарий, если есть
    });

    if (status === 'rejected' && comment) {
      documentRequest.rejectionComment = comment;
    }

    await documentRequest.save();

    // Находим пользователя, чтобы отправить email
    const user = await User.findById(documentRequest.userId); // Предполагается, что у вас есть модель User для поиска по userId

    if (user && user.email) {
      // Формируем сообщение для статуса success
      let emailText = '';
      if (status === 'success') {
        emailText = `Ваше заявление "${documentRequest.templateId.name}" успешно одобрено. Поздравляем! Мы обработали вашу заявку и она успешно завершена.`;
      } else {
        emailText = `Статус вашего заявления "${
          documentRequest.templateId.name
        }" изменился на "${status}". Комментарий: ${comment || 'Без комментария'}`;
      }

      await sendNotificationEmail(user.email, 'Статус заявления изменен', emailText);
    }

    // Отправляем уведомление конкретному пользователю через WebSocket
    io.to(documentRequest.userId.toString()).emit('statusUpdate', {
      message: `Статус вашего заявления изменился на "${status}"`,
      status,
      documentId: documentRequest._id,
    });

    res.json({ message: 'Статус заявления обновлен.', documentRequest });
  } catch (error) {
    console.error('Ошибка при обновлении статуса заявления:', error);
    res.status(500).json({ message: 'Ошибка сервера.' });
  }
};
// Получение списка всех заявлений
exports.getAllDocumentRequests = async (req, res) => {
  try {
    const documentRequests = await DocumentRequest.find()
      .populate('templateId')
      .populate('userId');

    res.json(documentRequests);
  } catch (error) {
    console.error('Ошибка при получении списка заявлений:', error);
    res.status(500).json({ message: 'Ошибка сервера.' });
  }
};

// Получение конкретного заявления по ID
exports.getDocumentRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const documentRequest = await DocumentRequest.findById(id)
      .populate('templateId')
      .populate('userId');

    if (!documentRequest) {
      return res.status(404).json({ message: 'Заявление не найдено.' });
    }

    res.json(documentRequest);
  } catch (error) {
    console.error('Ошибка при получении заявления:', error);
    res.status(500).json({ message: 'Ошибка сервера.' });
  }
};

// Получение заявлений по userId
exports.getDocumentRequestsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const documentRequests = await DocumentRequest.find({ userId })
      .populate('templateId')
      .populate('userId');

    if (documentRequests.length === 0) {
      return res
        .status(404)
        .json({ message: 'Заявления не найдены для данного пользователя.' });
    }

    res.json(documentRequests);
  } catch (error) {
    console.error('Ошибка при получении заявлений пользователя:', error);
    res.status(500).json({ message: 'Ошибка сервера.' });
  }
};

// Получение заявлений по статусу
exports.getDocumentRequestsByStatus = async (req, res) => {
  try {
    const { status } = req.params;

    const documentRequests = await DocumentRequest.find({ status })
      .populate('templateId')
      .populate('userId');

    if (documentRequests.length === 0) {
      return res
        .status(404)
        .json({ message: `Заявления со статусом "${status}" не найдены.` });
    }

    res.json(documentRequests);
  } catch (error) {
    console.error('Ошибка при получении заявлений по статусу:', error);
    res.status(500).json({ message: 'Ошибка сервера.' });
  }
};

// Добавление комментария при отказе (опционально)
exports.rejectDocumentRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    // Найдем заявление по ID
    const documentRequest = await DocumentRequest.findById(id);

    if (!documentRequest) {
      return res.status(404).json({ message: 'Заявление не найдено.' });
    }

    // Добавляем в историю запись об отклонении
    documentRequest.history.push({
      action: 'rejected',
      timestamp: new Date(),
      comment: comment || 'Без комментария', // Комментарий может быть необязательным
    });

    // Обновляем статус на 'rejected' и сохраняем изменения
    documentRequest.status = 'rejected';
    documentRequest.updatedAt = Date.now();

    await documentRequest.save();

    res.json({ message: 'Заявление отклонено.', documentRequest });
  } catch (error) {
    console.error('Ошибка при отклонении заявления:', error);
    res.status(500).json({ message: 'Ошибка сервера.' });
  }
};

// Настройка хранилища для multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploaded_documents/';
    // Создаем папку, если она не существует
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.params.id}_uploaded${ext}`); // Уникальное имя файла
  },
});

const upload = multer({ storage });

// Загрузка документа вручную и обновление статуса
exports.uploadDocumentManually = [
  upload.single('file'), // Используем multer для обработки загрузки файла
  async (req, res) => {
    try {
      const { id } = req.params;
      const { comment } = req.body;

      // Находим заявление по ID
      const documentRequest = await DocumentRequest.findById(id);

      if (!documentRequest) {
        return res.status(404).json({ message: 'Заявление не найдено.' });
      }

      // Проверяем, был ли загружен файл
      if (!req.file) {
        return res.status(400).json({ message: 'Файл не загружен.' });
      }

      // Обновляем путь к документу и статус
      documentRequest.documentPath = req.file.path; // Сохраняем путь к загруженному документу
      documentRequest.status = 'awaiting_signature';
      documentRequest.updatedAt = Date.now();

      // Добавляем запись в историю
      documentRequest.history.push({
        status: 'awaiting_signature',
        timestamp: Date.now(),
        comment: comment || 'Документ загружен вручную',
      });

      await documentRequest.save();

      res.json({
        message: 'Документ успешно загружен и ожидает подписи.',
        documentRequest,
      });
    } catch (error) {
      console.error('Ошибка при загрузке документа:', error);
      res.status(500).json({ message: 'Ошибка сервера.' });
    }
  },
];
const htmlToDocxParagraphs = html => {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  const elements = document.body.childNodes;
  const paragraphs = [];
  const tempImagePaths = []; // Массив для временных изображений

  elements.forEach(node => {
    const textRuns = [];

    node.childNodes.forEach(child => {
      if (child.nodeType === 3) {
        // Обычный текст
        textRuns.push(new TextRun(child.textContent));
      } else if (child.tagName === 'STRONG') {
        // Жирный текст
        textRuns.push(new TextRun({ text: child.textContent, bold: true }));
      } else if (child.tagName === 'EM') {
        // Курсив
        textRuns.push(new TextRun({ text: child.textContent, italics: true }));
      } else if (child.tagName === 'U') {
        // Подчеркнутый текст
        textRuns.push(new TextRun({ text: child.textContent, underline: {} }));
      } else if (child.tagName === 'IMG') {
        // Обработка тега <img> с поддержкой Base64
        const src = child.getAttribute('src');

        if (src && src.startsWith('data:image')) {
          console.log('Найдено изображение в Base64:', src);

          // Извлекаем Base64 часть
          const base64Data = src.split(',')[1];

          // Проверяем длину Base64 данных
          console.log('Длина Base64 данных изображения:', base64Data.length);

          // Преобразуем Base64 в буфер
          const imageBuffer = Buffer.from(base64Data, 'base64');

          // Генерируем уникальный путь для временного изображения
          const tempImagePath = path.join(__dirname, `temp_image_${uuidv4()}.png`);
          fs.writeFileSync(tempImagePath, imageBuffer);
          tempImagePaths.push(tempImagePath); // Сохраняем путь

          // Добавляем изображение в документ с использованием ImageRun
          textRuns.push(
            new ImageRun({
              data: fs.readFileSync(tempImagePath),
              transformation: {
                width: 100, // Ширина изображения (настраиваемо)
                height: 50, // Высота изображения (настраиваемо)
              },
            })
          );
        }
      }
    });

    paragraphs.push(new Paragraph({ children: textRuns }));
  });

  // После обработки удаляем все временные файлы изображений
  tempImagePaths.forEach(tempPath => {
    fs.unlinkSync(tempPath);
  });

  return paragraphs;
};

exports.uploadDocumentManuallyHtml = [
  upload.single('file'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { comment } = req.body;

      // Находим заявление по ID
      const documentRequest = await DocumentRequest.findById(id);

      if (!documentRequest) {
        return res.status(404).json({ message: 'Заявление не найдено.' });
      }

      // Проверяем, был ли загружен файл
      if (!req.file) {
        return res.status(400).json({ message: 'Файл не загружен.' });
      }

      // Читаем HTML файл
      const htmlContent = fs.readFileSync(req.file.path, 'utf8');

      // Выводим HTML содержимое в консоль для отладки
      console.log('Полученный HTML контент:', htmlContent);

      // Преобразуем HTML в абзацы DOCX с поддержкой стилей
      const paragraphs = htmlToDocxParagraphs(htmlContent);

      // Обрабатываем Base64 изображения в HTML
      const updatedParagraphs = paragraphs.map(paragraph => {
        // Найдите все <img> теги с Base64 изображениями
        if (paragraph.children) {
          paragraph.children.forEach(child => {
            if (child.type === 'image' && child.dataUrl) {
              // Выводим данные изображения Base64 в консоль
              console.log('Найдено изображение Base64:', child.dataUrl);

              const base64Data = child.dataUrl.split(',')[1]; // Получаем часть Base64
              const imgBuffer = Buffer.from(base64Data, 'base64');

              // Здесь вы можете обработать сохранение изображения, если нужно
              const imagePath = path.join(
                __dirname,
                '../uploaded_images',
                `${documentRequest._id}_signature.png`
              );
              fs.writeFileSync(imagePath, imgBuffer);

              // Преобразуйте путь изображения в относительный путь
              child.src = imagePath; // Обновляем путь изображения для DOCX
            }
          });
        }
        return paragraph;
      });

      // Создаем новый DOCX документ
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: updatedParagraphs, // Используем обновленные абзацы
          },
        ],
      });

      // Генерация DOCX файла
      const buffer = await Packer.toBuffer(doc);

      const docxFilePath = path.join(
        __dirname,
        '../uploaded_documents',
        `${documentRequest._id}_converted.docx`
      );

      // Сохраняем DOCX файл
      fs.writeFileSync(docxFilePath, buffer);

      // Обновляем путь к документу и статус
      documentRequest.documentPath = docxFilePath;
      documentRequest.status = 'awaiting_signature';
      documentRequest.updatedAt = Date.now();

      // Добавляем запись в историю
      documentRequest.history.push({
        status: 'awaiting_signature',
        timestamp: Date.now(),
        comment: comment || 'Документ загружен и конвертирован из HTML в DOCX',
      });

      await documentRequest.save();

      res.json({
        message: 'Документ успешно загружен и конвертирован в DOCX.',
        documentRequest,
      });
    } catch (error) {
      console.error('Ошибка при загрузке и конвертации документа:', error);
      res.status(500).json({ message: 'Ошибка сервера.' });
    }
  },
];

exports.getDocumentByRequestId = async (req, res) => {
  try {
    const { id } = req.params; // ID заявления

    // Находим заявление по ID
    const documentRequest = await DocumentRequest.findById(id);

    if (!documentRequest) {
      return res.status(404).json({ message: 'Заявление не найдено.' });
    }

    // Проверяем наличие пути к документу
    if (!documentRequest.documentPath) {
      return res
        .status(404)
        .json({ message: 'Документ для данного заявления не найден.' });
    }

    // Полный путь к документу
    const documentFullPath = path.resolve(documentRequest.documentPath);

    // Проверяем, существует ли файл
    if (!fs.existsSync(documentFullPath)) {
      return res.status(404).json({ message: 'Файл документа не найден на сервере.' });
    }

    // Отправляем файл пользователю
    res.sendFile(documentFullPath);
  } catch (error) {
    console.error('Ошибка при получении документа:', error);
    res.status(500).json({ message: 'Ошибка сервера.' });
  }
};
