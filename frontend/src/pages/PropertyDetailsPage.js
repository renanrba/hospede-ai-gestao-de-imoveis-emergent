import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PropertyDetailsPage = () => {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
    expensesByCategory: {}
  });
  const [selectedMonth, setSelectedMonth] = useState('2025-12');

  useEffect(() => {
    fetchPropertyData();
  }, [propertyId]);

  useEffect(() => {
    if (transactions.length > 0) {
      calculateSummary();
    }
  }, [transactions, selectedMonth]);

  const fetchPropertyData = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [propRes, transRes] = await Promise.all([
        axios.get(`${API}/properties`, config),
        axios.get(`${API}/transactions`, config)
      ]);

      const prop = propRes.data.find(p => p.id === propertyId);
      setProperty(prop);

      const propTransactions = transRes.data.filter(t => t.property_id === propertyId);
      setTransactions(propTransactions);
    } catch (error) {
      console.error('Error fetching property data:', error);
    }
  };

  const calculateSummary = () => {
    const filtered = selectedMonth === 'all' 
      ? transactions 
      : transactions.filter(t => t.date === selectedMonth);

    const totalIncome = filtered
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = filtered
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const expensesByCategory = {};
    filtered
      .filter(t => t.type === 'expense' && t.category)
      .forEach(t => {
        expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
      });

    setSummary({
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
      expensesByCategory
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatMonth = (dateStr) => {
    const [year, month] = dateStr.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const getCategoryChartData = () => {
    return Object.entries(summary.expensesByCategory).map(([category, amount]) => ({
      name: category,
      value: amount
    }));
  };

  const getMonthlyData = () => {
    const monthlyMap = {};
    
    transactions.forEach(t => {
      if (!monthlyMap[t.date]) {
        monthlyMap[t.date] = { month: t.date, income: 0, expenses: 0 };
      }
      if (t.type === 'income') {
        monthlyMap[t.date].income += t.amount;
      } else {
        monthlyMap[t.date].expenses += t.amount;
      }
    });

    return Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));
  };

  const COLORS = ['#EA580C', '#EAB308', '#0D9488', '#047857', '#7C3AED', '#EC4899', '#F97316', '#10B981'];

  if (!property) {
    return <div className="p-8">Carregando...</div>;
  }

  const incomeTransactions = transactions.filter(t => t.type === 'income');
  const expenseTransactions = transactions.filter(t => t.type === 'expense');

  return (
    <div className="p-8">
      <Button
        data-testid="back-button"
        onClick={() => navigate('/properties')}
        variant="ghost"
        className="mb-6 text-stone-600 hover:text-stone-900"
      >
        <ArrowLeft size={20} className="mr-2" />
        Voltar para Propriedades
      </Button>

      <div className="mb-8">
        <div className="flex items-start gap-6">
          {property.image_url && (
            <div className="w-48 h-32 rounded-sm overflow-hidden border border-stone-200">
              <img src={property.image_url} alt={property.name} className="w-full h-full object-cover" />
            </div>
          )}
          <div>
            <h1 className="text-4xl font-heading font-bold text-stone-900 mb-2">{property.name}</h1>
            <span className="inline-block px-3 py-1 text-sm bg-stone-100 text-stone-700 rounded-sm">
              {property.type === 'airbnb' ? 'Airbnb' : 'Residencial'}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-stone-700 mb-2">Filtrar por Período</label>
        <select
          data-testid="period-filter"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="border border-stone-200 rounded-sm px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-700"
        >
          <option value="all">Todos os Períodos</option>
          {[...new Set(transactions.map(t => t.date))].sort().reverse().map(month => (
            <option key={month} value={month}>{formatMonth(month)}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div data-testid="property-income-card" className="bg-white border border-stone-200 rounded-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-stone-600">Receita Total</span>
            <TrendingUp className="text-teal-600" size={20} strokeWidth={1.5} />
          </div>
          <p className="text-3xl font-mono font-bold text-stone-900">{formatCurrency(summary.totalIncome)}</p>
        </div>

        <div data-testid="property-expenses-card" className="bg-white border border-stone-200 rounded-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-stone-600">Despesas Totais</span>
            <TrendingDown className="text-orange-600" size={20} strokeWidth={1.5} />
          </div>
          <p className="text-3xl font-mono font-bold text-stone-900">{formatCurrency(summary.totalExpenses)}</p>
        </div>

        <div data-testid="property-profit-card" className="bg-white border border-stone-200 rounded-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-stone-600">Lucro Líquido</span>
            <DollarSign className="text-emerald-700" size={20} strokeWidth={1.5} />
          </div>
          <p className={`text-3xl font-mono font-bold ${summary.netProfit >= 0 ? 'text-emerald-700' : 'text-orange-600'}`}>
            {formatCurrency(summary.netProfit)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div data-testid="monthly-chart" className="bg-white border border-stone-200 rounded-sm p-6">
          <h2 className="text-xl font-heading font-semibold text-stone-900 mb-4">Receitas vs Despesas</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getMonthlyData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis dataKey="month" tickFormatter={formatMonth} stroke="#57534e" />
              <YAxis stroke="#57534e" />
              <Tooltip formatter={(value) => formatCurrency(value)} labelFormatter={formatMonth} />
              <Legend />
              <Bar dataKey="income" fill="#0D9488" name="Receitas" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill="#EA580C" name="Despesas" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {Object.keys(summary.expensesByCategory).length > 0 && (
          <div data-testid="category-pie-chart" className="bg-white border border-stone-200 rounded-sm p-6">
            <h2 className="text-xl font-heading font-semibold text-stone-900 mb-4">Despesas por Categoria</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={getCategoryChartData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {getCategoryChartData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <Tabs defaultValue="income" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger data-testid="income-transactions-tab" value="income">
            Receitas ({incomeTransactions.length})
          </TabsTrigger>
          <TabsTrigger data-testid="expense-transactions-tab" value="expense">
            Despesas ({expenseTransactions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="income">
          <div className="bg-white border border-stone-200 rounded-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-stone-200">
                  <tr>
                    <th className="text-left p-4 font-medium text-stone-700">Data</th>
                    <th className="text-left p-4 font-medium text-stone-700">Descrição</th>
                    <th className="text-right p-4 font-medium text-stone-700">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {incomeTransactions
                    .filter(t => selectedMonth === 'all' || t.date === selectedMonth)
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((trans) => (
                    <tr key={trans.id} className="border-b border-stone-100 hover:bg-stone-50">
                      <td className="p-4 text-sm text-stone-600">{formatMonth(trans.date)}</td>
                      <td className="p-4 text-sm text-stone-900">{trans.description || '-'}</td>
                      <td className="p-4 text-right font-mono font-medium text-teal-600">
                        {formatCurrency(trans.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {incomeTransactions.filter(t => selectedMonth === 'all' || t.date === selectedMonth).length === 0 && (
              <div className="text-center py-12">
                <p className="text-stone-600">Nenhuma receita registrada para este período.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="expense">
          <div className="bg-white border border-stone-200 rounded-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-stone-200">
                  <tr>
                    <th className="text-left p-4 font-medium text-stone-700">Data</th>
                    <th className="text-left p-4 font-medium text-stone-700">Categoria</th>
                    <th className="text-left p-4 font-medium text-stone-700">Descrição</th>
                    <th className="text-right p-4 font-medium text-stone-700">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {expenseTransactions
                    .filter(t => selectedMonth === 'all' || t.date === selectedMonth)
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((trans) => (
                    <tr key={trans.id} className="border-b border-stone-100 hover:bg-stone-50">
                      <td className="p-4 text-sm text-stone-600">{formatMonth(trans.date)}</td>
                      <td className="p-4 text-sm">
                        <span className="inline-block px-2 py-1 text-xs bg-stone-100 text-stone-700 rounded-sm">
                          {trans.category}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-stone-900">{trans.description || '-'}</td>
                      <td className="p-4 text-right font-mono font-medium text-orange-600">
                        {formatCurrency(trans.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {expenseTransactions.filter(t => selectedMonth === 'all' || t.date === selectedMonth).length === 0 && (
              <div className="text-center py-12">
                <p className="text-stone-600">Nenhuma despesa registrada para este período.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PropertyDetailsPage;
