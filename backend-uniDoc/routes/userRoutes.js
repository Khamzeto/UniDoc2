const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Роут для получения всех пользователей
router.get('/', userController.getAllUsers);

// Роут для удаления пользователя по ID
router.delete('/:id', userController.deleteUserById);

module.exports = router;
