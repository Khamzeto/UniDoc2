const express = require('express');
const {
  register,
  login,
  registerMany,
  sendVerificationEmail,
  confirmEmail,
  updateUser,
  getUserById,
} = require('../controllers/authController');

const router = express.Router();

// Маршрут для регистрации
router.post('/register', register);

// Маршрут для входа
router.post('/login', login);

router.post('/registerMany', registerMany);
router.post('/send-verification', sendVerificationEmail);

// Маршрут для подтверждения email
router.get('/confirm/:token', confirmEmail);

// Маршрут для изменения данных пользователя
router.put('/update/:userId', updateUser);
router.get('/user/:userId', getUserById);

module.exports = router;
