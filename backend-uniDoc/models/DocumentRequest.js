const mongoose = require('mongoose');

const documentRequestSchema = new mongoose.Schema({
  templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Template', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['processing', 'awaiting_signature', 'success', 'rejected'], // Добавляем 'rejected'
    default: 'processing',
  },
  fields: { type: Map, of: Object, required: true }, // Поля теперь объект с английским и русским значением
  history: { type: Array, default: [] }, // История изменений
  documentPath: { type: String, default: '' }, // Новый путь к сгенерированному документу
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const DocumentRequest = mongoose.model('DocumentRequest', documentRequestSchema);
module.exports = DocumentRequest;
