import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Plus, Trash2, Building2, Eye, Edit } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const designImages = [
  { id: 'flat_1', url: 'https://images.unsplash.com/photo-1761864294727-3c9f6b3e7425?crop=entropy&cs=srgb&fm=jpg&q=85' },
  { id: 'flat_2', url: 'https://images.unsplash.com/photo-1737305467768-cfcbf106a535?crop=entropy&cs=srgb&fm=jpg&q=85' },
  { id: 'flat_3', url: 'https://images.unsplash.com/photo-1737305457553-d6427adfdc8f?crop=entropy&cs=srgb&fm=jpg&q=85' },
  { id: 'flat_4', url: 'https://images.unsplash.com/photo-1737305457462-57fcd66ccee4?crop=entropy&cs=srgb&fm=jpg&q=85' },
  { id: 'res_1', url: 'https://images.unsplash.com/photo-1673977597041-7e6512719d16?crop=entropy&cs=srgb&fm=jpg&q=85' },
];

const PropertiesPage = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'airbnb',
    image_url: designImages[0].url,
  });

  useEffect(() => {
    fetchProperties();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/properties`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Propriedade adicionada com sucesso!');
      setIsDialogOpen(false);
      setFormData({ name: '', type: 'airbnb', image_url: designImages[0].url });
      fetchProperties();
    } catch (error) {
      toast.error('Erro ao adicionar propriedade');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta propriedade?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/properties/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Propriedade removida com sucesso!');
      fetchProperties();
    } catch (error) {
      toast.error('Erro ao remover propriedade');
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-heading font-bold text-stone-900 mb-2">Propriedades</h1>
          <p className="text-stone-600">Gerencie suas propriedades Airbnb e residenciais</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="add-property-button" className="bg-stone-900 hover:bg-emerald-700 text-white rounded-sm px-6 py-2 font-medium tracking-wide">
              <Plus size={20} strokeWidth={1.5} className="mr-2" />
              Adicionar Propriedade
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Propriedade</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome da Propriedade</Label>
                <Input
                  id="name"
                  data-testid="property-name-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="mt-1"
                  placeholder="Ex: Flat 101 - Centro"
                />
              </div>

              <div>
                <Label htmlFor="type">Tipo</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger data-testid="property-type-select" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="airbnb">Airbnb</SelectItem>
                    <SelectItem value="residential">Residencial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Imagem</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {designImages.map((img) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, image_url: img.url })}
                      className={`relative aspect-square border-2 rounded-sm overflow-hidden ${
                        formData.image_url === img.url ? 'border-emerald-700' : 'border-stone-200'
                      }`}
                    >
                      <img src={img.url} alt="Property" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <Button
                data-testid="submit-property-button"
                type="submit"
                className="w-full bg-stone-900 hover:bg-emerald-700 text-white rounded-sm px-6 py-2 font-medium tracking-wide"
              >
                Adicionar
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((property) => (
          <div
            key={property.id}
            data-testid={`property-card-${property.id}`}
            className="bg-white border border-stone-200 rounded-sm overflow-hidden hover:border-emerald-600 transition-colors duration-200"
          >
            <div className="aspect-video w-full bg-stone-200">
              {property.image_url ? (
                <img src={property.image_url} alt={property.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Building2 size={48} className="text-stone-400" strokeWidth={1.5} />
                </div>
              )}
            </div>
            <div className="p-6">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-lg font-heading font-semibold text-stone-900">{property.name}</h3>
                  <span className="inline-block mt-1 px-2 py-1 text-xs bg-stone-100 text-stone-600 rounded-sm">
                    {property.type === 'airbnb' ? 'Airbnb' : 'Residencial'}
                  </span>
                </div>
                <Button
                  data-testid={`delete-property-${property.id}`}
                  onClick={() => handleDelete(property.id)}
                  variant="ghost"
                  size="sm"
                  className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                >
                  <Trash2 size={18} strokeWidth={1.5} />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {properties.length === 0 && (
        <div className="text-center py-12">
          <Building2 size={48} className="mx-auto text-stone-400 mb-4" strokeWidth={1.5} />
          <p className="text-stone-600">Nenhuma propriedade cadastrada ainda.</p>
          <p className="text-stone-500 text-sm mt-2">Clique em "Adicionar Propriedade" para começar.</p>
        </div>
      )}
    </div>
  );
};

export default PropertiesPage;