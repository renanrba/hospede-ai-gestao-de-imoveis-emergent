import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, AlertCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DashboardPage = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
  const [report, setReport] = useState(null);
  const [incomeData, setIncomeData] = useState([]);
  const [expensesData, setExpensesData] = useState([]);

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
      setIncomeData(incomeRes.data);
      setExpensesData(expensesRes.data);
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

          <div data-testid="profit-card" className="bg-white border border-stone-200 rounded-sm p-6 hover:border-emerald-600 transition-colors duration-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-stone-600">Lucro Líquido</span>
              <DollarSign className="text-emerald-700" size={20} strokeWidth={1.5} />
            </div>
            <p className="text-3xl font-mono font-bold text-stone-900">{formatCurrency(report.net_profit)}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div data-testid="income-chart" className="bg-white border border-stone-200 rounded-sm p-6">
          <h2 className="text-xl font-heading font-semibold text-stone-900 mb-4">Receitas Mensais</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={incomeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis dataKey="month" tickFormatter={formatMonth} stroke="#57534e" />
              <YAxis stroke="#57534e" />
              <Tooltip formatter={(value) => formatCurrency(value)} labelFormatter={formatMonth} />
              <Bar dataKey="income" fill="#0D9488" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div data-testid="expenses-chart" className="bg-white border border-stone-200 rounded-sm p-6">
          <h2 className="text-xl font-heading font-semibold text-stone-900 mb-4">Despesas Mensais</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={expensesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis dataKey="month" tickFormatter={formatMonth} stroke="#57534e" />
              <YAxis stroke="#57534e" />
              <Tooltip formatter={(value) => formatCurrency(value)} labelFormatter={formatMonth} />
              <Bar dataKey="expenses" fill="#EA580C" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {report && Object.keys(report.expenses_by_category).length > 0 && (
        <div data-testid="category-breakdown" className="mt-6 bg-white border border-stone-200 rounded-sm p-6">
          <h2 className="text-xl font-heading font-semibold text-stone-900 mb-4">Despesas por Categoria</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(report.expenses_by_category).map(([category, amount]) => (
              <div key={category} className="border border-stone-200 rounded-sm p-4">
                <p className="text-sm text-stone-600 mb-1">{category}</p>
                <p className="text-xl font-mono font-bold text-stone-900">{formatCurrency(amount)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;