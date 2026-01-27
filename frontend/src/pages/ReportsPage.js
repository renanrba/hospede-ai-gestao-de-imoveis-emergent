import { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ReportsPage = () => {
  const [energyData, setEnergyData] = useState([]);

  useEffect(() => {
    fetchEnergyData();
  }, []);

  const fetchEnergyData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/reports/energy-comparison`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEnergyData(response.data);
    } catch (error) {
      console.error('Error fetching energy data:', error);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatMonth = (monthStr) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-heading font-bold text-stone-900 mb-2">Relatórios</h1>
        <p className="text-stone-600">Análise detalhada dos seus gastos</p>
      </div>

      <div data-testid="energy-comparison-chart" className="bg-white border border-stone-200 rounded-sm p-6">
        <h2 className="text-xl font-heading font-semibold text-stone-900 mb-4">Comparativo de Gastos com Energia</h2>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={energyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
            <XAxis dataKey="month" tickFormatter={formatMonth} stroke="#57534e" />
            <YAxis stroke="#57534e" />
            <Tooltip formatter={(value) => formatCurrency(value)} labelFormatter={formatMonth} />
            <Legend />
            <Line type="monotone" dataKey="energy" stroke="#EAB308" strokeWidth={2} name="Energia (Luz)" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {energyData.length === 0 && (
        <div className="bg-white border border-stone-200 rounded-sm p-12 text-center">
          <p className="text-stone-600">Nenhum dado de energia registrado ainda.</p>
          <p className="text-stone-500 text-sm mt-2">Adicione despesas na categoria "Luz" para visualizar o comparativo.</p>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;