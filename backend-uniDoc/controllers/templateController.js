// controllers/templateController.js

const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const contentDisposition = require('content-disposition');
const { PDFDocument } = require('pdf-lib'); // Для поддержки PDF
const Template = require('../models/Template');
const DocumentRequest = require('../models/DocumentRequest');

// Функция для извлечения меток из DOCX шаблона
const extractPlaceholdersFromDocx = fileBuffer => {
  const zip = new PizZip(fileBuffer);
  const doc = new Docxtemplater(zip);
  const text = doc.getFullText();
  const regex = /\{([^}]+)\}/g;
  let matches;
  const placeholders = [];

  while ((matches = regex.exec(text)) !== null) {
    placeholders.push(matches[1]);
  }

  return placeholders;
};
// Функция для извлечения меток из PDF шаблона
const extractPlaceholdersFromPdf = async fileBuffer => {
  const pdfDoc = await PDFDocument.load(fileBuffer);
  const form = pdfDoc.getForm();
  const fields = form.getFields();
  const placeholders = fields.map(field => field.getName());
  return placeholders;
};

// Определение расширения файла
const getFileExtension = filename => {
  return path.extname(filename).toLowerCase();
};

// Загрузка нового шаблона
exports.uploadTemplate = async (req, res) => {
  try {
    const { name } = req.body;
    let fields = req.body.fields;
    const file = req.file;

    // Проверка наличия имени и файла
    if (!name || !file) {
      return res
        .status(400)
        .json({ message: 'Необходимо указать название и файл шаблона.' });
    }

    // Если поля переданы как строка, парсим их
    if (fields) {
      try {
        fields = JSON.parse(fields);
      } catch (error) {
        return res
          .status(400)
          .json({ message: 'Поле fields должно быть в формате JSON.' });
      }
    } else {
      // Если поля не переданы, инициализируем пустым массивом
      fields = [];
    }

    // Читаем файл шаблона
    const fileBuffer = fs.readFileSync(file.path);

    // Определяем тип файла на основе MIME-типа
    const mimeType = file.mimetype;
    let fileExtension = '';

    if (
      mimeType ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      fileExtension = '.docx';
    } else if (mimeType === 'application/pdf') {
      fileExtension = '.pdf';
    } else {
      return res.status(400).json({
        message: 'Неподдерживаемый тип файла. Пожалуйста, загрузите DOCX или PDF файл.',
      });
    }

    console.log('Определено расширение файла:', fileExtension);

    // Создаем массив полей на основе переданных fields
    const templateFields = fields.map(field => ({
      name: field.name,
      nameRu: field.nameRu || field.name,
      type: field.type || 'text',
      filledBy: field.filledBy || 'user',
    }));

    // Создаем новый шаблон в базе данных
    const template = new Template({
      name,
      filePath: file.path,
      fileType: fileExtension,
      fields: templateFields,
    });

    await template.save();

    res.status(201).json({ message: 'Шаблон успешно загружен.', template });
  } catch (error) {
    console.error('Ошибка при загрузке шаблона:', error);
    res.status(500).json({ message: 'Ошибка сервера.' });
  }
};

// Получение списка шаблонов
exports.getTemplates = async (req, res) => {
  try {
    const templates = await Template.find();
    res.json(templates);
  } catch (error) {
    console.error('Ошибка при получении шаблонов:', error);
    res.status(500).json({ message: 'Ошибка сервера.' });
  }
};

// Получение информации о конкретном шаблоне
exports.getTemplateById = async (req, res) => {
  try {
    const { id } = req.params;
    const template = await Template.findById(id);

    if (!template) {
      return res.status(404).json({ message: 'Шаблон не найден.' });
    }

    res.json(template);
  } catch (error) {
    console.error('Ошибка при получении шаблона:', error);
    res.status(500).json({ message: 'Ошибка сервера.' });
  }
};

// Обновление полей шаблона
exports.updateTemplateFields = async (req, res) => {
  try {
    const { id } = req.params;
    const { fields } = req.body;

    const template = await Template.findById(id);

    if (!template) {
      return res.status(404).json({ message: 'Шаблон не найден.' });
    }

    // Обновляем поля
    template.fields = fields.map(field => ({
      name: field.name,
      nameRu: field.nameRu,
      type: field.type || 'text',
      filledBy: field.filledBy || 'user',
    }));

    await template.save();

    res.json({ message: 'Шаблон успешно обновлен.', template });
  } catch (error) {
    console.error('Ошибка при обновлении шаблона:', error);
    res.status(500).json({ message: 'Ошибка сервера.' });
  }
};

