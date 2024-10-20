const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  middleName: { type: String }, // Отчество необязательно
  email: { type: String, unique: true },
  userId: { type: String, unique: true, required: true }, // Уникальный идентификатор пользователя
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['student', 'admin', 'teacher', 'dean', 'prorektor'], // Возможные роли
    default: 'student',
  },
  isVerified: { type: Boolean, default: false }, // Поле для отслеживания подтверждения email
});

module.exports = mongoose.model('User', userSchema);
