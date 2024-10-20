'use client';

import React, { useState } from 'react';

function DocumentDownloader() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [format, setFormat] = useState('docx'); // Новое состояние для формата
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Данные, которые необходимо отправить на сервер
      const requestData = {
        firstName,
        lastName,
        format, // Передаем выбранный формат
      };

      // Отправка POST-запроса на сервер
      const response = await fetch(
        'http://localhost:5001/api/document/templates/6712fa66b85821ea24e10441/fill',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        }
      );

      if (!response.ok) {
        throw new Error('Ошибка при получении документа');
      }

      // Получение бинарных данных из ответа
      const blob = await response.blob();

      // Определение типа контента
      const contentType = response.headers.get('Content-Type');

      // Создание URL для бинарных данных
      const url = window.URL.createObjectURL(blob);

      // Создание ссылки для скачивания
      const a = document.createElement('a');
      a.href = url;

      // Установка имени файла из заголовка ответа или используйте дефолтное
      const contentDisposition = response.headers.get('Content-Disposition');
      let fileName = 'document';

      if (contentDisposition && contentDisposition.indexOf('filename=') !== -1) {
        const fileNameMatch = contentDisposition.match(/filename\*?=(?:UTF-8'')?(.+)/);
        if (fileNameMatch && fileNameMatch.length >= 2) {
          fileName = decodeURIComponent(fileNameMatch[1]);
        }
      } else {
        // Устанавливаем расширение файла на основе Content-Type
        if (contentType === 'application/pdf') {
          fileName += '.pdf';
        } else if (
          contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ) {
          fileName += '.docx';
        } else {
          // Если тип контента неизвестен, используем расширение по умолчанию
          fileName += '.bin';
        }
      }

      a.download = fileName;

      // Добавление ссылки в документ и эмуляция клика
      document.body.appendChild(a);
      a.click();

      // Очистка
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert('Ошибка при скачивании документа');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1>Скачать документ</h1>
      <form onSubmit={handleDownload}>
        <div>
          <label>Имя:</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Фамилия:</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Формат:</label>
          <select value={format} onChange={(e) => setFormat(e.target.value)}>
            <option value="docx">DOCX</option>
            <option value="pdf">PDF</option>
          </select>
        </div>
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Загрузка...' : 'Скачать документ'}
        </button>
      </form>
    </div>
  );
}

export default DocumentDownloader;
