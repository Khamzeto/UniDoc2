// routes/documentRequestRoutes.js

const express = require('express');
const router = express.Router();
const documentRequestController = require('../controllers/documentRequestController');

// Маршрут для создания нового заявления
router.post('/', documentRequestController.createDocumentRequest);

// Маршрут для обновления статуса заявления
router.put('/:id/status', documentRequestController.updateDocumentStatus);

// Маршрут для получения списка всех заявлений
router.get('/', documentRequestController.getAllDocumentRequests);

// Маршрут для получения конкретного заявления по ID
router.get('/:id', documentRequestController.getDocumentRequestById);

// Маршрут для получения заявлений по userId
router.get('/user/:userId', documentRequestController.getDocumentRequestsByUserId);

// Маршрут для получения заявлений по статусу
router.get('/status/:status', documentRequestController.getDocumentRequestsByStatus);

// Маршрут для отклонения заявления с комментарием
router.put('/:id/reject', documentRequestController.rejectDocumentRequest);
router.put('/:id/manual-sign', documentRequestController.uploadDocumentManually);
router.put('/:id/manual-sign-html', documentRequestController.uploadDocumentManuallyHtml);
router.get('/:id/document', documentRequestController.getDocumentByRequestId);
module.exports = router;