// Генерация документа на основе шаблона и данных пользователя
exports.fillTemplate = async (req, res) => {
  try {
    const { id } = req.params; // ID шаблона
    const { documentRequestId, userData } = req.body; // ID заявления и данные пользователя

    // Получаем шаблон и заявление
    const template = await Template.findById(id);
    const documentRequest = await DocumentRequest.findById(documentRequestId);

    if (!template || !documentRequest) {
      return res.status(404).json({ message: 'Шаблон или заявление не найдены.' });
    }

    if (template.fileType !== '.docx') {
      return res
        .status(400)
        .json({ message: 'Неподдерживаемый тип файла. Ожидается .docx файл.' });
    }

    // Читаем файл шаблона
    const fileBuffer = fs.readFileSync(template.filePath);

    // Обрабатываем DOCX файл
    const zip = new PizZip(fileBuffer);
    let doc;

    try {
      doc = new Docxtemplater(zip);
    } catch (error) {
      console.error('Ошибка при загрузке шаблона Docxtemplater:', error);
      return res.status(500).json({ message: 'Ошибка при обработке шаблона документа.' });
    }

    // Собираем данные для замены меток
    const data = {};

    // Заполнение данных на основе полей шаблона
    template.fields.forEach(field => {
      if (field.filledBy === 'user') {
        if (userData[field.name]) {
          // Берем значение из userData, если оно присутствует
          data[field.name] = userData[field.name];
        } else {
          console.log(`Метка ${field.name} не найдена в userData.`);
          data[field.name] = ''; // Если данных нет, ставим пустую строку
        }
      } else if (field.filledBy === 'staff') {
        data[field.name] = 'Значение от сотрудника'; // Замените на реальное значение, если требуется
      }
    });

    // Логирование данных для отладки
    console.log('Данные для заполнения шаблона:', data);

    // Устанавливаем данные и рендерим документ
    try {
      doc.setData(data);
      doc.render();
    } catch (error) {
      console.error('Ошибка при рендеринге документа:', error);
      return res.status(500).json({ message: 'Ошибка при заполнении шаблона данными.' });
    }

    const outputBuffer = doc.getZip().generate({ type: 'nodebuffer' });

    // Генерация пути для сохранения документа
    const outputDir = path.join(__dirname, '../generated_documents');

    // Проверяем, существует ли директория, и создаем её, если она не существует
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputFilePath = path.join(outputDir, `${documentRequest._id}_filled.docx`);

    // Сохраняем сгенерированный документ на диск
    fs.writeFileSync(outputFilePath, outputBuffer);

    // Обновляем запрос на документ, добавляя путь к сгенерированному документу и меняя статус
    documentRequest.documentPath = outputFilePath;
    documentRequest.status = 'awaiting_signature'; // Обновляем статус
    documentRequest.history.push({
      action: 'awaiting_signature',
      timestamp: new Date(),
      comment: 'Документ сгенерирован и ожидает подписи',
    });
    await documentRequest.save();

    res.status(200).json({
      message: 'Документ успешно сгенерирован и сохранён.',
      documentPath: outputFilePath,
    });
  } catch (error) {
    console.error('Ошибка при заполнении шаблона:', error);
    res.status(500).json({ message: 'Ошибка сервера.' });
  }
};

// Получение всех имен шаблонов
exports.getTemplateNames = async (req, res) => {
  try {
    const templates = await Template.find({}, '_id name'); // Возвращаем поля '_id' и 'name'
    res.json(templates);
  } catch (error) {
    console.error('Ошибка при получении имен шаблонов:', error);
    res.status(500).json({ message: 'Ошибка сервера.' });
  }
};
exports.getAnalyticsByTemplate = async (req, res) => {
  const { period } = req.params;

  let dateFormat;
  if (period === 'day') {
    dateFormat = '%Y-%m-%d';
  } else if (period === 'month') {
    dateFormat = '%Y-%m';
  } else if (period === 'year') {
    dateFormat = '%Y';
  } else {
    return res
      .status(400)
      .json({ message: 'Некорректный период. Допустимые значения: day, month, year' });
  }

  try {
    const analytics = await DocumentRequest.aggregate([
      {
        $group: {
          _id: {
            template: '$templateId',
            date: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          },
          count: { $sum: 1 },
        },
      },
      {
        $addFields: {
          templateObjectId: {
            $convert: {
              input: '$_id.template',
              to: 'objectId',
              onError: null,
              onNull: null,
            },
          },
        },
      },
      {
        $lookup: {
          from: 'templates',
          localField: 'templateObjectId',
          foreignField: '_id',
          as: 'template',
        },
      },
      {
        $unwind: '$template',
      },
      {
        $project: {
          date: '$_id.date',
          templateName: '$template.name',
          count: 1,
          _id: 0,
        },
      },
      { $sort: { date: -1 } },
    ]);

    res.json(analytics);
  } catch (error) {
    console.error('Ошибка получения аналитики по шаблонам:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

exports.getSuccessFailureRate = async (req, res) => {
  try {
    const totalRequests = await DocumentRequest.countDocuments();

    const successCount = await DocumentRequest.countDocuments({ status: 'success' });
    const rejectedCount = await DocumentRequest.countDocuments({ status: 'rejected' });

    const successRate = ((successCount / totalRequests) * 100).toFixed(2);
    const rejectionRate = ((rejectedCount / totalRequests) * 100).toFixed(2);

    res.json({
      totalRequests,
      successRate: `${successRate}%`,
      rejectionRate: `${rejectionRate}%`,
    });
  } catch (error) {
    console.error('Ошибка получения статистики успешных и отклоненных заявок:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};
exports.getUserActivity = async (req, res) => {
  const { period } = req.params;

  let dateFormat;
  if (period === 'day') {
    dateFormat = '%Y-%m-%d';
  } else if (period === 'month') {
    dateFormat = '%Y-%m';
  } else if (period === 'year') {
    dateFormat = '%Y';
  } else {
    return res
      .status(400)
      .json({ message: 'Некорректный период. Допустимые значения: day, month, year' });
  }

  try {
    const userActivity = await DocumentRequest.aggregate([
      {
        $group: {
          _id: {
            userId: '$userId',
            date: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          },
        },
      },
      {
        $group: {
          _id: '$_id.date',
          uniqueUsers: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    res.json(userActivity);
  } catch (error) {
    console.error('Ошибка получения активности пользователей:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};
