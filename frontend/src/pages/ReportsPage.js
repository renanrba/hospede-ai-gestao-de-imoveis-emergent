import { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ReportsPage = () => {
  const [energyData, setEnergyData] = useState([]);
  const [incomeByPropertyData, setIncomeByPropertyData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('2025-12');
  const [availableMonths, setAvailableMonths] = useState([]);

  useEffect(() => {
    fetchEnergyData();
    fetchAvailableMonths();
  }, []);

  useEffect(() => {
    if (selectedMonth) {
      fetchIncomeByProperty();
    }
  }, [selectedMonth]);

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

  const fetchAvailableMonths = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const months = [...new Set(response.data.map(t => t.date))].sort().reverse();
      setAvailableMonths(months);
    } catch (error) {
      console.error('Error fetching months:', error);
    }
  };

  const fetchIncomeByProperty = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/reports/income-by-property?month=${selectedMonth}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIncomeByPropertyData(response.data);
    } catch (error) {
      console.error('Error fetching income by property:', error);
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
        <p className="text-stone-600">Análise detalhada dos seus gastos e receitas</p>
      </div>

      <div data-testid="energy-comparison-chart" className="bg-white border border-stone-200 rounded-sm p-6 mb-6">
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
        {energyData.length === 0 && (
          <div className="text-center py-12">
            <p className="text-stone-600">Nenhum dado de energia registrado ainda.</p>
            <p className="text-stone-500 text-sm mt-2">Adicione despesas na categoria "Luz" para visualizar o comparativo.</p>
          </div>
        )}
      </div>

      <div data-testid="income-by-property-chart" className="bg-white border border-stone-200 rounded-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-heading font-semibold text-stone-900">Comparativo de Receitas por Propriedade</h2>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Selecione o Mês</label>
            <select
              data-testid="month-selector"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border border-stone-200 rounded-sm px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-700"
            >
              {availableMonths.map(month => (
                <option key={month} value={month}>{formatMonth(month)}</option>
              ))}
            </select>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={incomeByPropertyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
            <XAxis dataKey="property" stroke="#57534e" />
            <YAxis stroke="#57534e" />
            <Tooltip formatter={(value) => formatCurrency(value)} />
            <Legend />
            <Bar dataKey="income" fill="#0D9488" name="Receita" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        {incomeByPropertyData.length === 0 && (
          <div className="text-center py-12">
            <p className="text-stone-600">Nenhuma receita registrada para este período.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
