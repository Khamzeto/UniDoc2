const User = require('../models/User');

// Получить всех пользователей
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find(); // Получить всех пользователей
    res.status(200).json(users);
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Ошибка сервера при получении пользователей.', error });
  }
};

// Удалить пользователя по ID
exports.deleteUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id); // Удалить пользователя по ID

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден.' });
    }

    res.status(200).json({ message: 'Пользователь успешно удален.' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера при удалении пользователя.', error });
  }
};
