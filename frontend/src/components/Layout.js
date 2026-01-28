import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Building2, ArrowLeftRight, BarChart3, LogOut } from 'lucide-react';
import { Button } from './ui/button';

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

  return (
    <div className="flex min-h-screen bg-stone-100">
      <aside className="w-64 bg-stone-900 text-white flex flex-col">
        <div className="p-6 border-b border-stone-700">
          <h1 className="text-xl font-heading font-bold tracking-tight">HOSPEDE.AI Dashboard</h1>
          <p className="text-sm text-stone-400 mt-1">{user.name}</p>
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