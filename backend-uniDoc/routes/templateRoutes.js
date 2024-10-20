// routes/templateRoutes.js

const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Убедитесь, что папка для загрузок существует
const uploadDir = path.join(__dirname, '../uploads/templates/');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Настройка хранения файлов с помощью multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Сохраняем файл с уникальным именем
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const filename =
      file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
    cb(null, filename);
  },
});

const upload = multer({ storage: storage });

// Маршруты

// Загрузка нового шаблона
router.post('/templates', upload.single('file'), templateController.uploadTemplate);

// Получение списка шаблонов
router.get('/templates', templateController.getTemplates);
router.get('/templates/names', templateController.getTemplateNames);
// Получение информации о конкретном шаблоне
router.get('/templates/:id', templateController.getTemplateById);

// Обновление полей шаблона
router.put('/templates/:id', templateController.updateTemplateFields);

// Заполнение шаблона данными пользователя
router.post('/templates/:id/fill', templateController.fillTemplate);

router.get('/templates/:period', templateController.getAnalyticsByTemplate);

// Роут для получения статистики успешных и отклоненных заявок
router.get('/success-failure', templateController.getSuccessFailureRate);

// Роут для получения активности пользователей за день/месяц/год
router.get('/user-activity/:period', templateController.getUserActivity);
module.exports = router;
