'use client';

import React, { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, Container, Grid, Group, Select, Text } from '@mantine/core';
import $api from '../api/axiosInstance';

// Цвета для диаграмм
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function Analytic() {
  const [templateData, setTemplateData] = useState([]);
  const [successFailureData, setSuccessFailureData] = useState([]);
  const [userActivityData, setUserActivityData] = useState([]);
  const [period, setPeriod] = useState('day');

  // Получение данных для аналитики
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [successFailureResponse, userActivityResponse] = await Promise.all([
          $api.get(`/api/document/success-failure`),
          $api.get(`/api/document/user-activity/${period}`),
        ]);

        setTemplateData([
          { date: '2024-10-18', totalRequests: 15 },
          { date: '2024-10-19', totalRequests: 25 },
          { date: '2024-10-20', totalRequests: 35 },
        ]);
        const processSuccessFailureData = (data) => [
          { name: 'Успешные заявки', value: parseFloat(data.successRate) },
          { name: 'Отклоненные заявки', value: parseFloat(data.rejectionRate) },
        ];

        console.log(successFailureResponse.data);
        setSuccessFailureData(processSuccessFailureData(successFailureResponse.data));

        setUserActivityData(userActivityResponse.data);
      } catch (error) {
        console.error('Ошибка при получении аналитики:', error);
      }
    };

    fetchAnalytics();
  }, [period]);

  // Опции выбора периода
  const periodOptions = [
    { value: 'day', label: 'За день' },
    { value: 'month', label: 'За месяц' },
    { value: 'year', label: 'За год' },
  ];

  return (
    <Container>
      <Group position="apart" mb="md">
        <Text size="xl" weight={500}>
          Панель аналитики
        </Text>
        <Select
          value={period}
          onChange={setPeriod}
          data={periodOptions}
          placeholder="Выберите период"
        />
      </Group>

      <Grid>
        {/* График по заявкам и их статусу */}
        <Grid.Col span={6}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Text size="lg" weight={500} mb="sm">
              Количество заявок по шаблонам
            </Text>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={templateData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="totalRequests"
                  stroke="#8884d8"
                  name="Всего заявок"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Grid.Col>

        {/* Круговая диаграмма успешных и отклоненных заявок */}
        <Grid.Col span={6}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Text size="lg" weight={500} mb="sm">
              Статистика успешных и отклоненных заявок
            </Text>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  dataKey="value"
                  isAnimationActive={false}
                  data={successFailureData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  label
                >
                  {successFailureData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Grid.Col>

        {/* Бар-чарт активности пользователей */}
        <Grid.Col span={12}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Text size="lg" weight={500} mb="sm">
              Активность пользователей
            </Text>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={userActivityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="uniqueUsers" fill="#8884d8" name="Активные пользователи" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid.Col>
      </Grid>
    </Container>
  );
}
