import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LoginPage = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const endpoint = isLogin ? `${API}/auth/login` : `${API}/auth/register`;
      const payload = isLogin 
        ? { email: formData.email, password: formData.password }
        : formData;
      
      const response = await axios.post(endpoint, payload);
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      toast.success(isLogin ? 'Login realizado com sucesso!' : 'Cadastro realizado com sucesso!');
      onLogin();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao processar solicitação');
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white border border-stone-200 rounded-sm p-8">
          <div className="mb-6 text-center">
            <img 
              src="https://customer-assets.emergentagent.com/job_rental-tracker-66/artifacts/hs7qzcbs_Identidade%20-%20Hospede%20AI.png" 
              alt="HOSPEDE.AI" 
              className="w-48 mx-auto mb-3"
            />
            <h1 className="text-2xl font-heading font-bold text-stone-900">GESTÃO DE IMÓVEIS</h1>
          </div>
          <p className="text-stone-600 mb-8 text-center">
            Gestão financeira para propriedades Airbnb
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  data-testid="name-input"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>
            )}

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                data-testid="email-input"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                data-testid="password-input"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="mt-1"
              />
            </div>

            <Button
              data-testid="submit-button"
              type="submit"
              className="w-full bg-stone-900 hover:bg-emerald-700 text-white rounded-sm px-6 py-2 font-medium tracking-wide"
            >
              {isLogin ? 'Entrar' : 'Cadastrar'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              data-testid="toggle-auth-mode"
              onClick={() => setIsLogin(!isLogin)}
              className="text-stone-600 hover:text-stone-900 text-sm"
            >
              {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Faça login'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;