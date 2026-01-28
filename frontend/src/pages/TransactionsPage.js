import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Plus, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EXPENSE_CATEGORIES = ['Limpeza', 'Manutenção', 'Água', 'Luz', 'Internet', 'Impostos', 'Condomínio', 'Serviços'];

const TransactionsPage = () => {
  const [properties, setProperties] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('income');
  const [formData, setFormData] = useState({
    property_id: '',
    type: 'income',
    category: '',
    amount: '',
    description: '',
    date: new Date().toISOString().slice(0, 7),
  });

  useEffect(() => {
    fetchProperties();
    fetchTransactions();
  }, []);

  const fetchProperties = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/properties`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProperties(response.data);
    } catch (error) {
      toast.error('Erro ao carregar propriedades');
    }
  };

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTransactions(response.data);
    } catch (error) {
      toast.error('Erro ao carregar lançamentos');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/transactions`, {
        ...formData,
        amount: parseFloat(formData.amount),
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Lançamento adicionado com sucesso!');
      setIsDialogOpen(false);
      setFormData({
        property_id: '',
        type: 'income',
        category: '',
        amount: '',
        description: '',
        date: new Date().toISOString().slice(0, 7),
      });
      fetchTransactions();
    } catch (error) {
      toast.error('Erro ao adicionar lançamento');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este lançamento?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/transactions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Lançamento removido com sucesso!');
      fetchTransactions();
    } catch (error) {
      toast.error('Erro ao remover lançamento');
    }
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

  const getPropertyName = (propertyId) => {
    const property = properties.find(p => p.id === propertyId);
    return property?.name || 'Desconhecida';
  };

  const filteredTransactions = transactions.filter(t => t.type === activeTab);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-heading font-bold text-stone-900 mb-2">Lançamentos</h1>
          <p className="text-stone-600">Registre receitas e despesas mensais</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="add-transaction-button" className="bg-stone-900 hover:bg-emerald-700 text-white rounded-sm px-6 py-2 font-medium tracking-wide">
              <Plus size={20} strokeWidth={1.5} className="mr-2" />
              Novo Lançamento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Lançamento</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="property">Propriedade</Label>
                <Select value={formData.property_id} onValueChange={(value) => setFormData({ ...formData, property_id: value })}>
                  <SelectTrigger data-testid="transaction-property-select" className="mt-1">
                    <SelectValue placeholder="Selecione uma propriedade" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map(prop => (
                      <SelectItem key={prop.id} value={prop.id}>{prop.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="type">Tipo</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value, category: '' })}>
                  <SelectTrigger data-testid="transaction-type-select" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Receita</SelectItem>
                    <SelectItem value="expense">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.type === 'expense' && (
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger data-testid="transaction-category-select" className="mt-1">
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="amount">Valor (R$)</Label>
                <Input
                  id="amount"
                  data-testid="transaction-amount-input"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  className="mt-1"
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="date">Mês</Label>
                <Input
                  id="date"
                  data-testid="transaction-date-input"
                  type="month"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Input
                  id="description"
                  data-testid="transaction-description-input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1"
                  placeholder="Ex: Pagamento Airbnb"
                />
              </div>

              <Button
                data-testid="submit-transaction-button"
                type="submit"
                className="w-full bg-stone-900 hover:bg-emerald-700 text-white rounded-sm px-6 py-2 font-medium tracking-wide"
              >
                Adicionar
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger data-testid="income-tab" value="income" className="flex items-center gap-2">
            <TrendingUp size={16} strokeWidth={1.5} />
            Receitas
          </TabsTrigger>
          <TabsTrigger data-testid="expense-tab" value="expense" className="flex items-center gap-2">
            <TrendingDown size={16} strokeWidth={1.5} />
            Despesas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="income">
          <div className="bg-white border border-stone-200 rounded-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-stone-200">
                  <tr>
                    <th className="text-left p-4 font-medium text-stone-700">Data</th>
                    <th className="text-left p-4 font-medium text-stone-700">Propriedade</th>
                    <th className="text-left p-4 font-medium text-stone-700">Descrição</th>
                    <th className="text-right p-4 font-medium text-stone-700">Valor</th>
                    <th className="text-right p-4 font-medium text-stone-700">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((trans) => (
                    <tr key={trans.id} data-testid={`transaction-row-${trans.id}`} className="border-b border-stone-100 hover:bg-stone-50">
                      <td className="p-4 text-sm text-stone-600">{formatMonth(trans.date)}</td>
                      <td className="p-4 text-sm text-stone-900">{getPropertyName(trans.property_id)}</td>
                      <td className="p-4 text-sm text-stone-600">{trans.description || '-'}</td>
                      <td className="p-4 text-right font-mono font-medium text-teal-600">{formatCurrency(trans.amount)}</td>
                      <td className="p-4 text-right">
                        <Button
                          data-testid={`delete-transaction-${trans.id}`}
                          onClick={() => handleDelete(trans.id)}
                          variant="ghost"
                          size="sm"
                          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                        >
                          <Trash2 size={16} strokeWidth={1.5} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredTransactions.length === 0 && (
              <div className="text-center py-12">
                <p className="text-stone-600">Nenhuma receita registrada ainda.</p>
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
                    <th className="text-left p-4 font-medium text-stone-700">Propriedade</th>
                    <th className="text-left p-4 font-medium text-stone-700">Categoria</th>
                    <th className="text-left p-4 font-medium text-stone-700">Descrição</th>
                    <th className="text-right p-4 font-medium text-stone-700">Valor</th>
                    <th className="text-right p-4 font-medium text-stone-700">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((trans) => (
                    <tr key={trans.id} data-testid={`transaction-row-${trans.id}`} className="border-b border-stone-100 hover:bg-stone-50">
                      <td className="p-4 text-sm text-stone-600">{formatMonth(trans.date)}</td>
                      <td className="p-4 text-sm text-stone-900">{getPropertyName(trans.property_id)}</td>
                      <td className="p-4 text-sm">
                        <span className="inline-block px-2 py-1 text-xs bg-stone-100 text-stone-700 rounded-sm">
                          {trans.category}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-stone-600">{trans.description || '-'}</td>
                      <td className="p-4 text-right font-mono font-medium text-orange-600">{formatCurrency(trans.amount)}</td>
                      <td className="p-4 text-right">
                        <Button
                          data-testid={`delete-transaction-${trans.id}`}
                          onClick={() => handleDelete(trans.id)}
                          variant="ghost"
                          size="sm"
                          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                        >
                          <Trash2 size={16} strokeWidth={1.5} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredTransactions.length === 0 && (
              <div className="text-center py-12">
                <p className="text-stone-600">Nenhuma despesa registrada ainda.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TransactionsPage;