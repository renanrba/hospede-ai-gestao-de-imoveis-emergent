import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Plus, Trash2, TrendingUp, TrendingDown, Edit } from 'lucide-react';
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
  const [selectedProperties, setSelectedProperties] = useState([]);
  const [splitType, setSplitType] = useState('full');
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [filterMonth, setFilterMonth] = useState('all');
  const [formData, setFormData] = useState({
    property_id: '',
    type: 'income',
    category: '',
    amount: '',
    description: '',
    date: '2025-12',
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

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      property_id: transaction.property_id,
      type: transaction.type,
      category: transaction.category || '',
      amount: transaction.amount.toString(),
      description: transaction.description || '',
      date: transaction.date,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      if (editingTransaction) {
        // Update existing transaction
        await axios.put(`${API}/transactions/${editingTransaction.id}`, {
          property_id: formData.property_id,
          type: formData.type,
          category: formData.category,
          amount: parseFloat(formData.amount),
          description: formData.description,
          date: formData.date,
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Lançamento atualizado com sucesso!');
      } else if (formData.type === 'expense' && selectedProperties.length > 0) {
        // Multiple properties
        const totalAmount = parseFloat(formData.amount);
        let propertiesToProcess = [];
        
        if (splitType === 'equal') {
          const amountPerProperty = totalAmount / selectedProperties.length;
          propertiesToProcess = selectedProperties.map(propId => ({
            property_id: propId,
            amount: amountPerProperty
          }));
        } else {
          propertiesToProcess = selectedProperties.map(propId => ({
            property_id: propId,
            amount: totalAmount
          }));
        }
        
        await Promise.all(propertiesToProcess.map(prop => 
          axios.post(`${API}/transactions`, {
            property_id: prop.property_id,
            type: formData.type,
            category: formData.category,
            amount: prop.amount,
            description: formData.description + (splitType === 'equal' ? ' (Rateado)' : ''),
            date: formData.date,
          }, {
            headers: { Authorization: `Bearer ${token}` },
          })
        ));
        
        toast.success(`Despesa adicionada para ${propertiesToProcess.length} propriedade(s)!`);
      } else {
        // Single transaction
        await axios.post(`${API}/transactions`, {
          ...formData,
          amount: parseFloat(formData.amount),
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Lançamento adicionado com sucesso!');
      }
      
      setIsDialogOpen(false);
      setEditingTransaction(null);
      setFormData({
        property_id: '',
        type: 'income',
        category: '',
        amount: '',
        description: '',
        date: '2025-12',
      });
      setSelectedProperties([]);
      setSplitType('full');
      fetchTransactions();
    } catch (error) {
      toast.error('Erro ao processar lançamento');
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

  const getAvailableMonths = () => {
    const months = [...new Set(transactions.map(t => t.date))].sort().reverse();
    return months;
  };

  const getFilteredTransactions = (type) => {
    let filtered = transactions.filter(t => t.type === type);
    if (filterMonth !== 'all') {
      filtered = filtered.filter(t => t.date === filterMonth);
    }
    return filtered.sort((a, b) => b.date.localeCompare(a.date));
  };

  const calculateTotal = (type) => {
    const filtered = getFilteredTransactions(type);
    return filtered.reduce((sum, t) => sum + t.amount, 0);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-heading font-bold text-stone-900 mb-2">Lançamentos</h1>
          <p className="text-stone-600">Registre receitas e despesas mensais</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingTransaction(null);
            setFormData({
              property_id: '',
              type: 'income',
              category: '',
              amount: '',
              description: '',
              date: '2025-12',
            });
            setSelectedProperties([]);
            setSplitType('full');
          }
        }}>
          <DialogTrigger asChild>
            <Button data-testid="add-transaction-button" className="bg-stone-900 hover:bg-emerald-700 text-white rounded-sm px-6 py-2 font-medium tracking-wide">
              <Plus size={20} strokeWidth={1.5} className="mr-2" />
              Novo Lançamento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTransaction ? 'Editar Lançamento' : 'Novo Lançamento'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="type">Tipo</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => {
                    setFormData({ ...formData, type: value, category: '' });
                    setSelectedProperties([]);
                    setSplitType('full');
                  }}
                  disabled={!!editingTransaction}
                >
                  <SelectTrigger data-testid="transaction-type-select" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Receita</SelectItem>
                    <SelectItem value="expense">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.type === 'expense' && !editingTransaction ? (
                <>
                  <div>
                    <Label>Propriedades</Label>
                    <p className="text-xs text-stone-500 mb-2">Selecione uma ou mais propriedades</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto border border-stone-200 rounded-sm p-3">
                      {properties.map(prop => (
                        <label key={prop.id} className="flex items-center gap-2 cursor-pointer hover:bg-stone-50 p-2 rounded">
                          <input
                            type="checkbox"
                            checked={selectedProperties.includes(prop.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProperties([...selectedProperties, prop.id]);
                              } else {
                                setSelectedProperties(selectedProperties.filter(id => id !== prop.id));
                              }
                            }}
                            className="rounded border-stone-300"
                          />
                          <span className="text-sm text-stone-900">{prop.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {selectedProperties.length > 1 && (
                    <div>
                      <Label>Tipo de Rateio</Label>
                      <Select value={splitType} onValueChange={setSplitType}>
                        <SelectTrigger data-testid="split-type-select" className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full">Valor Total para Cada</SelectItem>
                          <SelectItem value="equal">Dividir Igualmente</SelectItem>
                        </SelectContent>
                      </Select>
                      {splitType === 'equal' && formData.amount && (
                        <p className="text-xs text-stone-600 mt-1">
                          Cada propriedade: R$ {(parseFloat(formData.amount) / selectedProperties.length).toFixed(2)}
                        </p>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <Label htmlFor="property">Propriedade</Label>
                  <Select 
                    value={formData.property_id} 
                    onValueChange={(value) => setFormData({ ...formData, property_id: value })}
                    disabled={editingTransaction && formData.type === 'expense'}
                  >
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
              )}

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
                disabled={formData.type === 'expense' && !editingTransaction ? selectedProperties.length === 0 : !formData.property_id}
                className="w-full bg-stone-900 hover:bg-emerald-700 text-white rounded-sm px-6 py-2 font-medium tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingTransaction ? 'Atualizar' : 'Adicionar'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6">
        <Label>Filtrar por Mês</Label>
        <Select value={filterMonth} onValueChange={setFilterMonth}>
          <SelectTrigger data-testid="month-filter" className="mt-1 w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Meses</SelectItem>
            {getAvailableMonths().map(month => (
              <SelectItem key={month} value={month}>{formatMonth(month)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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
                  {getFilteredTransactions('income').map((trans) => (
                    <tr key={trans.id} data-testid={`transaction-row-${trans.id}`} className="border-b border-stone-100 hover:bg-stone-50">
                      <td className="p-4 text-sm text-stone-600">{formatMonth(trans.date)}</td>
                      <td className="p-4 text-sm text-stone-900">{getPropertyName(trans.property_id)}</td>
                      <td className="p-4 text-sm text-stone-600">{trans.description || '-'}</td>
                      <td className="p-4 text-right font-mono font-medium text-teal-600">{formatCurrency(trans.amount)}</td>
                      <td className="p-4 text-right">
                        <Button
                          data-testid={`edit-transaction-${trans.id}`}
                          onClick={() => handleEdit(trans)}
                          variant="ghost"
                          size="sm"
                          className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 mr-2"
                        >
                          <Edit size={16} strokeWidth={1.5} />
                        </Button>
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
                <tfoot className="border-t-2 border-stone-300 bg-stone-50">
                  <tr>
                    <td colSpan="3" className="p-4 text-right font-semibold text-stone-900">Total:</td>
                    <td className="p-4 text-right font-mono font-bold text-teal-700 text-lg">{formatCurrency(calculateTotal('income'))}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            {getFilteredTransactions('income').length === 0 && (
              <div className="text-center py-12">
                <p className="text-stone-600">Nenhuma receita registrada {filterMonth !== 'all' ? 'para este período' : 'ainda'}.</p>
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
                  {getFilteredTransactions('expense').map((trans) => (
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
                          data-testid={`edit-transaction-${trans.id}`}
                          onClick={() => handleEdit(trans)}
                          variant="ghost"
                          size="sm"
                          className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 mr-2"
                        >
                          <Edit size={16} strokeWidth={1.5} />
                        </Button>
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
                <tfoot className="border-t-2 border-stone-300 bg-stone-50">
                  <tr>
                    <td colSpan="4" className="p-4 text-right font-semibold text-stone-900">Total:</td>
                    <td className="p-4 text-right font-mono font-bold text-orange-700 text-lg">{formatCurrency(calculateTotal('expense'))}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            {getFilteredTransactions('expense').length === 0 && (
              <div className="text-center py-12">
                <p className="text-stone-600">Nenhuma despesa registrada {filterMonth !== 'all' ? 'para este período' : 'ainda'}.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TransactionsPage;
