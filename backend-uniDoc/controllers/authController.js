const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = 'your_jwt_secret';
const EMAIL_SECRET = 'your_email_secret'; // Секрет для email подтверждений

// Настройка почтового клиента
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'iimya266@gmail.com',
    pass: 'ksnz zdqp uuyv dxmw',
  },
});

// Контроллер для регистрации одного пользователя
exports.register = async (req, res) => {
  const { firstName, lastName, middleName, email, password, confirmPassword } = req.body;

  // Проверяем, совпадают ли пароли
  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Пароли не совпадают' });
  }

  try {
    // Проверяем, существует ли пользователь с таким email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: 'Пользователь с таким email уже существует' });
    }

    // Хэшируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);

    // Генерируем уникальный userId
    const userId = uuidv4();

    // Создаем нового пользователя
    const newUser = new User({
      firstName,
      lastName,
      middleName,
      email,
      password: hashedPassword,
      userId, // Уникальный userId
    });

    // Сохраняем пользователя
    await newUser.save();

    // Отправляем письмо с подтверждением email
    const emailToken = jwt.sign({ userId: newUser._id }, EMAIL_SECRET, {
      expiresIn: '1d',
    });
    const url = `http://localhost:5001/api/auth/confirm/${emailToken}`;

    await transporter.sendMail({
      to: newUser.email,
      subject: 'Подтверждение email для UniDoc',
      html: `<p>Перейдите по ссылке для подтверждения email: <a href="${url}">${url}</a></p>`,
    });

    res.status(201).json({
      message:
        'Пользователь успешно зарегистрирован. Проверьте почту для подтверждения email.',
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// Контроллер для входа
exports.login = async (req, res) => {
  const { loginField, password } = req.body; // Используем loginField для email или userId

  try {
    // Ищем пользователя по email или userId
    const user = await User.findOne({
      $or: [{ email: loginField }, { userId: loginField }],
    });
    if (!user) {
      return res.status(400).json({ message: 'Неверный email, ID или пароль' });
    }

    // Проверяем правильность пароля
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Неверный email, ID или пароль' });
    }

    // Генерируем JWT токен
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });

    // Убираем пароль перед возвратом данных
    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;

    // Возвращаем токен и данные пользователя
    res.json({ token, user: userWithoutPassword, message: 'Вход выполнен успешно' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// Контроллер для массовой регистрации пользователей
exports.registerMany = async (req, res) => {
  const users = req.body; // Ожидаем массив пользователей

  try {
    const createdUsers = [];
    for (let userData of users) {
      const {
        firstName,
        lastName,
        middleName,
        password,
        role,
        email,
        id: userId,
      } = userData;

      // Хэшируем пароль для каждого пользователя
      const hashedPassword = await bcrypt.hash(password, 10);

      // Создаем нового пользователя
      const newUser = new User({
        firstName,
        lastName,
        middleName,
        email, // Email передается
        password: hashedPassword,
        role: role || 'student',
        userId, // Используем переданный userId
      });

      // Сохраняем пользователя в базу данных
      const savedUser = await newUser.save();
      createdUsers.push({
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        middleName: savedUser.middleName,
        role: savedUser.role,
        id: savedUser._id,
        userId: savedUser.userId, // Передаем userId в ответ
        email: savedUser.email, // Email также передаем в ответ
      });
    }

    // Возвращаем всех созданных пользователей
    res
      .status(201)
      .json({ message: 'Пользователи успешно зарегистрированы', users: createdUsers });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Ошибка сервера при массовой регистрации пользователей' });
  }
};

// Контроллер для отправки письма с подтверждением email
exports.sendVerificationEmail = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Пользователь с таким email не найден' });
    }

    // Генерируем токен для подтверждения email
    const emailToken = jwt.sign({ userId: user._id }, EMAIL_SECRET, { expiresIn: '1d' });

    const url = `http://localhost:5001/api/auth/confirm/${emailToken}`;

    // Отправляем письмо пользователю
    await transporter.sendMail({
      to: email,
      subject: 'Подтверждение email для UniDoc',
      html: `<p>Перейдите по ссылке для подтверждения email: <a href="${url}">${url}</a></p>`,
    });

    res.status(200).json({ message: 'Письмо с подтверждением отправлено на email' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера при отправке письма' });
  }
};

// Контроллер для подтверждения email
exports.confirmEmail = async (req, res) => {
  const { token } = req.params;

  try {
    const decoded = jwt.verify(token, EMAIL_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(400).json({ message: 'Неверный токен' });
    }

    user.isVerified = true;
    await user.save();

    res.status(200).json({ message: 'Email успешно подтверждён' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера при подтверждении email' });
  }
};

// Контроллер для изменения данных пользователя
exports.updateUser = async (req, res) => {
  const { userId } = req.params; // Получаем userId из параметров запроса
  const { firstName, lastName, middleName, password, email } = req.body; // Данные из тела запроса

  try {
    // Поиск пользователя по userId
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Обновляем поля, если они переданы
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.middleName = middleName || user.middleName;
    user.email = email || user.email;

    // Если передан новый пароль, хэшируем его
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    // Сохраняем изменения
    await user.save();

    res.status(200).json({ message: 'Данные пользователя обновлены' });
  } catch (error) {
    console.error('Ошибка при обновлении пользователя:', error); // Логируем ошибку для отладки
    res.status(500).json({
      message: 'Ошибка сервера при обновлении данных пользователя',
      error: error.message, // Отправляем сообщение ошибки для отладки на клиенте
    });
  }
};
exports.getUserById = async (req, res) => {
  const { userId } = req.params; // Получаем userId из параметров запроса

  try {
    // Поиск пользователя по userId
    const user = await User.findOne({ userId });

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Преобразуем пользователя в объект и удаляем пароль
    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password; // Удаляем поле пароля

    // Отправляем данные пользователя без пароля
    res.status(200).json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Ошибка при получении данных пользователя:', error); // Логируем ошибку
    res.status(500).json({
      message: 'Ошибка сервера при получении данных пользователя',
      error: error.message, // Отправляем сообщение ошибки для отладки на клиенте
    });
  }
};
