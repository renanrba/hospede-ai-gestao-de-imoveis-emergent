import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Building2, ArrowLeftRight, BarChart3, LogOut, Download } from 'lucide-react';
import { Button } from './ui/button';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Layout = ({ onLogout }) => {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/properties', label: 'Propriedades', icon: Building2 },
    { path: '/transactions', label: 'Lançamentos', icon: ArrowLeftRight },
    { path: '/reports', label: 'Relatórios', icon: BarChart3 },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleBackup = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Buscar todos os dados
      const [propertiesRes, transactionsRes] = await Promise.all([
        axios.get(`${API}/properties`, config),
        axios.get(`${API}/transactions`, config),
      ]);

      const backupData = {
        user: user,
        properties: propertiesRes.data,
        transactions: transactionsRes.data,
        backup_date: new Date().toISOString(),
        version: '1.0'
      };

      // Criar arquivo JSON para download
      const dataStr = JSON.stringify(backupData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `hospede-ai-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Backup criado com sucesso!');
    } catch (error) {
      toast.error('Erro ao criar backup');
      console.error(error);
    }
  };

  return (
    <div className="flex min-h-screen bg-stone-100">
      <aside className="w-64 bg-stone-900 text-white flex flex-col">
        <div className="p-6 border-b border-stone-700">
          <img 
            src="https://customer-assets.emergentagent.com/job_rental-tracker-66/artifacts/8267tel7_ChatGPT%20Image%2024%20de%20ago.%20de%202025%2C%2015_53_53.png" 
            alt="HOSPEDE.AI" 
            className="w-full mb-3"
          />
          <h1 className="text-sm font-heading font-bold tracking-tight text-center">GESTÃO DE IMÓVEIS</h1>
          <p className="text-xs text-stone-400 mt-2 text-center">{user.name}</p>
        </div>
        
        <nav className="flex-1 p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                data-testid={`nav-${item.label.toLowerCase()}`}
                className={`flex items-center gap-3 px-4 py-3 mb-2 rounded-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'bg-emerald-700 text-white'
                    : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                }`}
              >
                <Icon size={20} strokeWidth={1.5} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-stone-700">
          <Button
            data-testid="backup-button"
            onClick={handleBackup}
            variant="ghost"
            className="w-full justify-start text-stone-300 hover:text-white hover:bg-stone-800 mb-2"
          >
            <Download size={20} strokeWidth={1.5} className="mr-3" />
            Backup Local
          </Button>
          <Button
            data-testid="logout-button"
            onClick={onLogout}
            variant="ghost"
            className="w-full justify-start text-stone-300 hover:text-white hover:bg-stone-800"
          >
            <LogOut size={20} strokeWidth={1.5} className="mr-3" />
            Sair
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;