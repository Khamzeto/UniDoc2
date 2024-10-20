const mongoose = require('mongoose');

const FieldSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Внутреннее имя поля (например, 'firstName')
  nameRu: { type: String, required: true }, // Русскоязычное отображаемое имя поля (например, 'Имя')
  type: { type: String, default: 'text' },
  filledBy: { type: String, enum: ['user', 'staff'], default: 'user' },
});

const TemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  filePath: { type: String, required: true },
  fileType: { type: String, required: true }, // Убедитесь, что это поле присутствует
  fields: [FieldSchema],
});

module.exports = mongoose.model('Template', TemplateSchema);
