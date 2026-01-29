import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, AlertCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const COLORS = ['#EA580C', '#EAB308', '#0D9488', '#047857', '#7C3AED', '#EC4899', '#F97316', '#10B981'];

const DashboardPage = () => {
  const [currentMonth, setCurrentMonth] = useState('2025-12');
  const [report, setReport] = useState(null);
  const [combinedData, setCombinedData] = useState([]);

  useEffect(() => {
    fetchData();
  }, [currentMonth]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [reportRes, incomeRes, expensesRes] = await Promise.all([
        axios.get(`${API}/reports/monthly?month=${currentMonth}`, config),
        axios.get(`${API}/reports/income-by-month`, config),
        axios.get(`${API}/reports/expenses-by-month`, config),
      ]);

      setReport(reportRes.data);

      // Combinar dados de receitas e despesas
      const monthsMap = {};
      incomeRes.data.forEach(item => {
        monthsMap[item.month] = { month: item.month, receitas: item.income, despesas: 0 };
      });
      expensesRes.data.forEach(item => {
        if (monthsMap[item.month]) {
          monthsMap[item.month].despesas = item.expenses;
        } else {
          monthsMap[item.month] = { month: item.month, receitas: 0, despesas: item.expenses };
        }
      });

      setCombinedData(Object.values(monthsMap).sort((a, b) => a.month.localeCompare(b.month)));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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

  const getCategoryPieData = () => {
    if (!report || !report.expenses_by_category) return [];
    return Object.entries(report.expenses_by_category).map(([category, amount]) => ({
      name: category,
      value: amount
    }));
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-heading font-bold text-stone-900 mb-2">Dashboard</h1>
        <p className="text-stone-600">Visão geral das suas propriedades</p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-stone-700 mb-2">Mês de referência</label>
        <input
          data-testid="month-selector"
          type="month"
          value={currentMonth}
          onChange={(e) => setCurrentMonth(e.target.value)}
          className="border border-stone-200 rounded-sm px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-700"
        />
      </div>

      {report && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div data-testid="income-card" className="bg-white border border-stone-200 rounded-sm p-6 hover:border-emerald-600 transition-colors duration-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-stone-600">Receita Total</span>
              <TrendingUp className="text-teal-600" size={20} strokeWidth={1.5} />
            </div>
            <p className="text-3xl font-mono font-bold text-stone-900">{formatCurrency(report.total_income)}</p>
          </div>

          <div data-testid="expenses-card" className="bg-white border border-stone-200 rounded-sm p-6 hover:border-emerald-600 transition-colors duration-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-stone-600">Despesas Totais</span>
              <TrendingDown className="text-orange-600" size={20} strokeWidth={1.5} />
            </div>
            <p className="text-3xl font-mono font-bold text-stone-900">{formatCurrency(report.total_expenses)}</p>
          </div>

          <div data-testid="commission-card" className="bg-white border border-stone-200 rounded-sm p-6 hover:border-emerald-600 transition-colors duration-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-stone-600">Comissão (15%)</span>
              <AlertCircle className="text-stone-600" size={20} strokeWidth={1.5} />
            </div>
            <p className="text-3xl font-mono font-bold text-stone-900">{formatCurrency(report.commission)}</p>
          </div>

          <div data-testid="balance-card" className="bg-white border border-stone-200 rounded-sm p-6 hover:border-emerald-600 transition-colors duration-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-stone-600">Saldo do Mês</span>
              <DollarSign className="text-emerald-700" size={20} strokeWidth={1.5} />
            </div>
            <p className={`text-3xl font-mono font-bold ${report.net_profit >= 0 ? 'text-emerald-700' : 'text-orange-600'}`}>
              {formatCurrency(report.net_profit)}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div data-testid="combined-chart" className="bg-white border border-stone-200 rounded-sm p-6">
          <h2 className="text-xl font-heading font-semibold text-stone-900 mb-4">Receitas e Despesas Mensais</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={combinedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis dataKey="month" tickFormatter={formatMonth} stroke="#57534e" />
              <YAxis stroke="#57534e" />
              <Tooltip formatter={(value) => formatCurrency(value)} labelFormatter={formatMonth} />
              <Legend />
              <Bar dataKey="receitas" fill="#0D9488" name="Receitas" radius={[4, 4, 0, 0]} />
              <Bar dataKey="despesas" fill="#EA580C" name="Despesas" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {report && getCategoryPieData().length > 0 && (
          <div data-testid="category-pie-chart" className="bg-white border border-stone-200 rounded-sm p-6">
            <h2 className="text-xl font-heading font-semibold text-stone-900 mb-4">Despesas por Categoria</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={getCategoryPieData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent, value }) => `${name}: ${formatCurrency(value)} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {getCategoryPieData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
